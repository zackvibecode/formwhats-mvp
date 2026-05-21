import ButtonLink from "@/components/button-link";
import { CheckIcon, WhatsAppMark } from "@/components/landing/icons";
import Reveal from "@/components/landing/reveal";

// --- Section data ---------------------------------------------------------

type Plan = {
  name: string;
  price: string;
  badge?: string;
  perks: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "RM0",
    perks: [
      "2 forms",
      "50 responses / month",
      "WhatsApp redirect",
      "FormWhats branding",
    ],
    cta: "Start Free",
  },
  {
    name: "Starter",
    price: "RM19",
    perks: ["10 forms", "500 responses / month", "Remove branding", "QR code"],
    cta: "Choose Starter",
  },
  {
    name: "Pro",
    price: "RM49",
    badge: "Recommended",
    perks: [
      "50 forms",
      "3,000 responses / month",
      "QR code",
      "Response dashboard",
      "Custom thank you message",
    ],
    cta: "Choose Pro",
  },
  {
    name: "Agency",
    price: "RM99",
    perks: [
      "Unlimited forms",
      "10,000 responses / month",
      "Multiple WhatsApp numbers",
      "Team use",
    ],
    cta: "Contact Us",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Do I need coding knowledge?",
    a: "No. You can create and share WhatsApp forms without coding.",
  },
  {
    q: "Can I use this for WhatsApp Business?",
    a: "Yes. You can use your WhatsApp or WhatsApp Business number.",
  },
  {
    q: "Can I share the form using QR code?",
    a: "Yes. Each form can be shared using a public link and QR code.",
  },
  {
    q: "Does it save customer responses?",
    a: "Yes. Customer responses are saved so you can review them later.",
  },
  {
    q: "Is payment required to start?",
    a: "No. You can start with the free plan.",
  },
];

// --- Sections -------------------------------------------------------------

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Simple pricing for growing businesses
          </h2>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Start free, upgrade when you outgrow it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const isHighlighted = plan.badge === "Recommended";
            const baseClass =
              "relative flex flex-col rounded-2xl bg-white p-6 transition-all hover:-translate-y-1";
            const cardClass = isHighlighted
              ? `${baseClass} border-2 border-brand shadow-glow-brand ring-1 ring-brand/40 animate-pulse-soft`
              : `${baseClass} border border-gray-200 shadow-sm hover:border-brand/30 hover:shadow-md`;

            return (
              <Reveal
                key={plan.name}
                delay={i * 80}
                className={cardClass}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-whatsapp-gradient px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-glow-brand">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-black">{plan.name}</h3>
                <p className="mt-3 flex items-baseline gap-1 text-black">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    / month
                  </span>
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm text-gray-700">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <ButtonLink
                    href="/login"
                    variant={isHighlighted ? "primary" : "secondary"}
                    className="!w-full !justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {plan.cta}
                  </ButtonLink>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Quick answers to the things people ask before signing up.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-black">
                  {f.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition group-open:rotate-180 group-open:bg-brand/10 group-open:text-brand-dark">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {f.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/15 via-white to-white p-10 shadow-sm sm:p-14">
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          />

          {/* Floating WhatsApp pill */}
          <div className="pointer-events-none absolute right-6 top-6 hidden items-center gap-2 rounded-full bg-whatsapp-gradient px-4 py-2 text-xs font-semibold text-white shadow-glow-brand animate-float sm:inline-flex">
            <WhatsAppMark className="h-5 w-5" />
            Open in WhatsApp
          </div>

          <div className="relative text-center">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Start collecting better WhatsApp leads today.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 sm:text-base">
              Create your first WhatsApp form in minutes.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/login"
                variant="primary"
                className="transition-transform hover:scale-[1.02]"
              >
                Create Form
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="secondary"
                className="transition-transform hover:scale-[1.02]"
              >
                Login
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
