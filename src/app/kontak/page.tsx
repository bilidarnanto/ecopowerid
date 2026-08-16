"use client";

import { useI18n } from "@/lib/i18n/provider";
import { siteConfig } from "@/lib/site-config";

export default function ContactPage() {
  const { t, lang } = useI18n();
  const wa = `https://wa.me/${siteConfig.whatsapp}`;

  const cards = [
    { icon: "💬", label: t.contact.whatsapp, value: siteConfig.phone, href: wa },
    { icon: "✉️", label: t.contact.email, value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    { icon: "📍", label: t.contact.address, value: lang === "id" ? siteConfig.addressId : siteConfig.addressEn },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {t.contact.title}
      </h1>
      <p className="mt-2 text-slate-600">{t.contact.subtitle}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">{c.icon}</div>
            <h3 className="mt-3 font-bold text-slate-900">{c.label}</h3>
            {c.href ? (
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="mt-1 inline-block text-emerald-600 hover:underline"
              >
                {c.value}
              </a>
            ) : (
              <p className="mt-1 text-slate-700">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900">{t.contact.hoursTitle}</h3>
        <p className="mt-1 text-slate-700">{t.contact.hours}</p>
      </div>

      <div className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-center text-white shadow-xl">
        <h2 className="text-2xl font-bold">{t.home.ctaTitle}</h2>
        <p className="mx-auto mt-2 max-w-xl text-emerald-50/90">{t.home.ctaSubtitle}</p>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-emerald-700 shadow transition-transform hover:scale-[1.02]"
        >
          💬 {t.home.ctaButton}
        </a>
      </div>
    </div>
  );
}
