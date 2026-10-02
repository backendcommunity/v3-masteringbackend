"use client";

/**
 * The ₦9,999/month ads landing page. Public, no login, payment happens on
 * this page. It sells two paths, Backend Engineering and AI Engineering,
 * on one subscription: every path CTA opens the checkout dialog with that
 * path preselected (name, email, then the payment SDK's own secure
 * window), and the bottom of the page carries the same form inline for
 * people who scroll the whole way. The nav and footer point at the
 * "choose your path" offer instead, so nobody reaches checkout without
 * having picked one.
 *
 * Pricing: the page owns one useLpCheckout() call. The price the copy
 * names, the price the card shows and the price the SDK charges all come
 * from that single regional response, so a visitor in Nigeria sees ₦9,999
 * and is charged the ₦9,999 AsyncPay plan, and a visitor anywhere else
 * sees their own tier throughout. Nothing on the charge path is hardcoded.
 *
 * The chosen path is recorded, not enforced: it goes to analytics and to
 * AsyncPay's metadata. Both paths buy the same plan, and onboarding still
 * asks the learner to pick a path after login.
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
import { VideoPoster } from "@/components/pages/lp/video-poster";
import {
  InlineCheckout,
  LP_PATH_LABELS,
} from "@/components/pages/lp/inline-checkout";
import { CheckoutDialog } from "@/components/pages/lp/checkout-dialog";
import { useLpCheckout } from "@/hooks/use-lp-checkout";
import type { LpPath } from "@/hooks/use-lp-checkout";
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

const WHATSAPP_URL =
  "https://chat.whatsapp.com/LtCzfQlb9ex0BtWtcbwmDJ?s=cl&p=i&mlu=4&ilr=4";

// The two paths the page sells, as the brief asks: Backend Engineering and
// AI Engineering, each with the route, courses and practice it includes.
// Every item is from GET /public/courses and GET /public/roadmaps on
// prod.masteringbackend.com, 2026-09-16, and between them the two course
// lists name all nineteen courses on the platform.
//
// There is no standalone AI Engineering roadmap in production. "AI
// Engineering" here is a named selection of what exists: the Python path,
// walked to its AI Engineering milestone, plus the AI courses. The route
// below is that path's own milestones, so a buyer who picks it lands on a
// path they can actually walk. Do not give it a "Become an AI Engineer"
// title until a roadmap by that name ships.
//
// The Node.js and Rust paths are still not offered as routes: each carries
// a single Essentials milestone, so they appear as courses only.
const PATH_OFFERS: {
  id: LpPath;
  title: string;
  summary: string;
  routeLabel: string;
  route: string[];
  /** Milestones called out as the destination of the route. */
  highlight: string[];
  routeNote: string;
  courses: string[];
  practice: string[];
}[] = [
  {
    id: "backend",
    title: "Backend Engineering",
    summary: "Build the servers, APIs and systems every product runs on.",
    routeLabel: "Your route · Python",
    route: [
      "Python Foundations",
      "Backend Engineering Core",
      "Building Backend Systems",
      "Production Infrastructure",
      "Ship and defend",
    ],
    highlight: [],
    routeNote:
      "Or the Java and Spring route: Java Essentials, Advanced Java, Building Backend Systems, Building RESTful APIs.",
    courses: [
      "Python Essentials",
      "Advanced Python",
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
    ],
    practice: [
      "Backend projects, with a code review from our team on every submission",
      "Bite-size coding exercises in the playground",
    ],
  },
  {
    id: "ai-engineering",
    title: "AI Engineering",
    summary:
      "Build the AI systems behind real products: LLM apps, RAG and reliable workflows.",
    routeLabel: "Your route",
    route: [
      "Python Foundations",
      "Backend Engineering Core",
      "AI Engineering with Python",
      "Ship and defend",
    ],
    highlight: ["AI Engineering with Python"],
    routeNote:
      "AI engineers ship production systems, so the route builds your backend first.",
    courses: [
      "AI Engineering",
      "Building Reliable AI Workflows Beyond Chatbots",
      "AntiGravity for Backend Engineers",
      "Python Essentials",
      "Advanced Python",
      "Ship 30 Python Projects in 30 Days",
    ],
    practice: [
      "AI and Python projects, with a code review on every submission",
      "A 30-project sprint to build the habit of shipping",
    ],
  },
];

// What every subscriber gets whichever path they pick. Copied from the Pro
// column of /pricing (components/pages/pricing.tsx), so the two pages can
// never disagree about what a subscriber gets.
const SHARED_INCLUSIONS = [
  "Unlimited AI mock interviews, up to 30 minutes each",
  "A professional profile and shareable portfolio",
  "Community forum access",
  "Bootcamps and certification exams",
];

// The campaign's deadline. This is a real commitment: on this date the
// naira price must actually become STANDARD_PRICE_NGN, and everyone who
// subscribed before it must keep their rate, because the page promises
// both. If either changes, change it here.
const DISCOUNT_ENDS_ON = "1 November 2026";
const DISCOUNT_ENDS_SHORT = "1st November";
const STANDARD_PRICE_NGN = "₦49,999";

// The struck-through standard price is a naira figure, so it is only
// shown to visitors the pricing API actually quotes in naira. Everyone
// else sees the deadline without a price that does not apply to them.
function isNairaPrice(priceLabel: string): boolean {
  return priceLabel.trim().startsWith("₦");
}

// What the platform actually holds, counted from GET /public/courses and
// GET /public/roadmaps on prod.masteringbackend.com, 2026-09-16: nineteen
// courses, 152 chapters across them, 57 hours of video. Recount before
// changing these.
const PLATFORM_STATS: [string, string][] = [
  ["19", "courses"],
  ["152", "chapters"],
  ["57", "hours of video"],
  ["2", "focused paths"],
];

// Scholarship-page pattern: saying who should NOT buy is what makes the
// rest of the page believable.
const FOR_YOU = [
  "You have watched tutorials for months and still cannot build something on your own.",
  "You want a remote role, a dollar income, or a switch into tech, and you need one clear path, not more videos.",
  "You are starting from zero, or from another field. Both paths begin at foundations.",
  "You can give it a few hours a week, on a modest laptop and average data.",
];

const NOT_FOR_YOU = [
  "You want a certificate without building anything. Both paths end in projects someone reviews.",
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
    youtubeId: "44TN-mIhqQw",
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
    q: "What is the difference between the two paths?",
    a: "Backend Engineering takes you through Python, or Java and Spring, to building and running production APIs and systems. AI Engineering starts on the same backend foundation, then goes into AI systems: LLM apps, RAG and reliable workflows. The price is the same.",
  },
  {
    q: "Can you switch paths later?",
    a: "Yes. One subscription opens both paths and every course. Picking a path sets where you start. Nothing is locked.",
  },
  {
    q: "What exactly do you get?",
    a: "Your chosen path and the whole platform behind it. Every paid course, every project with a code review on what you submit, bite-size practice exercises in the playground, unlimited AI mock interviews of up to 30 minutes each, bootcamps and certification exams, a professional portfolio you can share, and the community forum.",
  },
  {
    q: "Is there a higher tier you are not showing me?",
    a: "No. This is everything the platform gives an individual learner. Nothing is held back from you and there is nothing else to upgrade to.",
  },
  {
    q: "How do you pay?",
    a: "Right here on this page. Enter your name and email and a secure payment window opens over it. Pay in naira with your debit card, Verve, Mastercard or Visa, or by bank transfer.",
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
    a: "Yes. Both paths start from foundations, so there is nothing you need to know before your first lesson.",
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
    a: "Yes. Cancel whenever you want and you are not charged again, and what you have already built stays yours.",
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
      <h2
        className={`${eyebrow ? "mt-2" : ""} text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight`}
      >
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

const CTA_GLOW =
  "shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)]";

// The second path button on a navy ground: same shape as CTA_CLASS, white
// fill, so the two paths read as a pair rather than primary and secondary.
const CTA_ON_NAVY_CLASS =
  "inline-flex items-center justify-center rounded-full bg-white font-bold text-[#0E1F33] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/90 active:translate-y-0";

// Its counterpart on a light ground.
const CTA_ON_LIGHT_CLASS =
  "inline-flex items-center justify-center rounded-full bg-[#0E1F33] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-125 active:translate-y-0";

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
  // The hero's "₦100k+ bootcamp" is a naira comparison too, but it is the
  // campaign's opening line, so it stays up while the price loads (the ads
  // run in Nigeria) and gives way only once a visitor is quoted elsewhere.
  const quotedOutsideNaira = checkout.priceLabel !== "" && !showNairaDiscount;

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // One path for the dialog and the bottom form, so they always agree.
  const [path, setPath] = useState<LpPath>("backend");

  // Every path CTA preselects its path, opens the dialog, and records
  // which button did it.
  const openCheckout = useCallback((section: string, chosen: LpPath) => {
    analytics.track(LP_9999_EVENTS.ctaClicked, { section, path: chosen });
    setPath(chosen);
    setCheckoutOpen(true);
  }, []);

  const onWhatsappClick = () => {
    analytics.track(LP_9999_EVENTS.whatsappClicked, {});
  };

  // The strongest sentence on the page goes in the hero, not in card one
  // of six, section six. Belief has to arrive before the inventory does.
  const heroProof = TESTIMONIALS[0];

  // The brief's two path buttons. Rendered in the hero, the offer card, each
  // path block and the closing section, always Backend first.
  const pathCtas = (section: string, secondClassName: string) => (
    <>
      <button
        type="button"
        onClick={() => openCheckout(section, "backend")}
        className={`${CTA_CLASS} ${CTA_GLOW} px-7 py-3.5 text-base`}
      >
        Start {LP_PATH_LABELS.backend} — {price}/mo
      </button>
      <button
        type="button"
        onClick={() => openCheckout(section, "ai-engineering")}
        className={`${secondClassName} px-7 py-3.5 text-base`}
      >
        Start {LP_PATH_LABELS["ai-engineering"]} — {price}/mo
      </button>
    </>
  );

  const discountLine = showNairaDiscount ? (
    <>
      <s>{STANDARD_PRICE_NGN}</s> <b>{price}</b> until {DISCOUNT_ENDS_ON}.
    </>
  ) : (
    <>Discounted until {DISCOUNT_ENDS_ON}.</>
  );

  return (
    <div className="min-h-screen bg-background">
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        checkout={checkout}
        path={path}
        onPathChange={setPath}
      />

      {/* NAV. The real app nav's chrome (bg-card, its shadow token, sticky)
          without search, notifications or avatar: no session on this route.
          It points at the path choice, not at checkout. */}
      <nav className="sticky top-0 z-30 bg-card shadow-[0_1px_2px_rgba(14,31,51,.06),0_4px_16px_rgba(14,31,51,.06)]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-5 px-4 sm:px-6">
          <span className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
            <img
              src="/blue-icon-logo.png"
              alt=""
              className="h-6 w-6 object-contain"
            />
            masteringbackend.
          </span>
          <a href="#offer" className={`${CTA_CLASS} px-4 py-3 text-sm`}>
            Choose your path
          </a>
        </div>
      </nav>

      {/* HERO: the cost of the alternative, the two paths, and a real face
          saying it worked. Laid out like the MasteringAI scholarship hero:
          a compact two-column block, copy and video both centred on one
          axis, the two path buttons side by side. Two columns only from xl:
          below that the copy column is too narrow for both buttons on one
          line, so the video drops beneath the copy instead. The container uses the
          nav's own gutter so the headline starts under the logo. */}
      <header className="relative overflow-hidden bg-[#0E1F33] text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:py-20 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-12 xl:py-24">
          <div className="max-w-[640px] xl:max-w-none">
            <h1 className="text-balance text-[clamp(32px,3.4vw,46px)] font-bold leading-[1.08] tracking-tight">
              {quotedOutsideNaira
                ? "Still thinking of paying for an expensive bootcamp?"
                : "Still thinking of spending ₦100k+ on a bootcamp?"}
              <em
                className={`${instrumentSerif.className} mt-1 block text-[1.18em] font-normal leading-[1.05] text-primary`}
              >
                You don&apos;t have to.
              </em>
            </h1>
            <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-white/75">
              Pick one path,{" "}
              <b className="font-semibold text-white">Backend Engineering</b> or{" "}
              <b className="font-semibold text-white">AI Engineering</b>, and
              learn everything from the basics to job-ready, all with one
              low-cost subscription.
            </p>

            {/* The two paths are peers: side by side, each sized to its
                label. Full width only on phones, where both cannot fit. */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>button]:whitespace-nowrap [&>button]:px-5 [&>button]:text-[15px]">
              {pathCtas("hero", CTA_ON_NAVY_CLASS)}
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-white/70">
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-primary">
                  ✓
                </span>
                Full refund within 3 days
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-primary">
                  ✓
                </span>
                Cancel any time
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onWhatsappClick}
                  className="font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors duration-150 hover:decoration-white"
                >
                  Join the WhatsApp group
                </a>
              </li>
            </ul>
          </div>

          <div className="w-full max-w-[720px] overflow-hidden rounded-2xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)] ring-1 ring-white/15">
            <VideoPoster
              youtubeId={heroProof.youtubeId}
              title={heroProof.title}
            />
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

      {/* MISSION. Directly after "our learners work at": the proof says
          this is a real company, the mission says why the price is low. */}
      <section className="border-b border-border bg-card py-14">
        <div className="mx-auto max-w-[820px] px-4 text-center sm:px-8">
          <span className="eyebrow-mono text-primary">our mission</span>
          <p className="mt-3 text-balance text-[clamp(20px,2.4vw,27px)] font-semibold leading-snug tracking-tight">
            Our mission is to democratize backend and AI engineering skills for{" "}
            <em
              className={`${instrumentSerif.className} text-[1.15em] font-normal text-primary`}
            >
              one million Africans
            </em>
            .
          </p>
          <p className="mx-auto mt-3 max-w-[60ch] text-[16px] leading-relaxed text-muted-foreground">
            Access to structured learning paths, real-world projects, and a
            supportive community that takes you from fundamentals to job-ready.
          </p>
        </div>
      </section>

      {/* THE OFFER: why the price matters, the two paths, the price and the
          deadline in one place. The reassurance the old "what happens after
          you subscribe" steps carried lives on in the checklist. */}
      <GridSection className="scroll-mt-14 bg-[#F4F7FA] py-16">
        <div
          id="offer"
          className="grid scroll-mt-20 grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <h2 className="max-w-[20ch] text-balance text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.1] tracking-tight">
              Want to start a career in tech, but the cost of courses keeps
              holding you back?
            </h2>
            <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-muted-foreground">
              MasteringBackend gives you a structured learning path in{" "}
              <b className="text-foreground">Backend Engineering</b> or{" "}
              <b className="text-foreground">AI Engineering</b>. Your choice,
              one focused route. With real-world projects, code reviews from our
              team, unlimited AI mock interviews, and a community of learners on
              the same journey, you move from your first lesson to job-ready
              without guesswork.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-primary">✓</span>
                <span>
                  Your login details arrive by email right after payment.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-primary">✓</span>
                <span>
                  Cancel any month. Your progress, projects and certificates
                  stay on your profile.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-primary">✓</span>
                <span>
                  Questions before you pay?{" "}
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onWhatsappClick}
                    className="font-bold text-foreground underline underline-offset-4 transition-opacity duration-150 hover:opacity-70"
                  >
                    Ask in the WhatsApp group
                  </a>
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(14,31,51,.04),0_18px_40px_-22px_rgba(14,31,51,.25)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Choose your path
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {PATH_OFFERS.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => openCheckout("offer", offer.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-[#F4F7FA] px-4 py-3.5 text-left transition-colors duration-150 hover:border-primary hover:bg-primary/5"
                >
                  <span>
                    <span className="block text-base font-bold">
                      {offer.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {offer.summary}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xl text-primary">
                    →
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-5 flex flex-wrap items-baseline gap-2.5">
              <b className="text-[40px] font-bold leading-none tracking-tight">
                {price}
              </b>
              <span className="text-muted-foreground">/month</span>
              {showNairaDiscount ? (
                <s className="text-muted-foreground">{STANDARD_PRICE_NGN}</s>
              ) : null}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-red-500"
              />
              Offer ends {DISCOUNT_ENDS_SHORT}*
            </p>
            <p className="mt-4 border-t border-border pt-4 text-[12.5px] leading-relaxed text-muted-foreground">
              *Subscribe before {DISCOUNT_ENDS_ON} and keep{" "}
              {showNairaDiscount ? price : "this rate"} for as long as you stay
              subscribed.
              {showNairaDiscount
                ? ` New subscribers pay ${STANDARD_PRICE_NGN}/month after that.`
                : ""}{" "}
              One subscription opens both paths.
            </p>
          </div>
        </div>
      </GridSection>

      {/* PROOF, before the inventory. */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="People who learned here"
          heading="What some of our learners have to say."
          description="Every person below is named, with the company they work for, so you can look them up before you pay."
          descriptionClassName="mt-3 text-muted-foreground"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.filter((t) => t.youtubeId !== heroProof.youtubeId).map(
            (t) => (
              <TestimonialCard key={t.youtubeId} {...t} />
            ),
          )}
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

      {/* WHAT YOU GET: one block per path, so the difference reads at a
          glance, then what both share. Numbered markers inside the routes
          on purpose: a path IS a sequence, and the order is the product. */}
      <section className="bg-[#0E1F33] py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            heading="What you get"
            description="Two focused paths. Pick the one that fits the job you want. Your subscription opens both, so you can switch any time."
            descriptionClassName="mt-4 text-white/72"
          />

          <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {PATH_OFFERS.map((offer, index) => (
              // A <div>, not an <article>: globals.css styles every
              // `article ul` as blog prose (bullets, grey text).
              <div
                key={offer.id}
                className={`flex flex-col rounded-xl border p-6 sm:p-7 ${
                  offer.id === "ai-engineering"
                    ? "border-primary/45 bg-[linear-gradient(180deg,rgba(19,174,206,.10),rgba(255,255,255,.03)_45%)]"
                    : "border-white/14 bg-white/[0.04]"
                }`}
              >
                <span className="eyebrow-mono text-primary">
                  path 0{index + 1}
                </span>
                <h3 className="mt-2 text-[26px] font-bold tracking-tight">
                  {offer.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/72">
                  {offer.summary}
                </p>

                <div className="mt-6 border-t border-white/12 pt-4">
                  <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/55">
                    {offer.routeLabel}
                  </h4>
                  <ol className="mt-2 flex flex-col">
                    {offer.route.map((milestone, i) => {
                      const isHighlight = offer.highlight.includes(milestone);
                      return (
                        <li
                          key={milestone}
                          className="flex items-center gap-3 py-1.5"
                        >
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] ${
                              isHighlight
                                ? "bg-primary text-[#05262F]"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span
                            className={
                              isHighlight
                                ? "text-[15px] font-bold text-primary"
                                : "text-[15px] text-white/90"
                            }
                          >
                            {milestone}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                    {offer.routeNote}
                  </p>
                </div>

                <div className="mt-5 border-t border-white/12 pt-4">
                  <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/55">
                    Courses included
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {offer.courses.map((course) => (
                      <li
                        key={course}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-white/85"
                      >
                        {course}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 border-t border-white/12 pt-4">
                  <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/55">
                    Practical training
                  </h4>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {offer.practice.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 text-[14.5px] text-white/85"
                      >
                        <span className="mt-0.5 text-primary">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openCheckout("what-you-get", offer.id)}
                  className={`${CTA_CLASS} mt-7 self-start px-6 py-3 text-[15px]`}
                >
                  Start {LP_PATH_LABELS[offer.id]} — {price}/mo
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 items-center gap-4 rounded-xl border border-dashed border-white/25 px-6 py-5 lg:grid-cols-[auto_1fr] lg:gap-8">
            <p className="text-base font-bold">
              In both paths
              <span className="block text-[13.5px] font-normal text-white/72">
                One subscription. Nothing costs extra.
              </span>
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:justify-end">
              {SHARED_INCLUSIONS.map((item) => (
                <li key={item} className="flex gap-2 text-[14px] text-white/90">
                  <span className="text-primary">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
        </div>
      </section>

      {/* FOR YOU / NOT FOR YOU */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:px-12">
        <SectionHeading heading="Is this for you?" />
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/30 bg-card p-6">
            <h3 className="text-[17px] font-bold">This is for you if</h3>
            <ul className="mt-4 flex flex-col gap-3.5">
              {FOR_YOU.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-[15.5px] leading-relaxed text-muted-foreground"
                >
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
                <li
                  key={line}
                  className="flex gap-3 text-[15.5px] leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 text-muted-foreground/60">✕</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CHECKOUT (inline, for people who scroll the whole way) */}
      <section
        id="start"
        className="scroll-mt-14 bg-[#0A1726] py-16 text-white"
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12">
          <div>
            <span className="eyebrow-mono text-[#4AC5E8]">start today</span>
            <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.06] tracking-tight">
              Pick your path. Start tonight.
            </h2>

            <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-white/72">
              For {price} a month you get your path, all 19 courses, code
              reviews on your projects and unlimited AI mock interviews. You can
              cancel any time while keeping your progress.
            </p>
            <p className="mt-4 text-xs">
              <span className="text-red-500">
                Full refund if you are not satisfied and ask within the first 3
                days of subscription.
              </span>
            </p>
            <p className="mt-2 text-xs text-white/46 [&_b]:text-white/80">
              {discountLine} Your rate stays the same for as long as you stay
              subscribed.
            </p>
          </div>
          <InlineCheckout
            checkout={checkout}
            path={path}
            onPathChange={setPath}
          />
        </div>
      </section>

      {/* FAQ */}
      <GridSection className="bg-[#F4F7FA] py-16">
        <SectionHeading heading="Frequently asked." />
        <div className="mx-auto mt-8 max-w-2xl">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group border-b border-border py-1 first:border-t"
            >
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
            Whether you are starting out or levelling up the career you already
            have, pick a path, subscribe today and open your first lesson
            tonight.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {pathCtas("final", CTA_ON_LIGHT_CLASS)}
          </div>
          <p className="mt-3 text-[13.5px] text-muted-foreground [&_b]:text-foreground">
            {discountLine} Cancel any time.
          </p>
          <p className="mx-auto mt-10 max-w-[48ch] text-balance text-[15px] leading-relaxed text-muted-foreground">
            You would be one of the one million Africans we are democratizing
            backend and AI engineering skills for.
          </p>
        </div>
      </GridSection>

      {/* FOOTER */}
      <footer className="bg-[#0E1F33] py-12 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[17px] font-bold">
              <img
                src="/logo-white-icon.png"
                alt=""
                className="h-6 w-6 object-contain"
              />
              masteringbackend.
            </span>
            <p className="text-sm text-white/46">Learn. Build. Grow.</p>
            <a
              href="#offer"
              className="inline-flex items-center rounded-full border border-white/30 px-5 py-3 text-sm font-bold transition-colors duration-200 hover:bg-white/10"
            >
              Choose your path
            </a>
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
