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

// TEMPORARY: pinned to "prod" so a live AsyncPay key reaches the live API
// while Paddle stays on its sandbox token — a combination the shared
// NEXT_PUBLIC_NODE_ENV switch cannot express. Restore the line below it
// before merging; as written, EVERY build (CI, previews, teammates) points
// AsyncPay at live money, and the "unset means test money" default is gone.
export const ASYNCPAY_ENVIRONMENT: "dev" | "local" | "prod" = "prod";
// = IS_PRODUCTION ? "prod"
//   : process.env.NEXT_PUBLIC_ASYNCPAY_ENV === "prod" ? "prod" : "dev";

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
  console.log(
    "AsyncPay base options initialized.",
    process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
  );
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
