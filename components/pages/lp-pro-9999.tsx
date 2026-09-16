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

// The two learning paths that run end to end in production, with every
// milestone in order, from GET /public/roadmaps and GET /roadmap/:slug on
// prod.masteringbackend.com, 2026-09-16.
//
// The Node.js and Rust paths are deliberately NOT listed: each carries a
// single Essentials milestone today, and a buyer who picks one expecting a
// route to a job would find one course. Their Essentials courses are in the
// course list below, which is what they honestly are.
//
// There is no standalone AI Engineering path in production. AI Engineering
// is a milestone inside the Python path and a course of its own, so that is
// how the page shows it. Nothing here promises a path that does not exist.
const LEARNING_PATHS = [
  {
    title: "Become a Python Backend Engineer",
    summary:
      "The full route, from your first line of Python to shipping and defending a production system with AI in it.",
    milestones: [
      "Python Foundations",
      "Backend Engineering Core",
      "Building Backend Systems",
      "Production Infrastructure",
      "AI Engineering with Python",
      "Ship and defend",
    ],
    /** Milestones worth calling out by name in the campaign. */
    highlight: ["AI Engineering with Python"],
  },
  {
    title: "Become a Java and Spring Backend Engineer",
    summary:
      "For the enterprise track: Java from the ground up, then the Spring systems and APIs companies actually run.",
    milestones: [
      "Java Essentials",
      "Advanced Java",
      "Building Backend Systems",
      "Building RESTful APIs",
    ],
    highlight: [],
  },
];

// Every course on the platform, from GET /public/courses on
// prod.masteringbackend.com, 2026-09-16. All nineteen are included in the
// subscription, so all nineteen are named: the offer is the catalogue, not
// a shortlist.
const COURSE_NAMES = [
  "AI Engineering",
  "Building Reliable AI Workflows Beyond Chatbots",
  "AntiGravity for Backend Engineers",
  "Python Essentials",
  "Advanced Python",
  "Ship 30 Python Projects in 30 Days",
  "Mastering Django: From Basics to Advanced",
  "Dockerizing Python Apps",
  "Logging and Caching in Python",
  "Java Essentials",
  "Advanced Java",
  "Spring Framework & Spring Boot",
  "Design Patterns in Java",
  "Unit Testing in Java",
  "Node.js Essentials",
  "Rust Essentials",
  "Introduction to GraphQL",
  "Introduction to Software Testing",
  "Intro to Data Structures & Algorithms",
];

// The three promises in the hero, in the campaign's own words. Each one
// is a stage of the platform (Learn, Build, Grow) and each is backed by
// a Pro inclusion named further down the page.
const HERO_POINTS = [
  "Structured learning paths from fundamentals to production",
  "Real-world projects and coding exercises, not just videos",
  "Mock interviews and a portfolio that make you job-ready",
];

// The scholarship page's "what happens after you enrol", for a
// subscription. Every line describes something that actually happens, in
// the order it happens, with no time promised that the platform does not
// control (a code review is promised; its turnaround is not).
const AFTER_YOU_SUBSCRIBE = [
  {
    when: "Immediately",
    body: "Your login details land in your email the moment the payment clears. No account to create first, no verification email to go hunting for.",
  },
  {
    when: "In your first hour",
    body: "Pick a learning path, backend or AI engineering, and start milestone one. Every path opens at foundations, so there is nothing to know before you begin.",
  },
  {
    when: "In your first weeks",
    body: "Submit your first project and get a code review on it. Sit your first AI mock interview whenever you like; there is no limit on how many you take.",
  },
  {
    when: "Whenever you have a question",
    body: "Ask in the community forum on the platform, or in the WhatsApp group, where other Nigerians on the same route and the Masteringbackend team are.",
    href: WHATSAPP_URL,
    linkLabel: "Join the WhatsApp group",
  },
  {
    when: "Any month you need to stop",
    body: "Cancel and you are not charged again. Your progress, projects and certificates stay on your profile, and you continue from the same lesson when you come back.",
  },
];

// What the subscription changes about the reader's week. Each lead is an
// outcome in their life, and each body names the platform feature that
// delivers it, in that order: nobody wants "code review", everybody wants
// someone to read their code.
const CHANGES: [string, string][] = [
  [
    "You always know what's next.",
    "A learning path is the whole journey in order: foundations, then systems, then production, then AI. No guessing, no forty answers.",
  ],
  [
    "Someone reads your code.",
    "Every project you submit gets a code review. Free tutorials can never give you that, and it is the part that makes you hireable.",
  ],
  [
    "You practise the interview before it counts.",
    "Unlimited AI mock interviews, up to 30 minutes each, with a report after. Walk into the real one having already done it.",
  ],
  [
    "You are not doing this alone.",
    "A community forum on the platform, and a WhatsApp group full of Nigerians on the same route.",
  ],
];

// Scholarship-page pattern: saying who should NOT buy is what makes the
// rest of the page believable.
const FOR_YOU = [
  "You have watched tutorials for months and still cannot build something on your own.",
  "You want a remote role, a dollar income, or a switch into tech, and you need the route, not more videos.",
  "You are starting from zero, or from another field. Every path begins at foundations.",
  "You can give it a few hours a week, on a modest laptop and average data.",
];

const NOT_FOR_YOU = [
  "You want a certificate without building anything. Every path here ends in projects someone reviews.",
  "You are looking for a quick win. This is a route to a career, and routes take months.",
  "You want someone to do it for you. We give you the route, the review and the room. You do the work.",
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

/**
 * "₦9,999" -> "₦333 a day". Derived from the regional price label so a
 * visitor outside Nigeria sees their own tier divided the same way, never
 * a naira figure that does not apply to them. Returns null when the label
 * carries no number (the loading placeholder never does).
 */
function perDayLabel(priceLabel: string): string | null {
  const numeric = Number(priceLabel.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const symbol = priceLabel.match(/^[^\d]+/)?.[0]?.trim() ?? "";
  const perDay = Math.round(numeric / 30);
  return `about ${symbol}${perDay.toLocaleString("en-NG")} a day`;
}

export function LpPro9999Page() {
  useEffect(() => {
    analytics.track(LP_9999_EVENTS.viewed, {});
  }, []);

  // One pricing fetch for the whole page (see the file comment).
  const checkout = useLpCheckout();
  // Loading placeholder for decorative copy only. The Pay button and the
  // SDK call never read this literal; they wait for the real price.
  const price = checkout.priceLabel || "₦9,999";
  const perDay = perDayLabel(price);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Every CTA opens the dialog and records which one did.
  const openCheckout = useCallback((section: string) => {
    analytics.track(LP_9999_EVENTS.ctaClicked, { section });
    setCheckoutOpen(true);
  }, []);

  const onWhatsappClick = () => {
    analytics.track(LP_9999_EVENTS.whatsappClicked, {});
  };

  // The strongest sentence on the page goes in the hero, not in card one
  // of six, section six. Belief has to arrive before the inventory does.
  const heroProof = TESTIMONIALS[0];

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

      {/* HERO: the promise, in their words, next to a real face saying it
          worked. Left-aligned on purpose; the rest of the page is centered
          and the hero should not look like one more section. */}
      <header className="relative overflow-hidden bg-[#0E1F33] text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-12 lg:py-20">
          <div>
            <span className="eyebrow-mono text-[#4AC5E8]">masteringbackend pro</span>
            <h1 className="mt-3 max-w-[16ch] text-balance text-[clamp(34px,4.4vw,52px)] font-semibold leading-[0.98] tracking-tight">
              Learn backend and AI skills
              <br />
              <em className={`${instrumentSerif.className} text-primary`}>
                for {price} a month.
              </em>
            </h1>
            <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-white/72">
              One subscription, the whole platform, built the way we train
              the AI Engineering Bootcamp cohorts: in order, by building,
              with your code reviewed. Whether you are starting your tech
              career or growing the one you have.
            </p>
            <ul className="mt-5 flex max-w-[50ch] flex-col gap-2.5 text-[15.5px] text-white/85">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <span className="mt-0.5 text-primary">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
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
              Pay in naira on this page. No account first. Cancel any time
              and keep your progress.
            </p>
          </div>

          <div className="w-full max-w-md lg:justify-self-end">
            <TestimonialCard {...heroProof} />
            <p className="mt-3 text-xs text-white/46">
              Five more learner films further down. Tap any one to watch.
            </p>
          </div>
        </div>
      </header>

      {/* AFTER YOU SUBSCRIBE: the exact sequence, before anyone is asked
          for anything. */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="After you subscribe"
          heading="What happens after you subscribe."
          description="The full sequence, in order, and how to reach a person along the way."
          descriptionClassName="mt-4 text-muted-foreground"
        />
        <ol className="mx-auto mt-8 max-w-3xl divide-y divide-border border-y border-border">
          {AFTER_YOU_SUBSCRIBE.map((item) => (
            <li
              key={item.when}
              className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[13rem_1fr] sm:gap-8"
            >
              <h3 className="text-[17px] font-bold tracking-tight">{item.when}</h3>
              <div>
                <p className="text-[16px] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onWhatsappClick}
                    className="mt-3 inline-block text-[15px] font-bold text-primary underline underline-offset-4 transition-opacity duration-150 hover:opacity-70"
                  >
                    {item.linkLabel}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* WHAT CHANGES: outcomes first, features second. */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="What changes"
            eyebrowVariant="background"
            heading="A route, a reviewer, and a room full of people on the same road."
          />
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {CHANGES.map(([lead, body]) => (
              <div key={lead} className="border-t-2 border-primary pt-4">
                <h3 className="text-[19px] font-bold tracking-tight">{lead}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF, before the inventory. */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="People who learned here"
          heading="It worked for them. In their own words."
          description="Six Masteringbackend learners on what changed, named where they agreed to be, so you can look them up before you pay. Tap any one to watch."
          descriptionClassName="mt-3 text-muted-foreground"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.youtubeId} {...t} />
          ))}
        </div>
      </section>

      {/* WHAT YOU GET: the inventory, now that they believe it. */}
      <section className="bg-[#0E1F33] py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Everything in Pro"
            eyebrowVariant="outline"
            heading="One subscription. Nothing held back."
            description={`${price} a month opens all of it. There is no higher tier for individuals; Enterprise exists for companies buying seats.`}
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
              All nineteen courses, included
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
          </div>
        </div>
      </section>

      {/* THE ROUTE. Numbered markers are used here on purpose: a path IS a
          sequence, and the order is the product. */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="The route"
          heading="The exact route, milestone by milestone."
          description="A path is the whole journey in order, so you never have to guess what to learn next. Two paths run end to end today, and this is every milestone in each one."
          descriptionClassName="mt-4 text-muted-foreground"
        />

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 lg:grid-cols-2">
          {LEARNING_PATHS.map((path) => (
            <div
              key={path.title}
              className="flex flex-col rounded border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/30"
            >
              <h3 className="text-[19px] font-bold tracking-tight">
                {path.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {path.summary}
              </p>
              <ol className="mt-5 flex flex-col gap-0 border-t border-border pt-2">
                {path.milestones.map((milestone, i) => {
                  const isHighlight = path.highlight.includes(milestone);
                  return (
                    <li
                      key={milestone}
                      className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] text-muted-foreground">
                        {i + 1}
                      </span>
                      <span
                        className={
                          isHighlight
                            ? "text-[15px] font-bold text-primary"
                            : "text-[15px] text-foreground"
                        }
                      >
                        {milestone}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                {path.milestones.length} milestones · included in your
                subscription
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-[62ch] text-center text-[15.5px] leading-relaxed text-muted-foreground">
          AI Engineering is a milestone on the Python path, and a full course
          of its own alongside{" "}
          <b className="text-foreground">
            Building Reliable AI Workflows Beyond Chatbots
          </b>
          . You do not pay extra for any of it.
        </p>
      </section>

      {/* THE PRICE, made concrete. The one place the number is allowed to
          be the biggest thing on screen. */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div>
            <span className="rounded-full bg-background px-3.5 py-1.5 text-xs">
              The price
            </span>
            <div className="mt-4 text-[clamp(56px,8vw,96px)] font-bold leading-none tracking-tight">
              {price}
            </div>
            <div className="mt-2 text-lg text-muted-foreground">
              a month{perDay ? `, ${perDay}` : ""}
            </div>
          </div>
          <ul className="flex flex-col gap-4 text-[16.5px] leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 text-primary">✓</span>
              <span>
                <b className="text-foreground">About the price of a plate of food a day.</b>{" "}
                One payment a month, in naira, on this page.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-primary">✓</span>
              <span>
                <b className="text-foreground">Nothing else, ever.</b> No exam fee, no
                upgrade, no premium tier you find out about later.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-primary">✓</span>
              <span>
                <b className="text-foreground">Cancel any time and keep your progress.</b>{" "}
                Come back next month and continue from the same lesson.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* FOR YOU / NOT FOR YOU */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Is this for you?"
          heading="For you if. Not for you if."
        />
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-[17px] font-bold">This is for you if</h3>
            <ul className="mt-4 flex flex-col gap-3.5">
              {FOR_YOU.map((line) => (
                <li key={line} className="flex gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 text-primary">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[17px] font-bold">This is not for you if</h3>
            <ul className="mt-4 flex flex-col gap-3.5">
              {NOT_FOR_YOU.map((line) => (
                <li key={line} className="flex gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 text-muted-foreground/60">✕</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CHECKOUT (inline, for people who scroll the whole way) */}
      <section id="start" className="scroll-mt-14 bg-[#0A1726] py-16 text-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12">
          <div>
            <span className="eyebrow-mono text-[#4AC5E8]">start today</span>
            <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight">
              Your first lesson is one payment away.
            </h2>
            <p className="mt-4 max-w-[42ch] text-white/72">
              No account to create first, no verification email to go hunting
              for. Enter your name and email, pay in naira, and your login
              details land in your inbox the moment the payment clears.
            </p>
            <p className="mt-5 text-xs text-white/46">
              Cancel any time. No hidden fees. Full access from day one.
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

      {/* LAST PUSH + MISSION */}
      <section className="border-t border-border bg-muted/40 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight">
            Every learner in those films started where you are now.
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-[17px] leading-relaxed text-muted-foreground">
            Same route. Same price as a data bundle. The only thing between
            you and your first lesson is one payment.
          </p>
          <button
            type="button"
            onClick={() => openCheckout("final")}
            className={`${CTA_CLASS} mt-7 px-7 py-3.5 text-base shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]`}
          >
            Start learning for {price}
          </button>
          <p className="mx-auto mt-10 max-w-[46ch] text-balance text-[15px] leading-relaxed text-muted-foreground">
            Our mission is to make backend and AI engineering skills
            affordable for young Africans.
          </p>
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
