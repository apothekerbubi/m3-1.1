'use client';

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { publicImageUrl } from "@/lib/supabase/publicUrl";

// Tailwind quick helpers used below:
// container: mx-auto max-w-7xl px-4 sm:px-6 lg:px-8
// section: py-16 sm:py-20 lg:py-28

export default function BoardReadyStyleLanding() {
  // Rotating audience labels like the original site (Medical Students, SRNAs, etc.)
  const audiences = useMemo(
    () => [
      "Medizinstudierende",
      "Physician Assistants",
      
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % audiences.length), 3200);
    return () => clearInterval(t);
  }, [audiences.length]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Hero currentAudience={audiences[idx]} />
      <TrustedStrip />
      <FeaturesPrimary />
      <WhatWeOffer />
      <Stats />
      <ProgressAndHabits />
      <Pricing />
      <Testimonials />
      <CTA />
    </div>
  );
}
type LogoDefinition = {
  name: string;
  supabasePath: string;
  fallbackSrc: string;
};
type SupabaseAssetDefinition = {
  supabasePath: string;
  fallbackSrc: string;
  alt: string;
};


const SUPABASE_LOGO_BUCKET = "Unilogos"; // Falls du einen anderen Bucket nutzt, hier anpassen.
const SUPABASE_MEDIA_BUCKET = "landing"; // Bucket für Landingpage-Grafiken.

const LOGO_DEFINITIONS: ReadonlyArray<LogoDefinition> = [
  {
    name: "MedUni Rhein",
    supabasePath: "LMU_Muenchen_Logo.svg",
    fallbackSrc: "/logos/LMU_Muenchen_Logo.svg.png",
  },
  {
    name: "Klinikum Alpen",
    supabasePath: "TUM.png",
    fallbackSrc: "tum-logo.svg",
  },
  {
    name: "HealthLab",
    supabasePath: "UR+UKR.png",
    fallbackSrc: "/logos/Universitätsklinikum_Regensburg_Logo.svg.png",
  },
];

const FEATURE_MEDIA: SupabaseAssetDefinition = {
  supabasePath: "Bild1.jpg",
  fallbackSrc: "/window.svg",
  alt: "Interaktive M3 Fallsimulation auf einem Tablet-Interface",
};

type OfferCardDefinition = {
  title: string;
  text: string;
  image: SupabaseAssetDefinition;
};

const OFFER_CARD_DEFINITIONS: ReadonlyArray<OfferCardDefinition> = [
  {
    title: "Fallbeispiele",
    text:
      "Krankheitstypische und hochdynamische Cases mit Vitalwerten und Echtzeit‑Entscheidungen – ideal für mündliche Prüfungen.",
    image: {
      supabasePath: "fallbeispiele.jpg",
      fallbackSrc: "/file.svg",
      alt: "Studierende übt klinische Falldiskussion mit Tablet",
    },
  },
  {
    title: "Leitsymptome",
    text:
      "Vom Leitsymptom zur Diagnose. Gelange über Anamnese und Diagnostik zur korrekten Diagnose",
    image: {
      supabasePath: "leitsymptome.jpg",
      fallbackSrc: "/globe.svg",
      alt: "Notizen zu Leitsymptomen auf einem Clip Board",
    },
  },
  {
    title: "Examenssimulation",
    text:
      "Verknüpfe Fälle aus der Inneren Medizin, Chirurgie, deinem Wahlfach und deinem Losfach zu einer großen Prüfung und erhalte detailliertes Feedback zu deinen Stärken und Schwächen",
    image: {
      supabasePath: "examenssimulation.jpg",
      fallbackSrc: "/window.svg",
      alt: "Digitale Simulation einer mündlichen Examenssituation",
    },
  },
  {
    title: "Daily Case Diagnosis Challenge",
    text:
      "Starte mit einer Leitsymptomatik und arbeite dich zur Diagnose vor – durch natürlichem Dialog mit unserem KI-Prüfer.",
    image: {
      supabasePath: "daily-case.jpg",
      fallbackSrc: "/window.svg",
      alt: "Mobile App mit täglicher klinischer Case Challenge",
    },
  },
  {
    title: "Patientvorstellung",
    text:
      "Übe strukturierte Übergaben &amp; Fallpräsentationen mit sofortigem Feedback zu Klarheit und Vollständigkeit.",
    image: {
      supabasePath: "landing/patientvorstellung.jpg",
      fallbackSrc: "/file.svg",
      alt: "Studierende präsentiert einen Fall am Bett",
    },
  },
  {
    title: "Lernplan-Erstellung",
    text:
      "Du weißt, wer dich prüft? Lade alte Mitschriften hoch und erhalte Empfehlungen, auf welche Fälle du dich konzentrieren solltest.",
    image: {
      supabasePath: "landing/lernplan.jpg",
      fallbackSrc: "/globe.svg",
      alt: "Planung eines Lernplans mit Laptop und Notizbuch",
    },
  },
];

type HabitDefinition = {
  title: string;
  text: string;
  image: SupabaseAssetDefinition;
};

const HABIT_DEFINITIONS: ReadonlyArray<HabitDefinition> = [
  {
    title: "Streak Tracking",
    text: "Baue Konsistenz mit täglichen Übungsserien auf",
    image: {
      supabasePath: "landing/streak-tracking.png",
      fallbackSrc: "/window.svg",
      alt: "Kalender mit markierten Übungstagen",
    },
  },
  {
    title: "Progress Analytics",
    text: "Visualisiere Fortschritt über alle Kompetenzen.",
    image: {
      supabasePath: "landing/progress-analytics.png",
      fallbackSrc: "/globe.svg",
      alt: "Dashboard mit Fortschrittsdiagrammen",
    },
  },
  {
    title: "Peer Benchmarking",
    text: "Vergleiche dich anonym mit Peers.",
    image: {
      supabasePath: "landing/peer-benchmarking.png",
      fallbackSrc: "/file.svg",
      alt: "Vergleichsgrafik zu Peer-Benchmarks",
    },
  },
];

function resolveSupabaseAsset(
  path: string,
  fallbackSrc: string,
  bucket = SUPABASE_MEDIA_BUCKET
) {
  try {
    return publicImageUrl(path, bucket);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[resolveSupabaseAsset] Konnte ${path} nicht laden, fallback auf ${fallbackSrc}.`, error);
    }
    return fallbackSrc;
  }
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
            Fallbasiert zum erfahrenen Kliniker
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            KI-gestützte und interaktive
            <span className="block bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              Fallsimulationen
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
            Übe klinische Entscheidungsfindung, Kommunikation und Fallpräsentationen in realitätsnahen, sprachgesteuerten Szenarien – ideal für Studium, Klinik und Boards.
          </p>
          <p className="mt-3 text-base text-slate-500">
            Für&nbsp;
            <span className="font-semibold text-slate-900">{currentAudience}</span>
            
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link href="/login" className="px-5 py-3 rounded-xl bg-sky-600 text-white hover:bg-sky-700">
              Jetzt starten
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50"
            >
              Kostenlosen Case testen
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">★ ★ ★ ★ ★<span className="sr-only">5 Sterne</span></span>
            <span>Vertraut von Studierenden &amp; Ärzten</span>
          </div>
        </div>

        {/* Conversational demo card */}
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-xl">
            <div className="rounded-xl bg-slate-900 text-slate-50 p-4 mb-4">
              <div className="text-xs uppercase tracking-wider text-slate-300">Klinischer Fall</div>
              <p className="mt-1 text-sm text-slate-200">
                „Ein 58‑jähriger Patient kommt mit akutem Thoraxschmerz und Dyspnoe in die Notaufnahme…“
              </p>
            </div>
            <ChatBubble who="Du" text="Ich ordere EKG, Troponin und eine Röntgenaufnahme an." />
            <ChatBubble who="Prüfer" text="Gute Wahl. EKG ist unauffällig, Troponin leicht erhöht. Wie gehst du weiter vor?" variant="ai" />
            <div className="mt-4 flex gap-2">
              <Link
                href="/login"
                className="flex-1 h-11 rounded-xl bg-sky-600 text-white hover:bg-sky-700 inline-flex items-center justify-center"
              >
                Mikro starten
              </Link>
              <Link
                href="/login"
                className="flex-1 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center justify-center text-slate-800"
              >
                Fall fortsetzen
              </Link>
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
  const logos = useMemo(
    () =>
      LOGO_DEFINITIONS.map(({ name, supabasePath, fallbackSrc }) => ({
        name,
         src: resolveSupabaseAsset(supabasePath, fallbackSrc, SUPABASE_LOGO_BUCKET),
      })),
    []
  );

  const marqueeItems = useMemo(() => [...logos, ...logos], [logos]);
  return (
    <FadeInSection className="py-8 border-y border-slate-100 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500">Bewährt bei Studierenden und Ärzten</p>
        <div className="relative mt-6 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent"
            aria-hidden
          />
           <div className="marquee-track items-center gap-16">
            {marqueeItems.map((logo, index) => (
              <Image
                key={`${logo.name}-${index}`}
                src={logo.src}
                alt={logo.name}
                width={220}
                height={72}
                className="h-16 w-auto flex-shrink-0 opacity-90"
              />
            ))}
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}

function FeaturesPrimary() {
  const items = [
    {
      title: "Realitätsnahe Fälle",
      desc:
        "Trainiere klinische Kommunikation, Fallpräsentationen und Entscheidungsfindung mit direktem Feedback – wie in der Praxis.",
    },
    {
      title: "AI‑Powered Tech",
      desc:
        "Unsere KI erkennt deine Wissenslücken in Echtzeit, gibt dir Feedback und verwandeln sie in Stärken.",
    },
    {
      title: "Experten-kuratierte Fälle",
      desc:
        "Überbrücke die Lücke zwischen Multiple‑Choice‑Wissen und klinischer Umsetzung unter Druck durch unsere Experten-modellierten Fälle.",
    },
  ];
  const featureImageSrc = useMemo(
    () => resolveSupabaseAsset(FEATURE_MEDIA.supabasePath, FEATURE_MEDIA.fallbackSrc),
    []
  );
  return (
     <FadeInSection id="features" className="section bg-sky-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
         <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">KI‑gestützte Szenarien für messbaren Lernerfolg</h2>
            <p className="mt-4 text-slate-600">
              Vom Lehrbuch zur Praxis – mit realistischen Fallbeispielen. Trainiere, erkläre, reflektiere und wachse an jeder Übung.
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
           <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-lg">
            <Image
              src={featureImageSrc}
              alt={FEATURE_MEDIA.alt}
              width={960}
              height={540}
              className="h-auto w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}

function WhatWeOffer() {
   const cards = useMemo(
    () =>
      OFFER_CARD_DEFINITIONS.map((card) => ({
        ...card,
        imageSrc: resolveSupabaseAsset(card.image.supabasePath, card.image.fallbackSrc),
      })),
    []
  );
  return (
     <FadeInSection id="offer" className="section bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-sky-700">Unser Angebot an dich</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">Module &amp; Trainingsformate</h3>
          </div>
          <a href="#all" className="hidden sm:inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-800">Alle ansehen →</a>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <article key={c.title} className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <Image
                src={c.imageSrc}
                alt={c.image.alt}
                width={480}
                height={270}
                className="mb-4 h-44 w-full rounded-xl object-cover"
              />
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
    { value: "Validität", label: "Experten-generierte Fälle" },
    { value: "Wöchentlich", label: "Neue Cases" },
    { value: "KI-getrieben", label: "Sofortiges Feedback" },
    { value: "Lernfortschritt", label: "Tracke deinen Fortschritt" },
  ];
  return (
     <FadeInSection className="section bg-indigo-50">
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
  const items = useMemo(
    () =>
      HABIT_DEFINITIONS.map((habit) => ({
        ...habit,
        imageSrc: resolveSupabaseAsset(habit.image.supabasePath, habit.image.fallbackSrc),
      })),
    []
  );
  return (
     <FadeInSection className="section bg-emerald-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold tracking-tight">Make Learning a Daily Habit</h3>
        <p className="mt-2 text-slate-600 max-w-2xl">Tracke deinen Weg, feiere Erfolge und sieh messbare Verbesserungen.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-slate-200 bg-white p-6">
             <Image
                src={it.imageSrc}
                alt={it.image.alt}
                width={80}
                height={80}
                className="mb-4 h-16 w-16 rounded-xl object-cover"
              />
              <h4 className="font-semibold">{it.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}
function Pricing() {
  // Preise & Features können später individuell angepasst werden.
  const plans = [
    {
      name: "Starter",
      price: "Preis folgt",
      description: "Ideal für einzelne Studierende, die flexibel üben möchten.",
      features: [
        "Platzhalter-Feature 1",
        "Platzhalter-Feature 2",
        "Platzhalter-Feature 3",
      ],
    },
    {
      name: "Professional",
      price: "Preis folgt",
      description: "Für Intensivvorbereitung mit erweitertem Feedback.",
      features: [
        "Platzhalter-Feature A",
        "Platzhalter-Feature B",
        "Platzhalter-Feature C",
      ],
      highlight: true,
    },
    {
      name: "Team",
      price: "Preis folgt",
      description: "Für Lerngruppen, Skills-Labs oder Fakultäten.",
      features: [
        "Platzhalter-Feature α",
        "Platzhalter-Feature β",
        "Platzhalter-Feature γ",
      ],
    },
  ];

  return (
    <FadeInSection id="pricing" className="section bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium text-sky-700">Pricing</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">Wähle den passenden Plan</h3>
          <p className="mt-3 text-slate-600">
            Preise, Laufzeiten und Leistungen kannst du später präzisieren – hier ist die Struktur bereit.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isHighlight = plan.highlight;
            return (
              <article
                key={plan.name}
                className={`relative rounded-3xl border p-8 transition-shadow ${
                  isHighlight
                    ? "border-slate-900 bg-slate-900 text-slate-50 shadow-2xl"
                    : "border-slate-200 bg-white shadow-sm hover:shadow-md"
                }`}
              >
                {isHighlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Beliebt
                  </span>
                )}
                <h4 className="text-xl font-semibold tracking-tight">{plan.name}</h4>
                <p className={`mt-2 text-sm ${isHighlight ? "text-slate-200" : "text-slate-600"}`}>
                  {plan.description}
                </p>
                <div className={`mt-6 text-3xl font-semibold ${isHighlight ? "text-white" : "text-slate-900"}`}>
                  {plan.price}
                </div>
                <ul className={`mt-6 space-y-3 text-sm ${isHighlight ? "text-slate-200" : "text-slate-600"}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          isHighlight ? "bg-sky-400/90" : "bg-sky-100"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isHighlight ? "bg-slate-900" : "bg-sky-500"
                          }`}
                        />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                    isHighlight
                      ? "bg-white text-slate-900 hover:bg-slate-200"
                      : "bg-sky-600 text-white hover:bg-sky-700"
                  }`}
                >
                  Plan auswählen
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </FadeInSection>
  );
}


function Testimonials() {
  const t = [
    {
      name: "Emily R.",
      role: "Medizinstudentin",
      quote:
        "Hat mir geholfen, unter Druck klar zu denken. Die Sprach‑Drills fühlten sich real an, und das Feedback war präzise.",
    },
    {
      name: "James M.",
      role: "Medizinstudent",
      quote:
        "Die Fälle wirkten realistisch, das Feedback war scharf, und ich konnte flexibel lernen.",
    },
    {
      name: "Sarah L.",
      role: "Medizinstudentin",
      quote: "Nichts war so hilfreich. Schnell, realistisch und stärkt die Art, wie ich Fälle laut strukturiere.",
    },
  ];
  return (
    <FadeInSection className="section bg-amber-50" aria-labelledby="testimonials-heading">
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
     <FadeInSection className="section bg-slate-900">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
         <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-10 text-slate-900 shadow-2xl md:flex-row md:p-14">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Join the case‑first revolution</h3>
             <p className="mt-2 max-w-xl text-slate-600">Starte heute mit kostenlosen Fällen – interaktive Fälle mit direkter Rückmeldung durch KI.</p>
          </div>
           <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#start" className="px-5 py-3 rounded-xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-700">Starte hier</a>
            <a href="#demo" className="px-5 py-3 rounded-xl border border-slate-200 text-slate-900 transition hover:bg-slate-100">Kostenlos testen</a>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}

