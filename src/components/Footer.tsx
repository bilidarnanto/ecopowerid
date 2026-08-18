"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/provider";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  const { t, lang } = useI18n();

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 no-print">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.jpg"
              alt={siteConfig.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-white">{siteConfig.name}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {lang === "id" ? siteConfig.taglineId : siteConfig.taglineEn}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            {t.footer.quickLinks}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-emerald-400" href="/konfigurator">{t.nav.configurator}</Link></li>
            <li><Link className="hover:text-emerald-400" href="/plts">{t.nav.plts}</Link></li>
            <li><Link className="hover:text-emerald-400" href="/galeri">{t.nav.gallery}</Link></li>
            <li><Link className="hover:text-emerald-400" href="/kontak">{t.nav.contact}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            {t.footer.services}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>{t.home.serviceCampervan}</li>
            <li>{t.home.serviceMotorhome}</li>
            <li>{t.home.serviceFoodtruck}</li>
            <li>{t.home.servicePlts}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            {t.contact.infoTitle}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>📞 {siteConfig.phone}</li>
            <li>✉️ {siteConfig.email}</li>
            <li>📍 {lang === "id" ? siteConfig.addressId : siteConfig.addressEn}</li>
            <li>🕐 {t.contact.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {siteConfig.name}. {t.footer.rights}
      </div>
    </footer>
  );
}
