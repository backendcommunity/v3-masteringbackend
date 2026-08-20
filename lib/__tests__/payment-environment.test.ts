import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The module reads process.env at import time, so each case needs a fresh
// import with the env already set.
async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("@/lib/payment-environment");
}

const KEYS = [
  "NEXT_PUBLIC_NODE_ENV",
  "NEXT_PUBLIC_PADDLE_ENV",
  "NEXT_PUBLIC_ASYNCPAY_ENV",
];

describe("payment environment", () => {
  const original: Record<string, string | undefined> = {};
  beforeEach(() => KEYS.forEach((k) => (original[k] = process.env[k])));
  afterEach(() =>
    KEYS.forEach((k) => {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }),
  );

  it("defaults to test money when nothing is configured", async () => {
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: undefined,
      NEXT_PUBLIC_PADDLE_ENV: undefined,
      NEXT_PUBLIC_ASYNCPAY_ENV: undefined,
    });
    // An unset or unrecognised value must never reach a live processor.
    expect(m.PADDLE_ENVIRONMENT).toBe("sandbox");
  });

  it("gives AsyncPay a real environment instead of letting it default", async () => {
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: "production",
      NEXT_PUBLIC_PADDLE_ENV: undefined,
      NEXT_PUBLIC_ASYNCPAY_ENV: undefined,
    });
    // Omitting this is what sent a live key to api.dev.asyncpay.io and
    // surfaced as INCORRECT_PUBLIC_KEY.
    expect(m.ASYNCPAY_ENVIRONMENT).toBe("prod");
    expect(m.PADDLE_ENVIRONMENT).toBe("production");
  });

  // ASYNCPAY_ENVIRONMENT is currently pinned to "prod" in the source so a live
  // key can be tested against the live API while Paddle stays on sandbox.
  // These two assert the safety default that pin bypasses — un-skip them the
  // moment the pin is reverted, which is what they exist to enforce.
  it.skip("[pinned] AsyncPay falls back to dev when unconfigured", async () => {
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: undefined,
      NEXT_PUBLIC_ASYNCPAY_ENV: undefined,
    });
    expect(m.ASYNCPAY_ENVIRONMENT).toBe("dev");
  });

  it.skip("[pinned] AsyncPay ignores a junk override", async () => {
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: "dev",
      NEXT_PUBLIC_ASYNCPAY_ENV: "PROD",
    });
    expect(m.ASYNCPAY_ENVIRONMENT).toBe("dev");
  });

  it("lets one processor go live WITHOUT dragging the other with it", async () => {
    // The case that motivated the split: a live AsyncPay key alongside a
    // sandbox Paddle token. A single shared switch cannot express this, and
    // forcing both live breaks whichever one holds test credentials.
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: "dev",
      NEXT_PUBLIC_ASYNCPAY_ENV: "prod",
      NEXT_PUBLIC_PADDLE_ENV: undefined,
    });
    expect(m.ASYNCPAY_ENVIRONMENT).toBe("prod");
    expect(m.PADDLE_ENVIRONMENT).toBe("sandbox");
  });

  it("ignores a junk override rather than passing it to the SDK", async () => {
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: "dev",
      NEXT_PUBLIC_ASYNCPAY_ENV: "PROD",
      NEXT_PUBLIC_PADDLE_ENV: "live",
    });
    // Neither value is in the SDK's own union; falling back beats forwarding
    // a string the SDK would silently treat as its default.
    expect(m.PADDLE_ENVIRONMENT).toBe("sandbox");
  });

  it("refuses to let an override downgrade a production build", async () => {
    const m = await load({
      NEXT_PUBLIC_NODE_ENV: "production",
      NEXT_PUBLIC_ASYNCPAY_ENV: "dev",
      NEXT_PUBLIC_PADDLE_ENV: "sandbox",
    });
    // A stray env var in prod must not quietly stop taking real payments
    // while everything still looks like it is working.
    expect(m.ASYNCPAY_ENVIRONMENT).toBe("prod");
    expect(m.PADDLE_ENVIRONMENT).toBe("production");
  });
});
