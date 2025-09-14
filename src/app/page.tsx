'use client';

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

// Tailwind quick helpers used below:
// container: mx-auto max-w-7xl px-4 sm:px-6 lg:px-8
// section: py-16 sm:py-20 lg:py-28

export default function BoardReadyStyleLanding() {
  // Rotating audience labels like the original site (Medical Students, SRNAs, etc.)
  const audiences = useMemo(
    () => [
      "Medical Students",
      "SRNAs",
      "PA-Students",
      "Residents",
      "CRNAs",
      "Physician Assistants",
      "Anesthesia Assistants",
      "ICU RNs",
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % audiences.length), 2200);
    return () => clearInterval(t);
  }, [audiences.length]);

  return (
    <div className="min-h-screen text-slate-900 bg-white">
      <Header />
      <Hero currentAudience={audiences[idx]} />
      <TrustedStrip />
      <FeaturesPrimary />
      <WhatWeOffer />
      <Stats />
      <ProgressAndHabits />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-sky-600" aria-hidden />
          <span className="font-semibold tracking-tight">BoardReady‑style</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-700">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#offer" className="hover:text-slate-900">What we offer</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
          <a href="#contact" className="hover:text-slate-900">Contact</a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <a className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" href="#signin">Sign in</a>
          <a className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700" href="#try">Try free</a>
        </div>
        <button aria-label="Open menu" className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200">☰</button>
      </div>
    </header>
  );
}

function Hero({ currentAudience }: { currentAudience: string }) {
  return (
    <motion.section
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 -translate-x-1/2 -top-24 h-[36rem] w-[36rem] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-12 relative">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-sky-700 bg-sky-50 ring-1 ring-sky-200 px-3 py-1 rounded-full mb-4">
            Voice‑first clinical learning
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Voice‑Based AI Clinical
            <span className="block bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              Simulations
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
            Übe klinische Entscheidungsfindung, Kommunikation und Fallpräsentationen in realitätsnahen, sprachgesteuerten Szenarien – ideal für Studium, Klinik und Boards.
          </p>
          <p className="mt-3 text-base text-slate-500">
            Für&nbsp;
            <span className="font-semibold text-slate-900">{currentAudience}</span>
            
          </p>
          <div className="mt-8 flex items-center gap-3">
            <a href="#start" className="px-5 py-3 rounded-xl bg-sky-600 text-white hover:bg-sky-700">Jetzt starten</a>
            <a href="#case" className="px-5 py-3 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50">Kostenlosen Case testen</a>
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">★ ★ ★ ★ ★<span className="sr-only">5 Sterne</span></span>
            <span>Vertraut von Studierenden &amp; Residents</span>
          </div>
        </div>

        {/* Conversational demo card */}
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-xl">
            <div className="rounded-xl bg-slate-900 text-slate-50 p-4 mb-4">
              <div className="text-xs uppercase tracking-wider text-slate-300">Clinical Case in Progress</div>
              <p className="mt-1 text-sm text-slate-200">
                „Ein 58‑jähriger Patient kommt mit akutem Thoraxschmerz und Dyspnoe in die Notaufnahme…“
              </p>
            </div>
            <ChatBubble who="You" text="Ich ordere EKG, Troponin und eine Röntgenaufnahme an." />
            <ChatBubble who="AI Preceptor" text="Gute Wahl. EKG ist unauffällig, Troponin leicht erhöht. Wie gehst du weiter vor?" variant="ai" />
            <div className="mt-4 flex gap-2">
              <button className="flex-1 h-11 rounded-xl bg-sky-600 text-white hover:bg-sky-700">Mikro starten</button>
              <button className="flex-1 h-11 rounded-xl border border-slate-200 hover:bg-slate-50">Fall fortsetzen</button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ChatBubble({ who, text, variant }: { who: string; text: string; variant?: "ai" | "you" }) {
  const isAI = variant === "ai";
  return (
    <div className={`flex items-start gap-3 ${isAI ? "flex-row" : "flex-row-reverse"} not-italic`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${isAI ? "bg-slate-100 text-slate-800" : "bg-sky-600 text-white"}`}>
        <div className="text-[10px] uppercase tracking-wider/3 opacity-70 mb-1">{who}</div>
        {text}
      </div>
      <div className={`h-8 w-8 rounded-full ${isAI ? "bg-slate-200" : "bg-sky-600"}`} aria-hidden />
    </div>
  );
}

function FadeInSection(
  props: React.ComponentProps<typeof motion.section>
) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      {...props}
    />
  );
}

function TrustedStrip() {
  return (
    <FadeInSection className="py-10 border-y border-slate-100 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500">Trusted by students and residents</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center opacity-80">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}

function FeaturesPrimary() {
  const items = [
    {
      title: "Voice‑Based Practice",
      desc:
        "Trainiere klinische Kommunikation, Fallpräsentationen und Entscheidungsfindung laut ausgesprochen – wie in der Praxis.",
    },
    {
      title: "AI‑Powered Tech",
      desc:
        "Adaptive Szenarien erkennen Wissenslücken in Echtzeit und verwandeln sie in Stärken.",
    },
    {
      title: "Real‑World Application",
      desc:
        "Überbrücke die Lücke zwischen Multiple‑Choice‑Wissen und klinischer Umsetzung unter Druck.",
    },
  ];
  return (
    <FadeInSection id="features" className="section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">AI‑gestützte Sprachszenarien für messbaren Lernerfolg</h2>
            <p className="mt-4 text-slate-600">
              Vom Lehrbuch ans Patientenbett – durch Stimme. Übe, sprich, reflektiere und verbessere dich kontinuierlich.
            </p>
            <ul className="mt-6 space-y-3">
              {items.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="mt-1 inline-block h-5 w-5 rounded-full bg-sky-600" aria-hidden />
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-slate-600">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 p-2">
            <div className="aspect-video rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}

function WhatWeOffer() {
  const cards = [
    {
      title: "Case Diagnosis Challenge",
      text:
        "Starte mit einer Leitsymptomatik und arbeite dich zur Diagnose vor – per natürlichem Dialog mit dem AI‑Preceptor.",
    },
    {
      title: "Case Scenario",
      text:
        "Hochdynamische Notfall‑Cases mit Vitalwerten und Echtzeit‑Entscheidungen – ideal für Board‑Style‑Training.",
    },
    {
      title: "Patient Presentation",
      text:
        "Übe strukturierte Übergaben &amp; Fallpräsentationen mit sofortigem Feedback zu Klarheit und Vollständigkeit.",
    },
    {
      title: "Difficult Conversations",
      text:
        "Trainiere Aufklärung, schlechte Nachrichten und Gespräche mit Angehörigen mit sensitivem Feedback.",
    },
    {
      title: "Verbal Flashcards",
      text:
        "Festige Wissen durch schnelle, gesprochene Abfragen zu Pharmakologie, Pathophysiologie &amp; Protokollen.",
    },
    {
      title: "Radiology Interpretation",
      text:
        "Beschreibe Röntgen, CT und Sono laut und sicher – für Prüfungen und Klinikalltag.",
    },
  ];
  return (
    <FadeInSection id="offer" className="section bg-slate-50/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-sky-700">What we offer</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">Module &amp; Trainingsformate</h3>
          </div>
          <a href="#all" className="hidden sm:inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-800">Alle ansehen →</a>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <article key={c.title} className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="aspect-[16/9] rounded-xl bg-slate-100 mb-4" />
              <h4 className="font-semibold text-lg">{c.title}</h4>
              <p className="mt-2 text-slate-600 text-sm">{c.text}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-sky-700">Mehr erfahren<span aria-hidden>→</span></div>
            </article>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}

function Stats() {
  const stats = [
    { value: "52", label: "Annual CME Credits" },
    { value: "Weekly", label: "New Cases" },
    { value: "100%", label: "Accredited" },
    { value: "AUTO", label: "Certificate Generation" },
  ];
  return (
    <FadeInSection className="section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1 text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}

function ProgressAndHabits() {
  const items = [
    { title: "Streak Tracking", text: "Baue Konsistenz mit täglichen Übungsserien auf." },
    { title: "Progress Analytics", text: "Visualisiere Fortschritt über alle Kompetenzen." },
    { title: "Peer Benchmarking", text: "Vergleiche dich anonym mit Peers." },
    { title: "Achievement Badges", text: "Feiere Meilensteine &amp; Mastery." },
  ];
  return (
    <FadeInSection className="section bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold tracking-tight">Make Learning a Daily Habit</h3>
        <p className="mt-2 text-slate-600 max-w-2xl">Tracke deinen Weg, feiere Erfolge und sieh messbare Verbesserungen.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-10 w-10 rounded-xl bg-slate-100 mb-4" />
              <h4 className="font-semibold">{it.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}

function Testimonials() {
  const t = [
    {
      name: "Emily R.",
      role: "PA‑S",
      quote:
        "Hat mir geholfen, unter Druck klar zu denken. Die Sprach‑Drills fühlten sich real an, und das Feedback war präzise.",
    },
    {
      name: "James M.",
      role: "SRNA",
      quote:
        "Die Fälle wirkten realistisch, das Feedback war scharf, und ich konnte flexibel lernen.",
    },
    {
      name: "Sarah L.",
      role: "MS‑3",
      quote: "Nichts war so hilfreich. Schnell, realistisch und stärkt die Art, wie ich Fälle laut strukturiere.",
    },
  ];
  return (
    <FadeInSection className="section" aria-labelledby="testimonials-heading">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3 id="testimonials-heading" className="text-3xl font-bold tracking-tight">Success stories</h3>
        <div className="mt-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-6 min-w-max pr-6">
            {t.map((x) => (
              <figure key={x.name} className="w-80 shrink-0 rounded-2xl border border-slate-200 bg-white p-6">
                <blockquote className="text-slate-700">“{x.quote}”</blockquote>
                <figcaption className="mt-4 text-sm text-slate-500">{x.name} · {x.role}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}

function CTA() {
  return (
    <FadeInSection className="section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-slate-50 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Join the voice‑first revolution</h3>
            <p className="mt-2 text-slate-300 max-w-xl">Starte heute mit einem kostenlosen Fall und mach deine Stimme zur Superpower fürs klinische Denken.</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="#start" className="px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-200">Get started</a>
            <a href="#demo" className="px-5 py-3 rounded-xl border border-slate-700 text-slate-50 hover:bg-slate-800">Try a free case</a>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}

function Footer() {
  return (
    <motion.footer
      className="pt-16 pb-10 border-t border-slate-100 bg-white"
      id="contact"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-sky-600" aria-hidden />
              <span className="font-semibold tracking-tight">BoardReady‑style</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 max-w-xs">Voice‑based AI study partner for clinical learners.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              <li><a href="#offer" className="hover:text-slate-900">Modules</a></li>
              <li><a href="#pricing" className="hover:text-slate-900">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#about" className="hover:text-slate-900">About</a></li>
              <li><a href="#blog" className="hover:text-slate-900">Blog</a></li>
              <li><a href="#careers" className="hover:text-slate-900">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="mailto:hello@example.com" className="hover:text-slate-900">hello@example.com</a></li>
              <li>San Francisco, CA</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Your Company</p>
          <div className="flex items-center gap-4">
            <a href="#terms" className="hover:text-slate-900">Terms</a>
            <a href="#privacy" className="hover:text-slate-900">Privacy</a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

