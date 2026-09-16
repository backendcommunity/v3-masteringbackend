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

// What one subscription opens, in the platform's own three stages.
// Every claim here is copied from the Pro column of /pricing
// (components/pages/pricing.tsx), so the two pages can never disagree
// about what a subscriber gets.
const PILLARS = [
  {
    stage: "Learn",
    heading: "Every course and learning path",
    body: "All paid courses on the platform, and structured learning paths that take you from fundamentals to production. Beginner entry points on every track.",
    items: [
      "All paid courses and learning paths",
      "Bootcamps and certification exams",
      "Beginner to advanced, at your own pace",
    ],
  },
  {
    stage: "Build",
    heading: "Real projects, not long videos",
    body: "You practise by building. Every project you submit gets a code review, and bite-size exercises in the playground keep you writing code between projects.",
    items: [
      "All projects, with code review on each submission",
      "Bite-size practice exercises in the playground",
      "A portfolio you can share with employers",
    ],
  },
  {
    stage: "Grow",
    heading: "Get ready for the job",
    body: "Practise the interview before you sit it, build a profile employers can check, and ask questions in a community of people doing the same thing.",
    items: [
      "Unlimited AI mock interviews, up to 30 minutes each",
      "A professional profile and shareable portfolio",
      "Community forum access",
    ],
  },
];

// The catalog, from GET /public/courses on 2026-09-16
// (courses.masteringbackend.com), plus the four tracks the campaign leads
// with. Shown as chips under Learn: proof of depth, not the whole offer.
const COURSE_NAMES = [
  "AI Engineering",
  "Python Programming",
  "AntiGravity",
  "Advanced Java",
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
  {
    title: "Complete beginners",
    body: "You have not written code before. The paths start from foundations and the beginner tracks are built for you.",
  },
  {
    title: "Career switchers",
    body: "You are moving from another field, or another corner of tech, and you need the whole route mapped out.",
  },
  {
    title: "Working engineers",
    body: "You ship already and want AI engineering, or a stronger backend, inside your range.",
  },
  {
    title: "Students and graduates",
    body: "No employment history needed. Build the portfolio while you study.",
  },
];

// Six Learner Spotlight films from the Masteringbackend YouTube channel.
// Names, roles and quotes for four of them come from the graduate data on
// the MasteringAI scholarship page (lib/scholarship.ts), so a visitor can
// look these people up before paying. The remaining two carry the video's
// own title until we have the learner's name.
const TESTIMONIALS = [
  {
    youtubeId: "FwNvNAMpuF8",
    title: "Max landed a job right after our bootcamp training",
    name: "Maximilian Ogbuabor",
    role: "Backend engineer",
    quote:
      "Literally immediately after the bootcamp I got a gig to build a full-stack application for an NGO. This is my first big gig.",
  },
  {
    youtubeId: "HX7vyFqATlk",
    title: "From complete beginner to building backend systems with Python",
  },
  {
    youtubeId: "YP1hx2Wlaqs",
    title: "Scaling an AI system to 1 million users",
    name: "Ifechukwu Ogidi",
    role: "Backend engineer, 4+ years building systems",
    quote:
      "We went from core backend principles to RAG systems, embeddings, vector databases and agentic systems. It gave me the tools to build AI systems from the ground up.",
  },
  {
    youtubeId: "C5V2e4sjDvo",
    title: "From a novice to a backend engineer",
  },
  {
    youtubeId: "85AdK_S7bxY",
    title: "AI Engineering became less of a mystery to me",
    name: "Maximilian Ogbuabor",
    role: "On the curriculum",
    quote:
      "We didn't just jump into AI. We spent a decent amount of time learning to build a production-ready backend system, and that is knowledge I apply today.",
  },
  {
    youtubeId: "kseZZTywxpc",
    title: "I learned how to communicate and build AI systems effectively",
    name: "Stephen Oba",
    role: "Backend engineer",
    quote:
      "There were a lot of concepts in AI engineering I had struggled with, especially in the RAG space. These weeks gave me an understanding of how to build secure, robust systems that solve real problems.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What exactly do I get for the subscription?",
    a: "The whole platform. Every paid course and learning path, all projects with a code review on each submission, bite-size practice exercises in the playground, unlimited AI mock interviews of up to 30 minutes each, bootcamps and certification exams, a professional profile and portfolio, and the community forum.",
  },
  {
    q: "Is there a higher tier I am missing?",
    a: "No. This is Pro, and Pro is everything an individual learner can get. The only other plan is Enterprise, which exists so companies can buy seats for a team and manage them together. Nothing is held back from you for a higher tier.",
  },
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
            Start learning
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden bg-[#0E1F33] text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 text-center sm:px-8 lg:px-12">
          <span className="eyebrow-mono text-[#4AC5E8]">masteringbackend pro</span>
          <h1 className="mx-auto mt-3 max-w-5xl text-balance text-[clamp(32px,5vw,56px)] font-semibold leading-[0.98] tracking-tight">
            Become a backend or AI engineer
            <br />
            <em className={`${instrumentSerif.className} text-primary`}>
              for the price of data.
            </em>
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[16.5px] leading-relaxed text-white/72">
            Masteringbackend has trained backend engineers since 2021. One
            subscription, {price} a month, opens the whole platform: every
            course and learning path, real projects with code review,
            practice exercises, AI mock interviews, bootcamps and the
            community. Nothing is held back for a higher tier.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => openCheckout("hero")}
              className={`${CTA_CLASS} px-7 py-3.5 text-base shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]`}
            >
              Start learning for {price}
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
            Pay in naira on this page. No signup first. Cancel any time, and
            your progress and certificates stay on your profile.
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

      {/* WHAT YOU GET */}
      <section className="bg-[#0E1F33] py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="What you get"
            eyebrowVariant="outline"
            heading="Everything. One price. No stress."
            description={`${price} a month, less than a weekend of data and transport, opens the whole platform. Learn it, build it, then get hired for it.`}
            descriptionClassName="mt-4 text-white/72"
          />

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.stage}
                className="rounded border border-white/12 bg-white/[0.04] p-6 transition-colors duration-200 hover:border-primary/40 hover:bg-white/[0.06]"
              >
                <div className="text-[11px] text-primary">{pillar.stage}</div>
                <h3 className="mt-2.5 text-xl font-bold">{pillar.heading}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-white/72">
                  {pillar.body}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5 border-t border-white/12 pt-4">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14px] text-white/85">
                      <span className="mt-0.5 text-primary">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <p className="text-center text-sm text-white/55">
              The courses and tracks you can start today
            </p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {COURSE_NAMES.map((title) => (
                <li
                  key={title}
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/85"
                >
                  {title}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-[15.5px] text-white/72">
              One login, one price, every stage. Switch tracks whenever you
              want.
            </p>
          </div>
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
              one small monthly payment unlocks the entire platform
            </b>
            : the courses, the projects you build, the code review on each
            one, and the mock interviews you sit before the real thing.
          </p>
          <p>
            No laptop wahala. No wondering which course to buy. No
            half-finished bootcamps. And nothing held back for a tier you
            cannot afford.
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
            description="Six learners on what changed for them, named where they agreed to be, so you can look them up before you decide. Tap any one to watch."
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
          heading="Beginners and working engineers, both."
          description="There is no experience requirement. The learning paths start from foundations and run to production systems, so they hold people arriving from different places."
          descriptionClassName="mt-4 text-muted-foreground"
        />
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {WHO_THIS_IS_FOR.map((who) => (
            <div
              key={who.title}
              className="rounded border border-border bg-card p-5 transition-colors duration-200 hover:border-primary/30"
            >
              <h3 className="text-[17px] font-bold">{who.title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                {who.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="How it works"
            eyebrowVariant="background"
            heading="Three steps to your first lesson."
          />
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              ["1", "Pay on this page", "Your name, your email, and a secure naira payment window. About two minutes, and no account to create first."],
              ["2", "Check your inbox", "Your login details land the moment the payment clears."],
              ["3", "Pick a path and start", "Choose backend, AI engineering, or both, and begin the first lesson today."],
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
              Start learning in the next minute.
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

      {/* MISSION */}
      <section className="border-t border-border bg-muted/40 py-12">
        <p className="mx-auto max-w-[46ch] px-4 text-balance text-center text-[17px] leading-relaxed text-muted-foreground">
          Our mission is to make backend and AI engineering skills
          affordable for young Africans.
        </p>
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
              Start learning for {price}
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
