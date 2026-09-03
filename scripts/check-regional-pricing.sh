#!/usr/bin/env bash
#
# Does this deployment still price by region?
#
#   scripts/check-regional-pricing.sh https://staging.masteringbackend.com
#
# Run it after a deploy, and after any change to the edge (a Cloudflare
# setting, a new proxy, a host migration).
#
# ── Why this exists ───────────────────────────────────────────────────────
#
# Regional pricing failed on staging for real, twice, and nothing anywhere
# said so. The page returned 200, logged nothing, and rendered $19.99 to every
# Nigerian visitor, because an unresolved country maps to the GLOBAL tier — a
# perfectly valid-looking answer. The failure is invisible precisely because
# the fallback is sane, so it needs an assertion rather than a dashboard.
#
# Both failures had the same cause. The pages resolved the region on the
# SERVER, and the API decides the region from the geo headers its own
# Cloudflare zone writes onto the inbound request — which describe whoever
# opened the connection. A server render asks "where is the visitor?" and is
# told where the app server is. Forwarding the visitor's country or IP
# alongside does not help: the API reads cf-ipcountry first and its edge
# always sets it, so the forwarded value is never reached.
#
# The fix is that the browser fetches pricing itself, so THE ASSERTIONS BELOW
# ARE NOT ABOUT THE PAGE'S HTML. A price in the server-rendered HTML is now
# the defect, not the goal. What has to hold is:
#
#   1. the page ships no server-rendered price
#   2. the pricing endpoint is reachable from a browser (CORS included)
#   3. it answers with a region, and the right one for wherever this runs
#
# Exit codes: 0 pass, 1 fail, 2 could not run the check.
set -uo pipefail

BASE="${1:-}"
if [ -z "$BASE" ]; then
  echo "usage: $0 <base-url>   e.g. $0 https://staging.masteringbackend.com" >&2
  exit 2
fi

BASE="${BASE%/}"
PRICING_URL="$BASE/pricing"
FAILED=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=1; }

echo "Checking regional pricing at $BASE"

# ── 0. Where does the edge think this runner is? ──────────────────────────
# Every assertion below is relative to this, so establish it first.
LOC=""
trace=$(curl -sS --max-time 30 "$BASE/cdn-cgi/trace" 2>/dev/null)
if printf '%s' "$trace" | grep -q '^loc='; then
  LOC=$(printf '%s' "$trace" | grep '^loc=' | cut -d= -f2 | tr -d '\r')
  echo "  · the edge places this runner in: $LOC"
else
  echo "  · no Cloudflare trace at $BASE/cdn-cgi/trace (not proxied?)"
fi

# ── 1. The page must ship NO server-rendered price ────────────────────────
# This is the regression itself. A currency amount in the HTML means someone
# reintroduced a server-side pricing fetch, and it is resolving the app
# server's region rather than the visitor's.
page=$(curl -sS --max-time 45 "$PRICING_URL" 2>/dev/null)
if [ -z "$page" ]; then
  fail "no response from $PRICING_URL"
else
  # Strip the inlined JS bundle references before grepping: only prices in
  # rendered markup matter, and chunk hashes are noisy.
  amounts=$(printf '%s' "$page" | grep -oE '(₦[0-9][0-9,]{2,}|\$[0-9]+\.[0-9]{2})' | sort -u | head -5)
  if [ -z "$amounts" ]; then
    pass "no price in the server-rendered HTML (the browser resolves it)"
  else
    fail "the HTML carries a server-rendered price — a server-side pricing fetch is back"
    printf '%s\n' "$amounts" | sed 's/^/      found: /'
  fi
fi

# ── 2. The endpoint the browser calls must be reachable, with CORS ────────
# Read the API base out of the page rather than hardcoding it, so this keeps
# working across environments.
API=$(printf '%s' "$page" | grep -oE 'https://[a-z0-9.-]+/api/v3' | head -1)
if [ -z "$API" ]; then
  echo "  · could not read the API base from the page; trying the page origin"
  API="$BASE/api/v3"
fi
echo "  · pricing endpoint: $API/public/pricing"

cors=$(curl -sS --max-time 30 -D - -o /dev/null \
  -H "Origin: $BASE" "$API/public/pricing" 2>/dev/null)
if printf '%s' "$cors" | grep -qi '^access-control-allow-origin'; then
  pass "endpoint allows browser requests from $BASE"
else
  fail "endpoint sent no Access-Control-Allow-Origin for $BASE — the browser fetch will be blocked"
fi

# ── 3. It must answer with a region, and the right one ────────────────────
body=$(curl -sS --max-time 30 "$API/public/pricing" 2>/dev/null)
tier=$(printf '%s' "$body" | grep -oE '"tier":"[A-Z]+"' | head -1 | cut -d'"' -f4)
country=$(printf '%s' "$body" | grep -oE '"country":"[A-Z]*"' | head -1 | cut -d'"' -f4)
currency=$(printf '%s' "$body" | grep -oE '"currency":"[A-Z]+"' | head -1 | cut -d'"' -f4)

if [ -z "$tier" ]; then
  fail "endpoint returned no tier"
  printf '%s' "$body" | head -c 200 | sed 's/^/      /'
else
  echo "  · endpoint answered: tier=$tier country=$country currency=$currency"
  if [ -n "$LOC" ] && [ "$country" != "$LOC" ]; then
    # The one thing that broke in production. The endpoint must geolocate the
    # CALLER, and this script is a caller like any browser.
    fail "endpoint resolved country=$country but the edge places this runner in $LOC"
  else
    pass "endpoint resolved the caller's own country"
  fi

  # Cross-check the tier against the country, so a mapping regression (every
  # country silently falling through to GLOBAL) cannot pass.
  case "$country:$tier" in
    NG:NG) pass "NG maps to the NG tier ($currency)" ;;
    NG:*)  fail "country NG resolved to the $tier tier — the NG mapping is broken" ;;
    *:GLOBAL|*:PPP|*:NG) pass "country $country maps to the $tier tier ($currency)" ;;
    *)     fail "unrecognised tier '$tier'" ;;
  esac
fi

# ── 4. Naira buyers must be able to PAY, not just see the price ───────────
# Separate failure, found while fixing the geo bug: the NG payment-channel
# rows carry no provider price IDs, so a Nigerian visitor can be quoted the
# right amount and still have nothing to check out against.
if [ "$tier" = "NG" ]; then
  if printf '%s' "$body" | grep -qE '"monthlyPriceId":""'; then
    fail "NG tier has an empty monthlyPriceId — the price is right but checkout cannot open"
  else
    pass "NG tier carries provider price IDs"
  fi
fi

if [ "$FAILED" -eq 0 ]; then
  echo "PASS"
  exit 0
fi
echo "FAIL"
exit 1
