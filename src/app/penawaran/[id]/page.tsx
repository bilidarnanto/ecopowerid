import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCookieLang, getDict } from "@/lib/i18n";
import { RabTable } from "@/components/RabTable";
import { RabPdfButton } from "@/components/RabPdfButton";
import { formatDateTime, formatIDR } from "@/lib/format";
import type { Rab } from "@/lib/rab";
import type { VehicleType } from "@/lib/configurator-data";
import { VEHICLE_CONFIGS } from "@/lib/configurator-data";

export const dynamic = "force-dynamic";

export default async function QuoteViewPage({
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
  const config = quote.config as Record<string, unknown> | null;
  const vehicle = VEHICLE_CONFIGS.find((v) => v.type === quote.vehicleType as VehicleType);
  const configAppliances = (config?.appliances ?? {}) as Record<
    string,
    { qty: number; hours: number }
  >;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t.configurator.rabTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t.pdf.quoteRef}:{" "}
            <b className="text-slate-800">{quote.reference}</b>
            {" · "}
            {t.pdf.date}: <b className="text-slate-800">{formatDateTime(quote.createdAt)}</b>
            {" · "}
            {t.pdf.vehicle}:{" "}
            <b className="text-slate-800">
              {vehicle ? (lang === "id" ? vehicle.labelId : vehicle.labelEn) : quote.vehicleType}
            </b>
          </p>
        </div>
        <div className="no-print">
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.pdf.customer}</div>
          <div className="mt-1 font-bold text-slate-900">{quote.name}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.quote.email}</div>
          <div className="mt-1 font-semibold text-slate-800">{quote.email}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.quote.phone}</div>
          <div className="mt-1 font-semibold text-slate-800">{quote.phone || "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
          <div className="mt-1 font-bold text-slate-900">
            <StatusBadge status={quote.status} t={t} />
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.quote.notes}</div>
          <p className="mt-1 text-sm text-slate-700">{quote.notes}</p>
        </div>
      )}

      {Object.keys(configAppliances).length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {t.configurator.appliances}
          </div>
          <p className="mt-1 text-sm text-slate-700">
            {Object.entries(configAppliances)
              .map(
                ([code, sel]) =>
                  `${code} ×${sel.qty} (${sel.hours} ${t.configurator.hoursPerDay})`
              )
              .join(", ")}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <RabTable rab={rab} />
      </div>

      <div className="mt-6 rounded-2xl bg-slate-900 px-6 py-5 text-right">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {t.rab.totalLabel}
        </div>
        <div className="text-3xl font-extrabold text-emerald-400">
          {formatIDR(rab.totals.total)}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof getDict> }) {
  const map: Record<string, { label: string; cls: string }> = {
    BARU: { label: t.admin.quoteStatusBaru, cls: "bg-blue-100 text-blue-700" },
    DITINJAU: { label: t.admin.quoteStatusDitinjau, cls: "bg-amber-100 text-amber-700" },
    DISETUJUI: { label: t.admin.quoteStatusDisetujui, cls: "bg-emerald-100 text-emerald-700" },
    DITOLAK: { label: t.admin.quoteStatusDitolak, cls: "bg-red-100 text-red-700" },
  };
  const m = map[status] ?? map.BARU;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}
