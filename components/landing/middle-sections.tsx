import type { ComponentType, SVGProps } from "react";
import Reveal from "@/components/landing/reveal";
import {
  BoltIcon,
  ChatIcon,
  CheckIcon,
  FormIcon,
  InboxIcon,
  LayersIcon,
  LinkIcon,
  MobileIcon,
  PhoneIcon,
  QrIcon,
  ShareIcon,
  SparkleIcon,
} from "@/components/landing/icons";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// --- Section data ---------------------------------------------------------

const problems: { icon: IconType; title: string; body: string }[] = [
  {
    icon: FormIcon,
    title: "Customer details come in incomplete",
    body: "Half-filled chats waste your team's time chasing missing info.",
  },
  {
    icon: ChatIcon,
    title: "WhatsApp chats are messy",
    body: "Important details get buried in long, unstructured threads.",
  },
  {
    icon: InboxIcon,
    title: "Leads are hard to track",
    body: "Without records, you lose track of who asked what and when.",
  },
];

const steps: { icon: IconType; title: string; body: string }[] = [
  {
    icon: LayersIcon,
    title: "Create your form",
    body: "Pick the questions you want to ask your customers.",
  },
  {
    icon: ShareIcon,
    title: "Share your link or QR code",
    body: "Drop it in your bio, posters, ads, or chats.",
  },
  {
    icon: MobileIcon,
    title: "Customer submits details",
    body: "They fill in your form on any device, no app needed.",
  },
  {
    icon: ChatIcon,
    title: "WhatsApp opens with a ready message",
    body: "Answers are pre-formatted into a chat-ready message.",
  },
];

const features: { icon: IconType; title: string; body: string }[] = [
  {
    icon: LayersIcon,
    title: "Simple form builder",
    body: "Add and edit fields in seconds.",
  },
  {
    icon: LinkIcon,
    title: "Public form links",
    body: "Share a clean URL with anyone.",
  },
  {
    icon: QrIcon,
    title: "QR code sharing",
    body: "Print and stick anywhere offline.",
  },
  {
    icon: ChatIcon,
    title: "WhatsApp message preview",
    body: "See exactly what gets sent before you send it.",
  },
  {
    icon: InboxIcon,
    title: "Response dashboard",
    body: "Review every customer submission later.",
  },
  {
    icon: PhoneIcon,
    title: "Mobile-friendly forms",
    body: "Polished on any phone, no zooming required.",
  },
];

const useCases: { icon: IconType; label: string }[] = [
  { icon: SparkleIcon, label: "Travel agency" },
  { icon: BoltIcon, label: "Restaurant orders" },
  { icon: LayersIcon, label: "Event registration" },
  { icon: PhoneIcon, label: "Homestay inquiry" },
  { icon: CheckIcon, label: "Clinic appointments" },
  { icon: FormIcon, label: "Tuition registration" },
  { icon: ShareIcon, label: "Car rental booking" },
  { icon: InboxIcon, label: "Service quotation" },
];

// --- Sections -------------------------------------------------------------

export function ProblemSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-black sm:text-4xl">
          Stop asking customers the same questions again and again.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-600 sm:text-base">
          Replace chaotic DMs with structured intake that lands cleanly in your
          WhatsApp.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal
                key={p.title}
                delay={i * 100}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-black">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{p.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            <BoltIcon className="h-3.5 w-3.5" />
            How it works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">
            From form to WhatsApp in 4 steps
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal
                key={s.title}
                delay={i * 100}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
              >
                <span className="absolute right-5 top-5 text-3xl font-extrabold text-gray-100 transition group-hover:text-brand/15">
                  0{i + 1}
                </span>
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-whatsapp-gradient text-white shadow-glow-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-black">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{s.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Everything you need to collect WhatsApp leads
          </h2>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Lean tools that handle the boring parts so you can focus on talking
            to your customers.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal
                key={f.title}
                delay={i * 75}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-black">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{f.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function UseCasesSection() {
  return (
    <section id="use-cases" className="scroll-mt-24 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Built for WhatsApp-first businesses
          </h2>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Whatever you sell, FormWhats funnels inquiries straight into your
            chats.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {useCases.map((u, i) => {
            const Icon = u.icon;
            return (
              <Reveal
                key={u.label}
                delay={i * 50}
                className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-dark transition-transform group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-black">
                  {u.label}
                </span>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
