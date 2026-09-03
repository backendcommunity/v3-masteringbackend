#!/usr/bin/env bash
#
# Does this deployment still price by region?
#
# Run it against staging or production after a deploy, and after any change to
# the edge (Cloudflare transforms, a new proxy, a host migration).
#
#   scripts/check-regional-pricing.sh https://staging.masteringbackend.com
#
# ── Why this exists ───────────────────────────────────────────────────────
#
# Regional pricing failed on staging for real, and nothing anywhere said so.
# Cloudflare knew the visitor was in Nigeria (/cdn-cgi/trace returned loc=NG)
# but was not adding CF-IPCountry to the origin request. The server render
# forwarded no country and no visitor IP, the API geolocated the frontend
# server instead of the person, and an unresolved country maps to the GLOBAL
# tier — a perfectly valid-looking answer. Every Nigerian visitor was quoted
# USD, on a page that returned 200 with no error in any log.
#
# The failure is invisible precisely because the fallback is sane, so it needs
# an assertion rather than a dashboard.
#
# Exit codes: 0 pass, 1 fail, 2 could not run the check.
set -uo pipefail

BASE="${1:-}"
if [ -z "$BASE" ]; then
  echo "usage: $0 <base-url>   e.g. $0 https://staging.masteringbackend.com" >&2
  exit 2
fi

PRICING_URL="${BASE%/}/pricing"
FAILED=0

fetch() {
  # $1 = label, $2..= extra curl args
  local label="$1"; shift
  local body
  body=$(curl -sS --max-time 45 "$@" "$PRICING_URL" 2>/dev/null)
  if [ -z "$body" ]; then
    echo "  ✗ $label: no response from $PRICING_URL"
    FAILED=1
    return 1
  fi
  printf '%s' "$body"
}

echo "Checking regional pricing at $PRICING_URL"

# ── 1. A Nigerian visitor must be quoted naira ────────────────────────────
# CF-IPCountry is what the edge is expected to add. If the deployment honours
# it, the page renders NGN.
if body=$(fetch "NG" -H "CF-IPCountry: NG"); then
  if printf '%s' "$body" | grep -q '₦'; then
    echo "  ✓ NG renders naira"
  else
    echo "  ✗ NG did NOT render naira — the country header is not reaching pricing"
    printf '%s' "$body" | grep -oE '\$[0-9]+\.[0-9]{2}' | sort -u | head -3 | sed 's/^/      served: /'
    FAILED=1
  fi
fi

# ── 2. A global visitor must still be quoted USD ──────────────────────────
# Guards the opposite mistake: a change that hard-codes one region.
if body=$(fetch "US" -H "CF-IPCountry: US"); then
  if printf '%s' "$body" | grep -qE '\$[0-9]+\.[0-9]{2}'; then
    echo "  ✓ US renders USD"
  else
    echo "  ✗ US did NOT render USD"
    FAILED=1
  fi
fi

# ── 3. The two must actually differ ───────────────────────────────────────
# If the page ignores the header entirely, checks 1 and 2 can both pass on a
# page that renders the same thing every time.
ng=$(curl -sS --max-time 45 -H "CF-IPCountry: NG" "$PRICING_URL" 2>/dev/null | grep -oE '₦[0-9,]+' | head -1)
us=$(curl -sS --max-time 45 -H "CF-IPCountry: US" "$PRICING_URL" 2>/dev/null | grep -oE '\$[0-9]+\.[0-9]{2}' | head -1)
if [ -n "$ng" ] && [ -n "$us" ]; then
  echo "  ✓ tiers differ (NG $ng vs GLOBAL $us)"
else
  echo "  ✗ tiers did not differ — NG='$ng' US='$us'"
  FAILED=1
fi

# ── 4. Is the edge actually adding the header? ────────────────────────────
# Checks 1-3 prove the app honours a header we sent ourselves. This is the
# part that broke in production: the edge has to add it unprompted.
trace=$(curl -sS --max-time 30 "${BASE%/}/cdn-cgi/trace" 2>/dev/null)
if printf '%s' "$trace" | grep -q '^loc='; then
  loc=$(printf '%s' "$trace" | grep '^loc=' | cut -d= -f2)
  echo "  · Cloudflare sees this runner in: $loc"
  echo "    (if the unheadered page below disagrees with $loc, the edge is not"
  echo "     adding CF-IPCountry — turn on 'Add visitor location headers')"
  plain=$(curl -sS --max-time 45 "$PRICING_URL" 2>/dev/null)
  if [ "$loc" = "NG" ]; then
    if printf '%s' "$plain" | grep -q '₦'; then
      echo "  ✓ unheadered request from NG renders naira — the edge IS adding the header"
    else
      echo "  ✗ unheadered request from NG renders USD — the edge is NOT adding the header"
      FAILED=1
    fi
  fi
fi

if [ "$FAILED" -eq 0 ]; then
  echo "PASS"
  exit 0
fi
echo "FAIL"
exit 1
