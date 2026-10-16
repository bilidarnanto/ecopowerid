"use client";

import { useI18n } from "@/lib/i18n/provider";

/**
 * Bar ringkasan yang menempel di bagian bawah layar — hanya tampil di mobile.
 * Tujuannya: total estimasi dan tombol hubungi bengkel selalu terlihat
 * selama pelanggan menelusuri langkah-langkah konfigurasi.
 */
export function StickyTotalBar({
  visible,
  totalLabel,
  onWhatsApp,
  onQuote,
}: {
  visible: boolean;
  totalLabel: string | null;
  onWhatsApp: () => void;
  onQuote: () => void;
}) {
  const { t } = useI18n();

  if (!visible) return null;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {t.configurator.stickyTotal}
          </div>
          <div className="truncate text-base font-extrabold leading-tight text-emerald-700">
            {totalLabel ?? "—"}
          </div>
        </div>

        <button
          type="button"
          onClick={onWhatsApp}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1eb455]"
        >
          💬 <span className="hidden sm:inline">WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={onQuote}
          className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
        >
          📨 {t.configurator.stickyQuote}
        </button>
      </div>
    </div>
  );
}
