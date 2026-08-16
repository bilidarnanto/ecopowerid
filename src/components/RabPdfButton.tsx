"use client";

import { useState } from "react";
import type { Rab } from "@/lib/rab";
import { RAB_GROUPS } from "@/lib/rab";
import { formatIDR } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

type PdfMeta = {
  reference?: string;
  vehicleLabel?: string;
  customerName?: string;
  dateLabel?: string;
  dateValue?: string;
};

export function RabPdfButton({
  rab,
  meta = {},
  label,
}: {
  rab: Rab;
  meta?: PdfMeta;
  label?: string;
}) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();

      // Header
      doc.setFontSize(15);
      doc.setTextColor(6, 95, 70);
      doc.text("EcoPower ID", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(t.pdf.title, 14, 23);
      doc.text(t.pdf.subtitle, 14, 28);

      if (meta.reference || meta.vehicleLabel || meta.dateValue) {
        doc.setFontSize(9);
        let y = 34;
        if (meta.reference) {
          doc.text(`${t.pdf.quoteRef}: ${meta.reference}`, 14, y);
          y += 5;
        }
        if (meta.vehicleLabel) {
          doc.text(`${t.pdf.vehicle}: ${meta.vehicleLabel}`, 14, y);
          y += 5;
        }
        if (meta.customerName) {
          doc.text(`${t.pdf.customer}: ${meta.customerName}`, 14, y);
          y += 5;
        }
        if (meta.dateValue) {
          doc.text(`${meta.dateLabel ?? t.pdf.date}: ${meta.dateValue}`, 14, y);
        }
      }

      const head = [
        [
          t.rab.no,
          t.rab.item,
          t.rab.spec,
          t.rab.qty,
          t.rab.price,
          t.rab.subtotal,
        ],
      ];
      const body: (string | number)[][] = [];

      for (const g of RAB_GROUPS) {
        const lines = rab.lines.filter((l) => l.group === g);
        if (lines.length === 0) continue;
        const groupLabel =
          g === "STRUKTUR"
            ? t.rab.groupStruktur
            : g === "INTERIOR"
              ? t.rab.groupInterior
              : g === "PERALATAN"
                ? t.rab.groupPeralatan
                : g === "PLTS"
                  ? t.rab.groupPlts
                  : g === "LISTRIK"
                    ? t.rab.groupListrik
                    : g === "PLUMBING"
                      ? t.rab.groupPlumbing
                      : t.rab.groupJasa;
        body.push([groupLabel, "", "", "", "", ""]);
        lines.forEach((l, i) => {
          body.push([
            String(i + 1),
            lang === "id" ? l.nameId : l.nameEn,
            l.spec,
            `${l.qty.toLocaleString("id-ID")} ${l.unit}`,
            formatIDR(l.price),
            formatIDR(l.subtotal),
          ]);
        });
      }

      body.push(["", "", "", "", t.rab.subtotalLabel, formatIDR(rab.totals.subtotal)]);
      body.push(["", "", "", "", `${t.rab.marginLabel} (${rab.totals.marginPct}%)`, formatIDR(rab.totals.margin)]);
      body.push(["", "", "", "", `${t.rab.ppnLabel} (${rab.totals.ppnPct}%)`, formatIDR(rab.totals.ppn)]);

      autoTable(doc, {
        startY: meta.reference || meta.vehicleLabel ? 40 : 32,
        head,
        body,
        theme: "grid",
        headStyles: { fillColor: [6, 95, 70], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 8 },
          3: { cellWidth: 18, halign: "right" },
          4: { cellWidth: 28, halign: "right" },
          5: { cellWidth: 30, halign: "right" },
        },
        didParseCell: (data) => {
          const text = String(data.cell.raw ?? "");
          if (data.section === "body" && (text === t.rab.subtotalLabel || text.startsWith(t.rab.marginLabel) || text.startsWith(t.rab.ppnLabel))) {
            data.cell.styles.fontStyle = "bold";
          }
        },
        foot: [
          [
            { content: t.rab.totalLabel, colSpan: 5, styles: { halign: "right", fontSize: 10, fontStyle: "bold", fillColor: [209, 250, 229] } },
            { content: formatIDR(rab.totals.total), styles: { fontSize: 10, fontStyle: "bold", fillColor: [209, 250, 229] } },
          ],
        ],
        footStyles: { textColor: [6, 95, 70] },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${t.pdf.page} ${i} ${t.pdf.of} ${pageCount}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
        doc.text(t.pdf.generatedBy, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
      }

      const filename = `RAB-${meta.reference ?? "estimasi"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error("Gagal membuat PDF:", e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <span>📄</span>
      )}
      {label ?? t.configurator.downloadPdf}
    </button>
  );
}
