import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCookieLang, getDict } from "@/lib/i18n";
import { formatDateTime, formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const lang = getCookieLang(cookieStore.toString());
  const t = getDict(lang);

  const [newQuotes, totalQuotes, components, galleryCount, recent] = await Promise.all([
    prisma.quote.count({ where: { status: "BARU" } }),
    prisma.quote.count(),
    prisma.component.count({ where: { isActive: true } }),
    prisma.galleryItem.count(),
    prisma.quote.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const stats = [
    { label: t.admin.statNewQuotes, value: newQuotes, icon: "🆕", cls: "text-blue-600" },
    { label: t.admin.statTotalQuotes, value: totalQuotes, icon: "📨", cls: "text-emerald-600" },
    { label: t.admin.statComponents, value: components, icon: "🧩", cls: "text-amber-600" },
    { label: t.admin.statGallery, value: galleryCount, icon: "🖼️", cls: "text-violet-600" },
  ];

  const statusLabel: Record<string, string> = {
    BARU: t.admin.quoteStatusBaru,
    DITINJAU: t.admin.quoteStatusDitinjau,
    DISETUJUI: t.admin.quoteStatusDisetujui,
    DITOLAK: t.admin.quoteStatusDitolak,
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">
        {t.admin.dashboardTitle}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{t.admin.welcome}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-3xl font-extrabold ${s.cls}`}>{s.value}</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">{t.admin.recentQuotes}</h2>
          <Link href="/admin/penawaran" className="text-sm font-semibold text-emerald-600 hover:underline">
            {t.admin.viewAll} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">{t.admin.noQuotes}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">{t.pdf.quoteRef}</th>
                  <th className="px-5 py-3">{t.quote.name}</th>
                  <th className="px-5 py-3">{t.pdf.vehicle}</th>
                  <th className="px-5 py-3 text-right">{t.rab.totalLabel}</th>
                  <th className="px-5 py-3">{t.admin.submittedAt}</th>
                  <th className="px-5 py-3">{t.admin.statusUpdate}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((q) => (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-800">
                      <Link href={`/admin/penawaran/${q.id}`} className="hover:underline">
                        {q.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{q.name}</td>
                    <td className="px-5 py-3 text-slate-600">{q.vehicleType}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">
                      {formatIDR(((q.totals as { total?: number })?.total) ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(q.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {statusLabel[q.status] ?? q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
