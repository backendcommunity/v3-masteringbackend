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
// The same list /pricing and /pricing/enterprise render, so the three
// surfaces can never disagree about where learners work. Its own comment
// is why the label reads "our learners work at" and not "trusted by":
// the claim is employment, not a customer relationship.
import { TRUSTED_BY_COMPANIES } from "@/lib/plan-features";

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
    body: "Practise before it counts, build a profile employers can check, and ask questions in a community of people doing the same thing.",
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
    banner:
      "https://pub-63da695b9ece47c5b3b49bd78b86d884.r2.dev/Become%20a%20python%20engineer.png",
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
    banner:
      "https://pub-63da695b9ece47c5b3b49bd78b86d884.r2.dev/become%20a%20java%20engineer.png",
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
  "Real-world projects and coding exercises to build and practise, not just long videos",
  "Mock interviews to prepare and a portfolio that make you job-ready",
];

// The campaign's deadline. This is a real commitment: on this date the
// naira price must actually become STANDARD_PRICE_NGN, and everyone who
// subscribed before it must keep their rate, because the page promises
// both. If either changes, change it here.
const DISCOUNT_ENDS_ON = "1 October 2026";
const STANDARD_PRICE_NGN = "₦12,999";

// The struck-through standard price is a naira figure, so it is only
// shown to visitors the pricing API actually quotes in naira. Everyone
// else sees the deadline without a price that does not apply to them.
function isNairaPrice(priceLabel: string): boolean {
  return priceLabel.trim().startsWith("₦");
}

// What the platform actually holds, counted from GET /public/courses and
// GET /public/roadmaps on prod.masteringbackend.com, 2026-09-16: nineteen
// courses, 152 chapters across them, 57 hours of video, and the two
// learning paths that run end to end. Recount before changing these.
const PLATFORM_STATS: [string, string][] = [
  ["19", "courses"],
  ["152", "chapters"],
  ["57", "hours of video"],
  ["2", "full learning paths"],
];

// Four courses shown with the artwork and figures the catalogue itself
// carries, so the page shows the product rather than only describing it.
// Banner URLs, chapter counts, hours and levels are the API's own.
const FEATURED_COURSES = [
  {
    title: "AI Engineering",
    banner: "https://images.masteringbackend.com/AI%20Engineering%20%20Bootcamp.png",
    level: "Beginner",
    hours: 5,
    chapters: 9,
  },
  {
    title: "Advanced Python",
    banner: "https://images.masteringbackend.com/advanced-python.png",
    level: "Intermediate",
    hours: 5,
    chapters: 12,
  },
  {
    title: "Advanced Java",
    banner: "https://images.masteringbackend.com/advanced-java.png",
    level: "Intermediate",
    hours: 5,
    chapters: 23,
  },
  {
    title: "Ship 30 Python Projects in 30 Days",
    banner: "https://images.masteringbackend.com/Ship%2030%20Python%20Projects%20in%2030%20Days.png",
    level: "Intermediate",
    hours: 15,
    chapters: 4,
  },
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

// Learner Spotlight films from the Masteringbackend YouTube channel.
// Names, roles and quotes come from the graduate data on the MasteringAI
// scholarship page (lib/scholarship.ts), so a visitor can look these
// people up before paying.
//
// Two further films exist (HX7vyFqATlk, C5V2e4sjDvo) and are deliberately
// NOT shown: neither carries a name we are cleared to publish, and an
// anonymous card sitting beside named ones reads as filler and drags the
// credibility of the real ones down with it.
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
    youtubeId: "YP1hx2Wlaqs",
    title: "Scaling an AI system to 1 million users",
    name: "Ifechukwu Ogidi",
    role: "Backend engineer, 4+ years building systems",
    quote:
      "We went from core backend principles to RAG systems, embeddings, vector databases and agentic systems. It gave me the tools to build AI systems from the ground up.",
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

// Written reviews, verbatim from masteringbackend.com, for readers who
// will not commit to pressing play. Each carries a full name and a role,
// and most carry an employer, so every one of them is checkable.
const TEXT_TESTIMONIALS = [
  {
    quote:
      "The projects, quizzes, and hands-on coding examples helped me solidify the concepts and prepared me to ace my interview.",
    name: "Daniel Tinivella",
    role: "Software Engineer, Globant",
  },
  {
    quote:
      "I strongly recommend exploring Mastering Backend as a resource for your personal and/or professional growth.",
    name: "Agoro, Adegbenga B.",
    role: "CTO, Crenet",
  },
  {
    quote:
      "There is order to the way your topics are handled, making sure necessary concepts are learned before the next one, because the previous concept is needed to understand the upcoming one.",
    name: "Orevaoghene Eguwe",
    role: "Backend Engineer",
  },
  {
    quote:
      "The course is an excellent resource for beginners. Your explanations of the basics are clear, making it easy for newcomers to grasp.",
    name: "Eshan Shafeeq",
    role: "Blockchain & Web3 Engineer, Cake DeFi",
  },
  {
    quote:
      "The course covers basics to advanced concepts, breaking each one down with proper practical examples and projects. I think this is the best course to learn backend engineering.",
    name: "Debasish Mohanta",
    role: "Backend Software Engineer",
  },
  {
    quote:
      "The course structure and progression make sense, especially the clear explanations of core Node.js concepts like modules, event-driven architecture, and asynchronous programming.",
    name: "Imran Munawar",
    role: "Software Engineer",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What exactly do you get?",
    a: "The whole platform. Every paid course and career-engineering path, every project with a code review on what you submit, bite-size practice exercises in the playground, unlimited AI mock interviews of up to 30 minutes each, bootcamps and certification exams, a professional profile and portfolio you can share, and the community forum. Nothing on this page costs extra.",
  },
  {
    q: "Is there a higher tier you are not showing me?",
    a: "No. This is everything the platform gives an individual learner. Nothing is held back from you and there is nothing else to upgrade to.",
  },
  {
    q: "How do you pay?",
    a: "Right here on this page. Enter your name and email and a secure payment window opens over it. Pay in naira with your debit card, Verve, Mastercard or Visa, or by bank transfer. You never leave the page and you do not create an account first.",
  },
  {
    q: "Will your naira card work?",
    a: "Yes. Your payment is processed in naira by AsyncPay, which is built for Nigerian cards. Verve, Mastercard and Visa debit cards all work, and bank transfer is there if your card gives you trouble.",
  },
  {
    q: "Do you need a powerful laptop or fast internet?",
    a: "No. The platform is built to work on a modest laptop and average data. You can learn on the connection you already have.",
  },
  {
    q: "You have never written code. Can you still start?",
    a: "Yes. Every path opens at foundations, and the Python and AI Engineering tracks begin from zero. There is nothing you need to know before your first lesson.",
  },
  {
    q: "What if you do not finish everything in a month?",
    a: "Nothing is lost. Your access continues for as long as your subscription is active, so you move at your own pace and pick up exactly where you stopped.",
  },
  {
    q: "What happens if you miss a month?",
    a: "Your access pauses at the end of the month you paid for. Your progress, projects and certificates stay on your profile. Subscribe again whenever you are ready and you continue from the same lesson.",
  },
  {
    q: "Can you cancel any time?",
    a: "Yes. There is no lock-in contract. Cancel whenever you want and you are not charged again, and what you have already built stays yours.",
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
  /** Omit when the heading needs no small label above it. */
  eyebrow?: string;
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
      {eyebrow ? <span className={eyebrowClassName}>{eyebrow}</span> : null}
      <h2 className={`${eyebrow ? "mt-2" : ""} text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight`}>
        {heading}
      </h2>
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
    </div>
  );
}

/**
 * A section on the light canvas carrying the hero's linework. The pattern
 * sits on its own absolutely positioned layer: `.section-grid` applies a
 * mask, and a mask on the section itself would fade the copy with it.
 */
function GridSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div className="section-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
        {children}
      </div>
    </section>
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
  // The struck-through ₦12,999 may only be shown to a visitor the pricing
  // API actually quoted in naira. `price` falls back to a naira literal
  // while the request is in flight, so testing it would flash a naira
  // figure at everyone, including visitors billed in dollars.
  const showNairaDiscount = isNairaPrice(checkout.priceLabel);

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
            <span className="eyebrow-mono text-[#4AC5E8]">masteringbackend membership</span>
            <h1 className="mt-3 max-w-[15ch] text-balance text-[clamp(34px,4.6vw,54px)] font-bold leading-[1.02] tracking-tight">
              Learn backend and AI skills for{" "}
              <span className="whitespace-nowrap text-primary">
                {price} a month
              </span>
              .
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17.5px] leading-relaxed text-white/80">
              Our mission is to democratize backend and AI engineering
              skills for{" "}
              <em
                className={`${instrumentSerif.className} text-[1.18em] leading-none text-primary`}
              >
                one million Africans
              </em>
              . Everything you need is already on the platform, and your
              access opens the moment you subscribe: learn it, build it, and
              practise it, at your own pace.
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
            <p className="mt-3 text-xs">
              <span className="text-red-500">
                Full refund if you are not satisfied and ask within the
                first 3 days of learning.
              </span>
            </p>
            <p className="mt-3.5 max-w-[52ch] text-[15.5px] leading-relaxed text-white/80">
              {showNairaDiscount ? (
                <>
                  <s className="text-white/45">{STANDARD_PRICE_NGN}</s>{" "}
                  <b className="text-[1.12em] text-white">{price} a month</b>{" "}
                  until {DISCOUNT_ENDS_ON}
                </>
              ) : (
                <>
                  <b className="text-white">Discounted</b> until{" "}
                  {DISCOUNT_ENDS_ON}
                </>
              )}
              , because this is how we democratize these skills for one
              million of you. Subscribe before that date and you keep this
              rate for as long as you stay subscribed.
            </p>
          </div>

          <div className="w-full max-w-md lg:justify-self-end">
            <TestimonialCard {...heroProof} />
          </div>
        </div>
      </header>

      {/* TRUST BAR. Five years, a real headcount, and where members work,
          placed immediately under the hero because that is where a reader
          deciding whether this is a real company looks first. */}
      <section className="border-b border-border bg-card py-8">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col items-center gap-7 lg:flex-row lg:justify-between lg:gap-10">
            <dl className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4 lg:justify-start">
              <div className="text-center lg:text-left">
                <dt className="text-[26px] font-bold leading-none tracking-tight">
                  1,000+
                </dt>
                <dd className="mt-1 text-[13px] text-muted-foreground">
                  developers trained since 2021
                </dd>
              </div>
              <div className="text-center lg:text-left">
                <dt className="text-[26px] font-bold leading-none tracking-tight">
                  3,200+
                </dt>
                <dd className="mt-1 text-[13px] text-muted-foreground">
                  course enrolments
                </dd>
              </div>
              <div className="text-center lg:text-left">
                <dt className="text-[26px] font-bold leading-none tracking-tight">
                  500+
                </dt>
                <dd className="mt-1 text-[13px] text-muted-foreground">
                  members working in the industry
                </dd>
              </div>
            </dl>

            <div className="flex flex-col items-center gap-3 lg:max-w-[52%] lg:items-end">
              <p className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
                Our learners work at
              </p>
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-end">
                {TRUSTED_BY_COMPANIES.map((name) => (
                  <li
                    key={name}
                    className="text-[17px] font-semibold tracking-tight text-foreground/85"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE YOU REGISTER: the exact sequence, before anyone is asked
          for anything. Whitish ground carrying the same linework as the
          hero, so the page reads as one surface rather than alternating
          slabs. */}
      <GridSection className="bg-[#F4F7FA] py-16">
        <SectionHeading
          eyebrow="Before you subscribe"
          heading="What happens after you subscribe."
          description="The full sequence, in order, and how to reach a person along the way."
          descriptionClassName="mt-4 text-muted-foreground"
        />
        <ol className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AFTER_YOU_SUBSCRIBE.map((item, i) => (
            <li
              key={item.when}
              /* The arrow lives in the grid gap and has to disappear at the
                 end of each row, which is a different card at every
                 breakpoint: 1 column stacks (never a row end), 2 columns end
                 on every 2nd, 3 columns on every 3rd. The `lg` rule re-shows
                 the 2nd card's arrow, since `sm` still applies there. */
              className="relative flex flex-col rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/50 sm:[&:nth-child(2n)>[data-step-arrow]]:hidden lg:[&:nth-child(2n)>[data-step-arrow]]:block lg:[&:nth-child(3n)>[data-step-arrow]]:hidden"
            >
              {i < AFTER_YOU_SUBSCRIBE.length - 1 ? (
                <span
                  data-step-arrow
                  aria-hidden="true"
                  className="absolute -bottom-[18px] left-1/2 z-10 grid h-6 w-6 -translate-x-1/2 rotate-90 place-items-center rounded-full bg-[#F4F7FA] text-[15px] font-bold text-primary sm:-right-[22px] sm:bottom-auto sm:left-auto sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:rotate-0"
                >
                  ➝
                </span>
              ) : null}
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 font-mono text-[13px] text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[17px] font-bold tracking-tight">
                {item.when}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
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
            </li>
          ))}
        </ol>
      </GridSection>

      {/* PROOF, before the inventory. */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="People who learned here"
          heading="What some of our learners have to say."
          description="Every person below is named, with the company they work for where they gave it, so you can look them up before you pay."
          descriptionClassName="mt-3 text-muted-foreground"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.filter((t) => t.youtubeId !== heroProof.youtubeId).map((t) => (
            <TestimonialCard key={t.youtubeId} {...t} />
          ))}
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEXT_TESTIMONIALS.map((t) => (
            <li
              key={t.name}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/40"
            >
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 text-[14px] font-semibold tracking-tight text-foreground">
                {t.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.role}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* WHAT YOU GET: the inventory, now that they believe it. */}
      <section className="bg-[#0E1F33] py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="What you get"
            eyebrowVariant="outline"
            heading={<>Those three promises, and what is behind each one.</>}
            description="Learn it, build it, then get ready for the job. Your subscription opens all three from day one, and nothing here costs extra."
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

          <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 border-y border-white/12 py-7 sm:grid-cols-4">
            {PLATFORM_STATS.map(([value, label]) => (
              <div key={label} className="text-center">
                <dt className="text-[32px] font-bold leading-none tracking-tight">
                  {value}
                </dt>
                <dd className="mt-1.5 text-[13px] text-white/60">{label}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <p className="text-center text-sm text-white/55">
              Unlimited access to all courses, including
            </p>
            <div className="mx-auto mt-4 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_COURSES.map((c) => (
                <div
                  key={c.title}
                  className="overflow-hidden rounded border border-white/12 bg-white/[0.04] transition-colors duration-200 hover:border-primary/40"
                >
                  <img
                    src={c.banner}
                    alt={`${c.title} course`}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-[15px] font-bold leading-snug">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] text-white/55">
                      {c.level} · {c.hours} hr · {c.chapters} chapters
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <ul className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
              {COURSE_NAMES.filter(
                (title) => !FEATURED_COURSES.some((c) => c.title === title),
              ).map((title) => (
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

      {/* THE PATHS. Numbered markers are used here on purpose: a path IS a
          sequence, and the order is the product. */}
      <GridSection className="bg-[#F4F7FA] py-16">
        <SectionHeading
          heading="Unlimited access to our career-engineering learning paths."
          description="You never have to guess what to learn next. A path takes you from your first line of code to a system you can defend in an interview, in order, and you can see every milestone before you pay."
          descriptionClassName="mt-4 text-muted-foreground"
        />

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 lg:grid-cols-2">
          {LEARNING_PATHS.map((path) => (
            <div
              key={path.title}
              className="flex flex-col rounded border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/30"
            >
              <img
                src={path.banner}
                alt={`${path.title} learning path`}
                loading="lazy"
                className="mb-4 aspect-[16/9] w-full rounded object-cover"
              />
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

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => openCheckout("paths")}
            className={`${CTA_CLASS} px-7 py-3.5 text-base shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]`}
          >
            Start learning for {price}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            {showNairaDiscount ? (
              <>
                <s>{STANDARD_PRICE_NGN}</s> <b className="text-foreground">{price}</b>{" "}
                until {DISCOUNT_ENDS_ON}.
              </>
            ) : (
              <>Discounted until {DISCOUNT_ENDS_ON}.</>
            )}
          </p>
        </div>
      </GridSection>

      {/* FOR YOU / NOT FOR YOU */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          heading="Is this for you?"
        />
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/30 bg-card p-6">
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
          <div className="rounded-xl border border-border bg-card p-6">
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
            <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-white/80">
              Your name, your email, and a secure naira payment window. You
              are not creating an account or waiting on a verification
              email: your login details reach your inbox the moment the
              payment clears, and you can open your first lesson tonight.
            </p>
            <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-white/72">
              For {price} a month you get all 19 courses, 152 chapters and
              both career-engineering paths. Cancel any time, keep your
              progress, and pay nothing else.
            </p>
            <p className="mt-4 text-xs">
              <span className="text-red-500">
                Full refund if you are not satisfied and ask within the
                first 3 days of learning.
              </span>
            </p>
            <p className="mt-2 text-xs text-white/46">
              {showNairaDiscount ? (
                <>
                  <s>{STANDARD_PRICE_NGN}</s> <b className="text-white/80">{price}</b>{" "}
                  a month until {DISCOUNT_ENDS_ON}.
                </>
              ) : (
                <>Discounted until {DISCOUNT_ENDS_ON}.</>
              )}{" "}
              Your rate stays the same for as long as you stay subscribed.
            </p>
          </div>
          <InlineCheckout checkout={checkout} />
        </div>
      </section>

      {/* FAQ */}
      <GridSection className="bg-[#F4F7FA] py-16">
        <SectionHeading heading="Frequently asked." />
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
      </GridSection>

      {/* LAST PUSH + MISSION */}
      <GridSection className="border-t border-border bg-[#F4F7FA] py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight">
            Launch and grow your tech career.
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] leading-relaxed text-muted-foreground">
            Whether you are starting out or levelling up the career you
            already have, the learning paths, the projects with your code
            reviewed, and the mock interviews are all on the other side of
            one payment. Subscribe today and open your first lesson tonight.
          </p>
          <button
            type="button"
            onClick={() => openCheckout("final")}
            className={`${CTA_CLASS} mt-7 px-7 py-3.5 text-base shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]`}
          >
            Start learning for {price}
          </button>
          <p className="mt-3 text-[13.5px] text-muted-foreground">
            {showNairaDiscount ? (
              <>
                <s>{STANDARD_PRICE_NGN}</s>{" "}
                <b className="text-foreground">{price}</b> until{" "}
                {DISCOUNT_ENDS_ON}.
              </>
            ) : (
              <>Discounted until {DISCOUNT_ENDS_ON}.</>
            )}{" "}
            Cancel any time.
          </p>
          <p className="mx-auto mt-10 max-w-[48ch] text-balance text-[15px] leading-relaxed text-muted-foreground">
            You would be one of the one million Africans we are
            democratizing backend and AI engineering skills for.
          </p>
        </div>
      </GridSection>

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
