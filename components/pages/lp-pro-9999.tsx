"use client";

/**
 * The ₦9,999/month ads landing page. Public, no login, payment happens on
 * this page. Design validated across nine rounds of iteration — see the
 * plan header for the artifact link.
 *
 * FIVE OPEN PRODUCT DECISIONS are marked inline with `{/* DECISION n *\/}`
 * comments, each rendering an honest placeholder until the real answer
 * lands. Search this file for "DECISION" to find every one.
 *
 * `SectionHeading` below is a local, page-only helper (not a new file —
 * see the plan's global constraint on not fragmenting this page into a
 * component-per-section tree). It exists purely to deduplicate one JSX
 * shape — an eyebrow pill + `<h2>`, centered, sometimes with a lede
 * paragraph — that otherwise repeats verbatim eight times below. It
 * changes no rendered output: same wrapper div, same classes, same DOM
 * shape as writing each section's header out by hand.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Instrument_Serif } from "next/font/google";
import { analytics } from "@/lib/analytics";
import { LP_9999_EVENTS } from "@/lib/analytics-events";
import { VideoPoster } from "@/components/pages/lp/video-poster";
import { TestimonialCard } from "@/components/pages/lp/testimonial-card";
import { InlineCheckout } from "@/components/pages/lp/inline-checkout";

// The hero headline's accent typeface — deliberately requested and
// reaffirmed twice in this project's design-review history. Imported
// directly here (rather than in the pass-through app/lp/pro-9999/layout.tsx)
// because next/font/google works in any component, and this avoids giving
// the layout a wrapping element it doesn't otherwise need. The font file is
// itself italic-only, so no Tailwind `italic`/`not-italic` utility is
// needed on the element that uses it.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  display: "swap",
});

// DECISION 5: real invite link needed — see plan Task 6 note below.
const WHATSAPP_URL = "https://chat.whatsapp.com/REPLACE_WITH_INVITE_LINK";
// The button only renders once this is a real invite link — otherwise a
// visitor who clicks it lands on WhatsApp's invalid-link error page.
const hasWhatsappLink = !WHATSAPP_URL.includes("REPLACE_WITH");

const COURSES = [
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
    body: "Practical, modern backend engineering skills employers actually want.",
    level: "Intermediate",
  },
  {
    eyebrow: "Enterprise",
    title: "Advanced Java",
    sub: "Systems that scale",
    body: "For scalable, enterprise-grade backend systems.",
    level: "Advanced",
  },
];

const WHO_THIS_IS_FOR = [
  "Beginners who want to start a tech career from zero",
  "Developers who want to level up into AI Engineering",
  "Backend engineers modernising with AntiGravity or Advanced Java",
  "Anyone chasing a remote job, a dollar-income role, or a career switch into tech",
  "Students and professionals who need flexible, self-paced, mobile-friendly learning",
];

const FAQ: { q: string; a: string; needsAnswer?: boolean }[] = [
  {
    q: "Do I need a powerful laptop or fast internet?",
    a: "No. Our courses are built to work well even on modest devices and average data speeds.",
  },
  {
    q: "I have zero coding experience. Can I still join?",
    a: "Yes. Our AI Engineering and Python tracks include a beginner path designed for complete starters.",
  },
  {
    q: "What if I don't have time to finish everything in a month?",
    a: "Your access continues as long as your subscription is active. Learn at your own pace, and pick up where you left off.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no lock-in contract, and you can cancel whenever you want.",
  },
  {
    q: "How do I pay?",
    a: "On this page. Enter your name and email, and a secure payment window opens over the page — you never get sent somewhere else, and you don’t create an account first.",
    needsAnswer: true, // DECISION 4: exact AsyncPay method list
  },
  {
    q: "Will my Naira card work?",
    a: "",
    needsAnswer: true, // DECISION 4
  },
  {
    q: "What happens if I miss a month?",
    a: "",
    needsAnswer: true, // DECISION 3: refund/lapse position not yet set
  },
];

/**
 * Deduplicates the repeated "eyebrow pill + centered h2 (+ optional lede
 * paragraph)" section header shape used across the page. Purely a JSX
 * shape extraction — every className, wrapper element and text string a
 * caller passes renders exactly as if written inline.
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
      <h2 className="mt-3 text-[clamp(28px,3.6vw,46px)] font-semibold tracking-tight">
        {heading}
      </h2>
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
    </div>
  );
}

export function LpPro9999Page() {
  useEffect(() => {
    analytics.track(LP_9999_EVENTS.viewed, {});
  }, []);

  const onWhatsappClick = () => {
    analytics.track(LP_9999_EVENTS.whatsappClicked, {});
  };
  // Shared by all three CTA anchors below (nav, hero, footer) — each call
  // site passes its own section name so lp9999_cta_clicked can actually
  // distinguish which one converted, instead of every click reading "hero".
  const onCtaClick = (section: string) => {
    analytics.track(LP_9999_EVENTS.ctaClicked, { section });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* NAV — matches the real app nav's chrome (bg-card, its shadow
          token, sticky) but drops search/notifications/avatar: there is no
          session on this route to show them for. */}
      <nav className="sticky top-0 z-30 bg-card shadow-[0_1px_2px_rgba(14,31,51,.06),0_4px_16px_rgba(14,31,51,.06)]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-5 px-4 sm:px-8 lg:px-12">
          <span className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
            <span className="h-[26px] w-[26px] rounded-md bg-[#0E1F33]" />
            masteringbackend.
          </span>
          <a
            href="#start"
            onClick={() => onCtaClick("nav")}
            className="rounded-full border border-input px-4 py-1.5 text-sm font-bold"
          >
            Secure your spot
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden bg-[#0E1F33] text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 py-20 text-center">
          <span className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs">
            Monthly subscription
          </span>
          <h1 className="mx-auto mt-3.5 max-w-[16ch] text-[clamp(35px,5.4vw,68px)] font-semibold leading-[1.06] tracking-tight">
            Become a backend or AI engineer{" "}
            <em className={`${instrumentSerif.className} text-primary`}>
              for the price of a data bundle.
            </em>
          </h1>
          <p className="mx-auto mt-5 max-w-[48ch] text-[16.5px] leading-relaxed text-white/72">
            Every Backend Engineering and AI Engineering course on
            Masteringbackend — Python, Advanced Java, AntiGravity, and AI
            Engineering from beginner to advanced — on one subscription.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#start"
              onClick={() => onCtaClick("hero")}
              className="rounded-full bg-primary px-7 py-3.5 text-base font-bold text-[#05262F] shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]"
            >
              Secure your spot — ₦9,999
            </a>
            {/* DECISION 5: WHATSAPP_URL is a placeholder — real invite
                link needed before launch. Hidden (not just broken) until
                hasWhatsappLink is true, so a real visitor never lands on
                WhatsApp's invalid-invite error page. */}
            {hasWhatsappLink ? (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onWhatsappClick}
                className="rounded-full border border-white/30 px-7 py-3.5 text-base font-bold"
              >
                Join the WhatsApp group
              </a>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-white/46">
            Pay on this page. No signup first. Cancel anytime.
          </p>

          <div className="mx-auto mt-10 max-w-3xl">
            <VideoPoster label="overview" aspect="wide" />
            {/* DECISION: hero overview Vimeo ID not yet supplied — see
                video-poster.tsx, which renders an honest note until then. */}
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 py-24">
        <SectionHeading
          eyebrow="The problem"
          heading="You want to break into tech. Here's what's stopping you."
        />
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground">
            You want to learn backend or AI engineering, but{" "}
            <b className="text-foreground">
              individual courses cost more than your monthly budget
            </b>
            .
          </p>
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground">
            You&apos;ve bought a course before and abandoned it — because it
            didn&apos;t fit how you learn, or life got in the way.
          </p>
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground">
            You&apos;re not sure which skill will actually get you hired.
            Python? Java? AI? All of them?
          </p>
          <p className="rounded border border-border bg-card p-5 text-[15.5px] text-muted-foreground">
            You want a skill that gets you a remote job or international
            clients,{" "}
            <b className="text-foreground">
              not a certificate that sits in your downloads folder
            </b>
            .
          </p>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-xl font-semibold tracking-tight">
          You don&apos;t need more motivation. You need one affordable
          subscription that removes every excuse.
        </p>
      </section>

      {/* OFFER */}
      <section className="bg-[#0E1F33] py-24 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="What's included"
            eyebrowVariant="outline"
            heading="Everything. One price. No stress."
            description="For ₦9,999 a month — less than a weekend of data and transport combined — you get full access to every track."
            descriptionClassName="mt-4 text-white/72"
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COURSES.map((c) => (
              <div key={c.title} className="rounded border border-white/12 bg-white/[0.04] p-6">
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

          <ul className="mx-auto mt-11 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              [
                "Structured learning paths",
                "so you never guess what to learn next",
              ],
              [
                "Project-based training",
                "built for real jobs, not just certificates",
              ],
              [
                "Beginner-friendly entry points",
                "so no coding experience is never an excuse",
              ],
              [
                "One login, one price",
                "switch tracks whenever you want",
              ],
            ].map(([bold, rest]) => (
              <li key={bold} className="flex gap-3 text-[15.5px] text-white/85">
                <span className="mt-0.5 text-primary">✓</span>
                <span>
                  <b>{bold}</b> {rest}
                </span>
              </li>
            ))}
          </ul>

          {/* DECISION 1 & 2: course-access wording and full offer scope */}
          <div className="mx-auto mt-8 max-w-3xl rounded border border-amber-700/40 bg-amber-950/40 p-4 text-[13.5px] text-amber-200">
            <b>Two open decisions:</b> the &quot;lifetime-style access to
            every new course&quot; claim stays removed until the accurate
            wording is confirmed — no version of it appears on this page
            yet. Separately, if ₦9,999 also unlocks projects, the code
            playground, mock interviews and certificates (not just these
            four courses), this list undersells the offer and should grow.
          </div>
        </div>
      </section>

      {/* TESTIMONIAL (single, featured) */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 py-24">
        <SectionHeading
          eyebrow="Testimonials"
          heading="What our students are saying."
        />
        <div className="mt-10">
          <TestimonialCard
            name="Stephen Oba"
            track="Masteringbackend learner"
            quote="the outcome, in the learner's own words — confirm with Stephen before this ships"
            isPlaceholderQuote
            // DECISION: Vimeo ID not yet supplied (real footage exists,
            // 171MB raw, "Learner Spotlight — Stephen Oba.mp4")
          />
        </div>
      </section>

      {/* WHY ₦9,999 */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 py-24">
        <SectionHeading
          eyebrow="Why ₦9,999"
          heading="Because we know the real barriers."
        />
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-5 text-[17px] leading-relaxed text-muted-foreground">
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

      {/* MORE TESTIMONIALS */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="More students"
            eyebrowVariant="background"
            heading="Different tracks. Same result."
            description="Shown side by side rather than in a carousel, because a carousel hides the second story behind a swipe almost nobody performs."
            descriptionClassName="mt-3 text-muted-foreground"
          />

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            <TestimonialCard
              name="Goodness Mbakara"
              track="AI engineering"
              quote="pull-quote for the AI Engineering track — confirm before shipping"
              isPlaceholderQuote
            />
            <TestimonialCard
              name="Ifechukwu Ogidi"
              track="Backend and Java"
              quote="pull-quote for the Backend and Java track — confirm before shipping"
              isPlaceholderQuote
            />
          </div>

          {/* DECISION: which of the 5 spotlight students map to which
              track, and their real quotes — filenames don't say. */}
          <div className="mx-auto mt-6 max-w-3xl rounded border border-amber-700/30 bg-amber-50 p-4 text-[13.5px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Five Learner Spotlight films exist — Goodness Mbakara,
            Ifechukwu Ogidi, Maximilian Ogbuabor, Stephen Oba, Tande
            Semeton — but the filenames don&apos;t say who is on which
            track, so these are placed by position, not by fact.
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 py-24">
        <SectionHeading
          eyebrow="Who this is for"
          heading="If this sounds like you, it's for you."
        />
        <ul className="mx-auto mt-10 max-w-2xl divide-y divide-border border-y border-border">
          {WHO_THIS_IS_FOR.map((line) => (
            <li key={line} className="flex gap-3 py-5 text-[16.5px] text-muted-foreground">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="How it works"
            eyebrowVariant="background"
            heading="Four steps. That's the whole thing."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "Pay on this page", "No account to create first."],
              ["2", "Pick your path", "Backend, AI Engineering, or both."],
              [
                "3",
                "Learn at your pace",
                "Structured lessons, real projects, practical skills.",
              ],
              [
                "4",
                "Get job-ready",
                "Build a portfolio that proves what you can do.",
              ],
            ].map(([n, title, body]) => (
              <div key={n} className="text-center">
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

      {/* CHECKOUT */}
      <section id="start" className="bg-[#0A1726] py-24 text-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-14 px-4 sm:px-8 lg:px-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs">
              Start today
            </span>
            <h2 className="mt-4 max-w-[15ch] text-[clamp(28px,3.6vw,46px)] font-semibold tracking-tight">
              Pay here. Start in the next minute.
            </h2>
            <p className="mt-4 max-w-[42ch] text-white/72">
              No account to create first, no verification email to go
              hunting for. Enter your name and email, pay, and your login
              details land in your inbox the moment the payment clears.
            </p>
            <p className="mt-5 text-xs text-white/46">
              Cancel anytime. No hidden fees. Full access from day one.
            </p>
          </div>
          <InlineCheckout />
        </div>

        {/* DECISION: backend provisioning gap — see plan Task 6 note
            below the component. */}
        <div className="mx-auto mt-10 max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <div className="rounded border border-amber-700/40 bg-amber-950/40 p-5 text-[13.5px] text-amber-200">
            <b>
              One backend change is required before this can take money:
            </b>{" "}
            AsyncPay will charge the card fine, but academy&apos;s{" "}
            <code>subscriptionSuccessful</code> webhook handler currently
            looks the buyer up and throws <code>User not found</code>{" "}
            rather than creating them — a paying stranger gets a debit
            and no account. <code>createTempUser</code> already exists and
            mints a confirmed user from a payment email; it is wired only
            into the Paddle customer event and one-off purchases today, not
            into subscription success. This must land before real ad spend
            runs against this page (tracked as a separate plan — it
            touches the payment webhook and deserves its own review).
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 py-24">
        <SectionHeading eyebrow="Questions" heading="Before you subscribe." />
        <div className="mx-auto mt-10 max-w-2xl">
          {FAQ.map(({ q, a, needsAnswer }) => (
            <details key={q} className="border-b border-border py-1 first:border-t">
              <summary className="cursor-pointer py-4 text-[17px] font-bold">
                {q}
              </summary>
              <p className="pb-5 text-[15.5px] text-muted-foreground">
                {needsAnswer ? (
                  <>
                    <b className="text-foreground">Answer needed.</b>{" "}
                    {a || "This objection is what actually decides a naira checkout, and the real answer needs to come from the team before this ships."}
                  </>
                ) : (
                  a
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0E1F33] py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[17px] font-bold">
              <span className="h-[26px] w-[26px] rounded-md bg-white/10" />
              masteringbackend.
            </span>
            <p className="text-sm text-white/46">Learn. Build. Grow.</p>
            <a
              href="#start"
              onClick={() => onCtaClick("footer")}
              className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold"
            >
              Start learning today
            </a>
          </div>
          <div
            aria-hidden="true"
            className="mt-10 select-none text-center text-[clamp(36px,10.5vw,116px)] font-bold leading-[0.88] tracking-tight text-white/[0.075]"
          >
            masteringbackend.
          </div>
        </div>
      </footer>
    </div>
  );
}
