"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { siteConfig } from "@/lib/site-config";
import { buildQuoteReferenceMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { ConfiguratorState } from "@/lib/rab";

export function QuoteModal({
  open,
  onClose,
  vehicleType,
  config,
}: {
  open: boolean;
  onClose: () => void;
  vehicleType: string;
  config: ConfiguratorState;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string; id: string } | null>(null);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError(t.quote.requiredField);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.quote.invalidEmail);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          notes: notes.trim() || null,
          vehicleType,
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.quote.errorMsg);
      setResult({ reference: data.reference, id: data.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.quote.errorMsg);
    } finally {
      setSending(false);
    }
  }

  /** Kirim nomor referensi + tautan penawaran ke WhatsApp bengkel. */
  function sendReferenceWhatsApp() {
    if (!result) return;
    const message = buildQuoteReferenceMessage({
      intro: t.whatsapp.quoteIntro,
      reference: result.reference,
      linkLabel: t.whatsapp.quoteLink,
      link: `${window.location.origin}/penawaran/${result.id}`,
      closing: t.whatsapp.closing,
    });
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        {result ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✅
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              {t.quote.successTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t.quote.successMsg}
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-emerald-600">
                {t.configurator.quoteRef}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-800">
                {result.reference}
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a
                href={`/penawaran/${result.id}`}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                {t.configurator.rabTitle} →
              </a>
              <button
                type="button"
                onClick={sendReferenceWhatsApp}
                className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1eb455]"
              >
                💬 {t.configurator.sendWhatsApp}
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t.quote.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{t.quote.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={t.common.close}
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t.quote.name} <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.quote.namePh}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t.quote.email} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.quote.emailPh}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t.quote.phone} {t.common.optional}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.quote.phonePh}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t.quote.notes} {t.common.optional}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.quote.notesPh}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {sending ? `${t.quote.sending}...` : t.quote.submit}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
              </div>
              <p className="text-center text-xs text-slate-400">
                {siteConfig.name} · {siteConfig.email}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
