import ButtonLink from "@/components/button-link";
import {
  CheckIcon,
  LayersIcon,
  QrIcon,
  SparkleIcon,
  WhatsAppMark,
} from "@/components/landing/icons";

// --- Sample form rendered inside the phone mockup -------------------------

const PHONE_FORM_FIELDS: { label: string; value: string }[] = [
  { label: "Name", value: "Ahmad" },
  { label: "Phone Number", value: "60123456789" },
  { label: "Destination", value: "Yunnan" },
  { label: "Travel Date", value: "March 2026" },
  { label: "Number of Pax", value: "4" },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]">
      {/* Subtle radial halo behind the phone */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-brand/15 via-white to-white blur-2xl"
      />

      <div className="relative rounded-[2.4rem] border border-gray-200 bg-gray-900 p-2 shadow-2xl">
        {/* Phone screen */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white">
          {/* Notch */}
          <div className="flex justify-center pt-2.5">
            <div className="h-1.5 w-16 rounded-full bg-gray-300" />
          </div>

          <div className="px-5 pb-6 pt-4">
            {/* Header bar */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-medium">9:41</span>
              <span className="font-medium">FormWhats</span>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold leading-tight tracking-tight text-black">
                Customer Inquiry
                <br />
                Form
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">
                Tell us a bit about your trip.
              </p>
            </div>

            {/* Form fields */}
            <ul className="mt-5 flex flex-col gap-3">
              {PHONE_FORM_FIELDS.map((f) => (
                <li key={f.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    {f.label}
                  </p>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-black">
                    {f.value}
                  </div>
                </li>
              ))}
            </ul>

            {/* Continue button (WhatsApp-style) */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp-gradient px-4 py-3 text-sm font-semibold text-white shadow-glow-brand"
            >
              <WhatsAppMark className="h-5 w-5" />
              Continue to WhatsApp
            </button>

            <p className="mt-2 text-center text-[10px] text-gray-400">
              We&apos;ll forward your details on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Floating decorative cards -------------------------------------------

function FloatingFieldsCard() {
  return (
    <div className="hidden md:absolute md:-left-10 md:top-10 md:flex md:items-center md:gap-3 md:rounded-2xl md:border md:border-gray-200 md:bg-white/85 md:px-4 md:py-3 md:shadow-lg md:backdrop-blur md:animate-float md:[animation-delay:0ms]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
        <LayersIcon className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">
          Builder
        </p>
        <p className="text-sm font-semibold text-black">5 fields ready</p>
      </div>
    </div>
  );
}

function FloatingQrCard() {
  return (
    <div className="hidden lg:absolute lg:-right-12 lg:top-24 lg:flex lg:items-center lg:gap-3 lg:rounded-2xl lg:border lg:border-gray-200 lg:bg-white/85 lg:px-4 lg:py-3 lg:shadow-lg lg:backdrop-blur lg:animate-float-slow lg:[animation-delay:300ms]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white">
        <QrIcon className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">
          Share
        </p>
        <p className="text-sm font-semibold text-black">QR link generated</p>
      </div>
    </div>
  );
}

function FloatingMessageCard() {
  return (
    <div className="hidden md:absolute md:-bottom-6 md:left-1/2 md:flex md:-translate-x-1/2 md:items-center md:gap-3 md:rounded-2xl md:border md:border-gray-200 md:bg-white md:px-4 md:py-3 md:shadow-xl md:animate-float md:[animation-delay:600ms]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp-gradient text-white shadow-glow-brand">
        <WhatsAppMark className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">
          Auto message
        </p>
        <p className="text-sm font-semibold text-black">
          WhatsApp message ready
        </p>
      </div>
    </div>
  );
}

function OpenInWhatsAppPill() {
  return (
    <div className="hidden xl:absolute xl:-bottom-2 xl:-left-10 xl:flex xl:items-center xl:gap-2 xl:rounded-full xl:bg-whatsapp-gradient xl:px-4 xl:py-2 xl:text-xs xl:font-semibold xl:text-white xl:shadow-glow-brand xl:animate-pulse-soft">
      <WhatsAppMark className="h-5 w-5" />
      Open in WhatsApp
    </div>
  );
}

// --- Hero -----------------------------------------------------------------

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft gradient background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 via-white to-white"
      />
      <div
        aria-hidden
        className="absolute right-[-10%] top-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-brand/15 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">
          {/* Left: copy */}
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-dark">
              <SparkleIcon className="h-4 w-4" />
              Built for WhatsApp-first businesses
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
              Turn customer forms into{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand-dark">
                  WhatsApp-ready
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full bg-brand/20"
                />
              </span>{" "}
              leads.
            </h1>

            <p className="mt-5 text-base text-gray-600 sm:text-lg">
              Create simple forms, collect customer details, and send
              ready-to-chat messages directly to WhatsApp.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink
                href="/login"
                variant="primary"
                className="group transition-transform hover:scale-[1.02]"
              >
                Get Started Free
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="secondary"
                className="transition-transform hover:scale-[1.02]"
              >
                Login
              </ButtonLink>
            </div>

            <div className="mt-5 flex flex-col items-center gap-2 text-xs text-gray-500 sm:flex-row sm:justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-brand-dark" />
                No coding needed
              </span>
              <span className="hidden text-gray-300 sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-brand-dark" />
                Built for WhatsApp-first businesses
              </span>
            </div>
          </div>

          {/* Right: phone mockup + floating cards */}
          <div className="relative animate-fade-up [animation-delay:150ms]">
            <PhoneMockup />
            <FloatingFieldsCard />
            <FloatingQrCard />
            <FloatingMessageCard />
            <OpenInWhatsAppPill />
          </div>
        </div>
      </div>
    </section>
  );
}
