"use client";

/**
 * The ₦9,999/month ads landing page. Public, no login, payment happens on
 * this page. Every CTA opens the checkout dialog (name, email, then the
 * payment SDK's own secure window); the bottom of the page carries the
 * same form inline for people who scroll the whole way.
 *
 * Pricing: the page owns one useLpCheckout() call. The price the copy
 * names, the price the card shows and the price the SDK charges all come
 * from that single regional response, so a visitor in Nigeria sees ₦9,999
 * and is charged the ₦9,999 AsyncPay plan, and a visitor anywhere else
 * sees their own tier throughout. Nothing on the charge path is hardcoded.
 *
 * `SectionHeading` is a local, page-only helper that deduplicates one JSX
 * shape (eyebrow pill + centered h2, optional lede) used by every section.
 */
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Instrument_Serif } from "next/font/google";
import { analytics } from "@/lib/analytics";
import { LP_9999_EVENTS } from "@/lib/analytics-events";
import { TestimonialCard } from "@/components/pages/lp/testimonial-card";
import { InlineCheckout } from "@/components/pages/lp/inline-checkout";
import { CheckoutDialog } from "@/components/pages/lp/checkout-dialog";
import { useLpCheckout } from "@/hooks/use-lp-checkout";

// The hero headline's accent typeface, chosen deliberately in design
// review. Imported here rather than in the pass-through layout because
// next/font/google works in any component. The font file is italic-only,
// so no Tailwind italic utility is needed on the element that uses it.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  display: "swap",
});

const WHATSAPP_URL = "https://chat.whatsapp.com/Dqo9AdnXyI4IoSfo1h0YLH?mode=gi_t";

// The four tracks the campaign leads with, in the brief's words.
const FEATURED_COURSES = [
  {
    eyebrow: "Artificial intelligence",
    title: "AI Engineering",
    sub: "Beginner to advanced",
    body: "Go from zero to building real AI-powered applications.",
    level: "Beginner",
  },
  {
    eyebrow: "Languages",
    title: "Python Programming",
    sub: "The hiring language",
    body: "The most in-demand language for backend, AI and automation roles.",
    level: "Beginner",
  },
  {
    eyebrow: "Backend skills",
    title: "AntiGravity",
    sub: "For backend engineers",
    body: "The modern backend engineering skills employers actually hire for.",
    level: "Intermediate",
  },
  {
    eyebrow: "Enterprise",
    title: "Advanced Java",
    sub: "Systems that scale",
    body: "Build the enterprise-grade backend systems big companies run on.",
    level: "Advanced",
  },
];

// The rest of the catalog, from GET /public/courses on 2026-09-16
// (courses.masteringbackend.com). Advanced Java is above, so it is not
// repeated here.
const MORE_COURSES = [
  "Python Essentials",
  "Advanced Python",
  "Ship 30 Python Projects in 30 Days",
  "Mastering Django: From Basics to Advanced",
  "Java Essentials",
  "Design Patterns in Java",
  "Node.js Essentials",
  "Rust Essentials",
];

const WHO_THIS_IS_FOR = [
  "Beginners starting a tech career from zero",
  "Developers levelling up into AI Engineering",
  "Backend engineers modernising with AntiGravity or Advanced Java",
  "Anyone chasing a remote job, a dollar-income role, or a career switch into tech",
  "Students and professionals who need flexible, self-paced, mobile-friendly learning",
];

// Six Learner Spotlight films from the Masteringbackend YouTube channel.
// Titles are the videos' own, trimmed of the "Learner Spotlight:" prefix.
const TESTIMONIALS = [
  {
    youtubeId: "FwNvNAMpuF8",
    title: "Max landed a job right after our bootcamp training",
  },
  {
    youtubeId: "HX7vyFqATlk",
    title: "From complete beginner to building backend systems with Python",
  },
  {
    youtubeId: "YP1hx2Wlaqs",
    title: "Scaling an AI system to 1 million users",
  },
  {
    youtubeId: "C5V2e4sjDvo",
    title: "From a novice to a backend engineer",
  },
  {
    youtubeId: "85AdK_S7bxY",
    title: "AI Engineering became less of a mystery to me",
  },
  {
    youtubeId: "kseZZTywxpc",
    title: "I learned how to communicate and build AI systems effectively",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I pay?",
    a: "Right here on this page. Enter your name and email, and a secure payment window opens. Pay in naira with your debit card (Verve, Mastercard or Visa) or by bank transfer. You never leave the page, and you don't create an account first.",
  },
  {
    q: "Will my Naira card work?",
    a: "Yes. Payments are processed in naira by AsyncPay, which is built for Nigerian cards. Verve, Mastercard and Visa debit cards all work, and bank transfer is there if your card gives you trouble.",
  },
  {
    q: "Do I need a powerful laptop or fast internet?",
    a: "No. Our courses are built to work well on modest devices and average data speeds.",
  },
  {
    q: "I have zero coding experience. Can I still join?",
    a: "Yes. The AI Engineering and Python tracks include a beginner path designed for complete starters.",
  },
  {
    q: "What if I don't finish everything in a month?",
    a: "Your access continues for as long as your subscription is active. Learn at your own pace and pick up where you left off.",
  },
  {
    q: "What happens if I miss a month?",
    a: "Your access pauses at the end of the month you paid for. Your progress, certificates and account stay exactly where you left them. Subscribe again whenever you're ready and continue from the same lesson.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no lock-in contract. Cancel whenever you want and you won't be charged again.",
  },
];

/**
 * Deduplicates the repeated "eyebrow pill + centered h2 (+ optional lede
 * paragraph)" section header used across the page.
 */
function SectionHeading({
  eyebrow,
  eyebrowVariant = "muted",
  heading,
  description,
  descriptionClassName,
}: {
  eyebrow: string;
  eyebrowVariant?: "muted" | "outline" | "background";
  heading: ReactNode;
  description?: ReactNode;
  descriptionClassName?: string;
}) {
  const eyebrowClassName =
    eyebrowVariant === "outline"
      ? "rounded-full border border-white/25 px-3.5 py-1.5 text-xs"
      : eyebrowVariant === "background"
        ? "rounded-full bg-background px-3.5 py-1.5 text-xs"
        : "rounded-full bg-muted px-3.5 py-1.5 text-xs";

  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className={eyebrowClassName}>{eyebrow}</span>
      <h2 className="mt-2 text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight">
        {heading}
      </h2>
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
    </div>
  );
}

const CTA_CLASS =
  "inline-flex items-center justify-center rounded-full bg-primary font-bold text-[#05262F] transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0";

export function LpPro9999Page() {
  useEffect(() => {
    analytics.track(LP_9999_EVENTS.viewed, {});
  }, []);

  // One pricing fetch for the whole page (see the file comment).
  const checkout = useLpCheckout();
  // Loading placeholder for decorative copy only. The Pay button and the
  // SDK call never read this literal; they wait for the real price.
  const price = checkout.priceLabel || "₦9,999";

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Every CTA opens the dialog and records which one did.
  const openCheckout = useCallback((section: string) => {
    analytics.track(LP_9999_EVENTS.ctaClicked, { section });
    setCheckoutOpen(true);
  }, []);

  const onWhatsappClick = () => {
    analytics.track(LP_9999_EVENTS.whatsappClicked, {});
  };

  return (
    <div className="min-h-screen bg-background">
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        checkout={checkout}
      />

      {/* NAV. The real app nav's chrome (bg-card, its shadow token, sticky)
          without search, notifications or avatar: no session on this route. */}
      <nav className="sticky top-0 z-30 bg-card shadow-[0_1px_2px_rgba(14,31,51,.06),0_4px_16px_rgba(14,31,51,.06)]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-5 px-4 sm:px-6">
          <span className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
            <img src="/blue-icon-logo.png" alt="" className="h-6 w-6 object-contain" />
            masteringbackend.
          </span>
          <button
            type="button"
            onClick={() => openCheckout("nav")}
            className={`${CTA_CLASS} px-4 py-3 text-sm`}
          >
            Secure your spot
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden bg-[#0E1F33] text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 text-center sm:px-8 lg:px-12">
          <span className="eyebrow-mono text-[#4AC5E8]">monthly subscription</span>
          <h1 className="mx-auto mt-3 max-w-5xl text-balance text-[clamp(32px,5vw,56px)] font-semibold leading-[0.98] tracking-tight">
            Become a backend or AI engineer
            <br />
            <em className={`${instrumentSerif.className} text-primary`}>
              for the price of data.
            </em>
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[16.5px] leading-relaxed text-white/72">
            Python, Advanced Java, AntiGravity and AI Engineering, from
            beginner to advanced. Every course on Masteringbackend, one
            subscription.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => openCheckout("hero")}
              className={`${CTA_CLASS} px-7 py-3.5 text-base shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]`}
            >
              Secure your spot for {price}
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsappClick}
              className="inline-flex items-center rounded-full border border-white/30 px-7 py-3.5 text-base font-bold transition-colors duration-200 hover:bg-white/10"
            >
              Join the WhatsApp group
            </a>
          </div>
          <p className="mt-3 text-xs text-white/46">
            Pay in naira on this page. No signup first. Cancel anytime.
          </p>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="The problem"
          heading="You want to break into tech. Here's what's stopping you."
        />
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground transition-colors duration-200 hover:border-primary/30">
            You want to learn backend or AI engineering, but{" "}
            <b className="text-foreground">
              individual courses cost more than your monthly budget
            </b>
            .
          </p>
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground transition-colors duration-200 hover:border-primary/30">
            You&apos;ve bought a course before and abandoned it because it
            didn&apos;t fit how you learn, or life got in the way.
          </p>
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground transition-colors duration-200 hover:border-primary/30">
            You&apos;re not sure which skill will actually get you hired.
            Python? Java? AI? All of them?
          </p>
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground transition-colors duration-200 hover:border-primary/30">
            You want a skill that gets you a remote job or international
            clients,{" "}
            <b className="text-foreground">
              not a certificate that sits in your downloads folder
            </b>
            .
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-balance text-center text-xl font-semibold tracking-tight">
          You don&apos;t need more motivation. You need one affordable
          subscription that removes every excuse.
        </p>
      </section>

      {/* OFFER */}
      <section className="bg-[#0E1F33] py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="What's included"
            eyebrowVariant="outline"
            heading="Everything. One price. No stress."
            description={`For ${price} a month, less than a weekend of data and transport, you get every track.`}
            descriptionClassName="mt-4 text-white/72"
          />

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_COURSES.map((c) => (
              <div
                key={c.title}
                className="rounded border border-white/12 bg-white/[0.04] p-6 transition-colors duration-200 hover:border-primary/40 hover:bg-white/[0.06]"
              >
                <div className="text-[11px] text-primary">{c.eyebrow}</div>
                <h3 className="mt-2.5 text-lg font-bold">{c.title}</h3>
                <p className="mt-2 text-[13px] text-white/55">{c.sub}</p>
                <p className="mt-2.5 text-sm text-white/72">{c.body}</p>
                <div className="mt-4 border-t border-white/12 pt-3 text-xs text-white/55">
                  {c.level} · Full track
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <p className="text-center text-sm text-white/55">
              Also in your subscription
            </p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {MORE_COURSES.map((title) => (
                <li
                  key={title}
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/85"
                >
                  {title}
                </li>
              ))}
            </ul>
          </div>

          <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["Structured learning paths", "so you never guess what to learn next"],
              ["Project-based training", "built for real jobs, not just certificates"],
              ["Beginner-friendly entry points", "so “no coding experience” is never an excuse"],
              ["One login, one price", "switch tracks whenever you want"],
            ].map(([bold, rest]) => (
              <li key={bold} className="flex gap-3 text-[15.5px] text-white/85">
                <span className="mt-0.5 text-primary">✓</span>
                <span>
                  <b>{bold}</b> {rest}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow={`Why ${price}`}
          heading="Because we know the real barriers."
        />
        <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-5 text-[17px] leading-relaxed text-muted-foreground">
          <p>
            We built this for the Nigerian tech learner: someone juggling
            data costs, unstable power and a tight budget, but who refuses
            to give up on a tech career.
          </p>
          <p>
            One course used to mean one payment for one skill. Now{" "}
            <b className="text-foreground">
              one small monthly payment unlocks the entire academy
            </b>
            , so you can explore, switch tracks and build the exact skill
            set that gets you hired.
          </p>
          <p>
            No laptop wahala. No wondering which course to buy. No
            half-finished bootcamps.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Student stories"
            eyebrowVariant="background"
            heading="Hear it from people who did it."
            description="Six learners, in their own words. Tap any one to watch."
            descriptionClassName="mt-3 text-muted-foreground"
          />
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.youtubeId} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Who this is for"
          heading="If this sounds like you, it's for you."
        />
        <ul className="mx-auto mt-8 max-w-2xl divide-y divide-border border-y border-border">
          {WHO_THIS_IS_FOR.map((line) => (
            <li
              key={line}
              className="flex gap-3 py-4 text-[16.5px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <span className="mt-0.5 text-primary">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="How it works"
            eyebrowVariant="background"
            heading="Four steps. That's the whole thing."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "Pay on this page", "Name, email, pay in naira. No account to create first."],
              ["2", "Pick your path", "Backend, AI Engineering, or both."],
              ["3", "Learn at your pace", "Structured lessons, real projects, practical skills."],
              ["4", "Get job-ready", "Build a portfolio that proves what you can do."],
            ].map(([n, title, body]) => (
              <div key={n} className="text-center transition-transform duration-200 hover:-translate-y-1">
                <div className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-full border border-border bg-background font-mono text-base text-primary">
                  {n}
                </div>
                <h3 className="mt-3 text-[17.5px] font-bold">{title}</h3>
                <p className="mt-2 text-[13.5px] text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHECKOUT (inline, for people who scroll the whole way) */}
      <section id="start" className="scroll-mt-14 bg-[#0A1726] py-16 text-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12">
          <div>
            <span className="eyebrow-mono text-[#4AC5E8]">start today</span>
            <h2 className="mt-3 max-w-[15ch] text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight">
              Pay here. Start in the next minute.
            </h2>
            <p className="mt-4 max-w-[42ch] text-white/72">
              No account to create first, no verification email to go hunting
              for. Enter your name and email, pay in naira, and your login
              details land in your inbox the moment the payment clears.
            </p>
            <p className="mt-5 text-xs text-white/46">
              Cancel anytime. No hidden fees. Full access from day one.
            </p>
          </div>
          <InlineCheckout checkout={checkout} />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading eyebrow="Questions" heading="Before you subscribe." />
        <div className="mx-auto mt-8 max-w-2xl">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group border-b border-border py-1 first:border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-bold transition-colors duration-200 hover:text-primary [&::-webkit-details-marker]:hidden">
                {q}
                <span className="shrink-0 text-xl font-normal text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-[15.5px] text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0E1F33] py-12 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[17px] font-bold">
              <img src="/logo-white-icon.png" alt="" className="h-6 w-6 object-contain" />
              masteringbackend.
            </span>
            <p className="text-sm text-white/46">Learn. Build. Grow.</p>
            <button
              type="button"
              onClick={() => openCheckout("footer")}
              className="inline-flex items-center rounded-full border border-white/30 px-5 py-3 text-sm font-bold transition-colors duration-200 hover:bg-white/10"
            >
              Start learning today
            </button>
          </div>
          <div
            aria-hidden="true"
            className="mt-8 select-none text-center text-[clamp(36px,10.5vw,116px)] font-bold leading-[0.88] tracking-tight text-white/[0.075]"
          >
            masteringbackend.
          </div>
        </div>
      </footer>
    </div>
  );
}
