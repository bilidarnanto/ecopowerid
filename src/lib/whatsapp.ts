// ============================================================
// Bantuan pesan WhatsApp
// ============================================================
// Menyusun ringkasan konfigurasi (atau nomor referensi penawaran) menjadi
// pesan teks siap kirim. Dipakai tombol "Kirim via WhatsApp" di configurator
// dan di layar sukses permintaan penawaran.

import { siteConfig } from "./site-config";

/** URL wa.me lengkap dengan pesan yang sudah di-encode. */
export function buildWhatsAppUrl(
  message: string,
  phone: string = siteConfig.whatsapp
): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Label yang diambil dari kamus i18n (ID/EN). */
export type WhatsAppLabels = {
  intro: string;
  vehicle: string;
  package: string;
  total: string;
  production: string;
  warranty: string;
  location: string;
  link: string;
  closing: string;
  days: string;
  months: string;
};

export type ConfigMessageInput = {
  labels: WhatsAppLabels;
  vehicleLabel: string;
  packageLabel?: string | null;
  /** Total yang sudah diformat (mis. "Rp 123.456.789"). */
  totalLabel?: string | null;
  productionDays?: number | null;
  warrantyMonths?: number | null;
  locationLabel?: string | null;
  peakSunHours?: number | null;
  /** Tautan share konfigurasi (dibuat saat tombol diklik). */
  configurationLink?: string | null;
};

/**
 * Susun ringkasan konfigurasi untuk dikirim lewat WhatsApp.
 * Hanya baris yang datanya tersedia yang ikut dikirim, jadi pesan tetap
 * rapi untuk konfigurasi yang belum lengkap.
 */
export function buildConfigMessage(input: ConfigMessageInput): string {
  const { labels } = input;
  const lines: string[] = [labels.intro, ""];

  lines.push(`🚐 ${labels.vehicle}: ${input.vehicleLabel}`);
  if (input.packageLabel) lines.push(`📦 ${labels.package}: ${input.packageLabel}`);
  if (input.totalLabel) lines.push(`💰 ${labels.total}: ${input.totalLabel}`);
  if (input.productionDays && input.productionDays > 0) {
    lines.push(`⏱️ ${labels.production}: ≈ ${input.productionDays} ${labels.days}`);
  }
  if (input.warrantyMonths && input.warrantyMonths > 0) {
    lines.push(`🛡️ ${labels.warranty}: ${input.warrantyMonths} ${labels.months}`);
  }
  if (input.locationLabel) {
    const psh = input.peakSunHours ? ` (${input.peakSunHours} PSH)` : "";
    lines.push(`📍 ${labels.location}: ${input.locationLabel}${psh}`);
  }
  if (input.configurationLink) {
    lines.push("", `🔗 ${labels.link}`, input.configurationLink);
  }

  lines.push("", labels.closing);
  return lines.join("\n");
}

/** Pesan singkat berisi nomor referensi penawaran yang baru dibuat. */
export function buildQuoteReferenceMessage(input: {
  intro: string;
  reference: string;
  linkLabel: string;
  link: string;
  closing: string;
}): string {
  return [
    input.intro,
    "",
    `📄 ${input.reference}`,
    "",
    `🔗 ${input.linkLabel}`,
    input.link,
    "",
    input.closing,
  ].join("\n");
}
