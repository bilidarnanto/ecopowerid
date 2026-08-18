"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { siteConfig } from "@/lib/site-config";

const SERVICES = [
  { key: "campervan", emoji: "🚐", grad: "from-emerald-500 to-teal-600" },
  { key: "motorhome", emoji: "🚌", grad: "from-sky-500 to-blue-600" },
  { key: "foodtruck", emoji: "🍔", grad: "from-amber-500 to-orange-600" },
  { key: "plts", emoji: "☀️", grad: "from-yellow-500 to-amber-500" },
] as const;

export default function HomePage() {
  const { t } = useI18n();
  const wa = `https://wa.me/${siteConfig.whatsapp}`;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1.5px, transparent 1.5px), radial-gradient(circle at 80% 70%, #fff 1.5px, transparent 1.5px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            ☀️ {t.hero.badge}
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-emerald-50/90">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/konfigurator"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-bold text-emerald-700 shadow-lg transition-transform hover:scale-[1.02]"
            >
              {t.hero.ctaConfigurator} →
            </Link>
            <Link
              href="/plts"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/70 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              {t.hero.ctaPlts}
            </Link>
          </div>

          <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6">
            {[
              { v: "150+", label: t.hero.statProjects },
              { v: "10+", label: t.hero.statYears },
              { v: "1.2 MWp", label: t.hero.statWp },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                <div className="text-2xl font-extrabold sm:text-3xl">{s.v}</div>
                <div className="mt-1 text-xs text-emerald-50/80 sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAYANAN */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.home.servicesTitle}
          </h2>
          <p className="mt-3 text-slate-600">{t.home.servicesSubtitle}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link
              key={s.key}
              href={s.key === "plts" ? "/plts" : "/konfigurator"}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-2xl text-white shadow`}>
                {s.emoji}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {t.home[`service${s.key.charAt(0).toUpperCase()}${s.key.slice(1)}` as keyof typeof t.home] as string}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t.home[`service${s.key.charAt(0).toUpperCase()}${s.key.slice(1)}Desc` as keyof typeof t.home] as string}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-emerald-600 group-hover:underline">
                Mulai →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* KENAPA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.home.whyTitle}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[t.home.why1, t.home.why2, t.home.why3, t.home.why4].map((w, i) => (
              <div key={i} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {i + 1}
                </span>
                <p className="pt-1.5 text-sm leading-relaxed text-slate-700">{w}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-center text-white shadow-xl sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-50/90">{t.home.ctaSubtitle}</p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-emerald-700 shadow transition-transform hover:scale-[1.02]"
          >
            💬 {t.home.ctaButton}
          </a>
        </div>
      </section>
    </div>
  );
}
