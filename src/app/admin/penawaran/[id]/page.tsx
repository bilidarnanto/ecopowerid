import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCookieLang, getDict } from "@/lib/i18n";
import { RabTable } from "@/components/RabTable";
import { RabPdfButton } from "@/components/RabPdfButton";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { formatDateTime, formatIDR } from "@/lib/format";
import type { Rab } from "@/lib/rab";
import type { VehicleType } from "@/lib/configurator-data";
import { VEHICLE_CONFIGS } from "@/lib/configurator-data";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const lang = getCookieLang(cookieStore.toString());
  const t = getDict(lang);

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) notFound();

  const storedRab = quote.rab as unknown as Partial<Rab> | null;
  const totals = (storedRab?.totals ?? (quote.totals as Rab["totals"] | null)) as Rab["totals"];
  const rab: Rab = { lines: storedRab?.lines ?? [], totals };
  const vehicle = VEHICLE_CONFIGS.find((v) => v.type === quote.vehicleType as VehicleType);

  const statusLabel: Record<string, string> = {
    BARU: t.admin.quoteStatusBaru,
    DITINJAU: t.admin.quoteStatusDitinjau,
    DISETUJUI: t.admin.quoteStatusDisetujui,
    DITOLAK: t.admin.quoteStatusDitolak,
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {t.admin.quoteDetail} — {quote.reference}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.admin.submittedAt}: {formatDateTime(quote.createdAt)} ·{" "}
            {vehicle ? (lang === "id" ? vehicle.labelId : vehicle.labelEn) : quote.vehicleType}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/penawaran/${quote.id}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            👁 Lihat Publik
          </Link>
          <RabPdfButton
            rab={rab}
            meta={{
              reference: quote.reference,
              vehicleLabel: vehicle ? (lang === "id" ? vehicle.labelId : vehicle.labelEn) : undefined,
              customerName: quote.name,
              dateLabel: t.pdf.date,
              dateValue: formatDateTime(quote.createdAt),
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.pdf.customer}</div>
          <div className="mt-1 font-bold text-slate-900">{quote.name}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.quote.email}</div>
          <div className="mt-1 break-all font-semibold text-slate-800">{quote.email}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.quote.phone}</div>
          <div className="mt-1 font-semibold text-slate-800">{quote.phone || "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.rab.totalLabel}</div>
          <div className="mt-1 font-extrabold text-emerald-700">{formatIDR(rab.totals.total)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.admin.statusUpdate}</div>
          <div className="mt-1">
            <StatusUpdater id={quote.id} current={quote.status} labels={statusLabel} />
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.quote.notes}</div>
          <p className="mt-1 text-sm text-slate-700">{quote.notes}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <RabTable rab={rab} />
      </div>
    </div>
  );
}
