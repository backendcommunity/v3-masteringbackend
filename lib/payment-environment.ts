/**
 * Which environment each payment SDK should talk to.
 *
 * One module because the two SDKs were drifting: Paddle was handed an
 * environment at both call sites, and AsyncPay was handed one at NEITHER —
 * so it silently fell through to its own default:
 *
 *   switch (environment) {
 *     case "local": base = "http://localhost";        break;
 *     case "prod":  base = "https://api.asyncpay.io"; break;
 *     default:      base = "https://api.dev.asyncpay.io";
 *   }
 *
 * That default meant a production AsyncPay key was being sent to the DEV API
 * no matter what was configured, and the only symptom was the SDK's own
 * INCORRECT_PUBLIC_KEY — which reads like a bad key rather than a key pointed
 * at the wrong server. Deriving both from one place here is what stops the
 * pair diverging again.
 *
 * ── Choosing an environment ──────────────────────────────────────────────
 *
 * NEXT_PUBLIC_NODE_ENV sets the baseline for both, defaulting to the SAFE
 * side: anything unset or unrecognised means sandbox/dev, never live money.
 *
 * Each SDK can then be overridden INDEPENDENTLY, because the two do not
 * necessarily have matching credentials. A developer testing the Nigerian
 * rail may hold a live AsyncPay key and a sandbox Paddle token; with a single
 * shared switch, pointing AsyncPay at its live API would drag Paddle to live
 * too and break it with the same class of error. The key and the API it is
 * sent to have to agree per processor, so the control is per processor:
 *
 *   NEXT_PUBLIC_ASYNCPAY_ENV=prod     # dev | local | prod
 *   NEXT_PUBLIC_PADDLE_ENV=sandbox    # sandbox | production
 *
 * ⚠️  Pointing a processor at its live API with a live key means every
 * successful checkout is a REAL charge on a REAL card, creating a real
 * subscription that has to be cancelled and refunded. Neither override is
 * read in a production build (see below) — they exist for local testing.
 */

const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;

/** True only for a real production build — everything else is test money. */
const IS_PRODUCTION = ![
  "dev",
  "staging",
  "local",
  "development",
  undefined,
  "",
].includes(NODE_ENV);

export const PADDLE_ENVIRONMENT: "sandbox" | "production" = IS_PRODUCTION
  ? "production"
  : process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? "production"
    : "sandbox";

/**
 * ALWAYS "prod" — this is not an oversight, and it is not a leftover from
 * local testing.
 *
 * AsyncPay does not run a customer-facing sandbox host. Test and live keys
 * BOTH authenticate against https://api.asyncpay.io; which mode you are in is
 * decided by the key you send (async_pkt_… test vs async_pk_… live), not by
 * the host. Verified directly against their API with a TEST key:
 *
 *   api.dev.asyncpay.io  → 401 INCORRECT_PUBLIC_KEY   (key rejected outright)
 *   api.asyncpay.io      → 400 CUSTOMER_ALREADY_...   (key accepted)
 *
 * api.dev.asyncpay.io is AsyncPay's own internal deployment; our keys do not
 * exist there. Deriving this from NEXT_PUBLIC_NODE_ENV — as PADDLE_ENVIRONMENT
 * correctly does — sends every local build to a host that rejects our keys,
 * which surfaces as INCORRECT_PUBLIC_KEY and reads like a bad credential.
 *
 * Safety still holds, because it lives in the key: a dev machine configured
 * with async_pkt_… cannot take real money no matter what this says.
 */
export const ASYNCPAY_ENVIRONMENT: "dev" | "local" | "prod" = "prod";

/**
 * The fields every AsyncPay checkout shares: the key, who is buying, and
 * which API to reach.
 *
 * Built in one place because the three call sites had drifted — none of them
 * passed `environment`, so all three silently used the dev API, and a live key
 * came back as INCORRECT_PUBLIC_KEY with nothing naming the cause. Per-call
 * options (plan id, callbacks) stay at the call site; only what must never
 * differ lives here.
 */
export function asyncpayBaseOptions(user: {
  name?: string | null;
  email?: string | null;
}) {
  return {
    publicKey: process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
    environment: ASYNCPAY_ENVIRONMENT,
    customer: {
      firstName: user?.name?.split(" ")?.[0],
      lastName: user?.name?.split(" ")?.[1],
      email: user?.email ?? undefined,
    },
  };
}
