"use client";

import { useState } from "react";
import type { Rab } from "@/lib/rab";
import { RAB_GROUPS } from "@/lib/rab";
import { formatIDR } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { siteConfig } from "@/lib/site-config";

type PdfMeta = {
  reference?: string;
  vehicleLabel?: string;
  customerName?: string;
  dateLabel?: string;
  dateValue?: string;
};

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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
      const [{ jsPDF }, { default: autoTable }, logoDataUrl] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        loadLogoDataUrl(),
      ]);
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();

      // --- Premium Header ---
      // Top accent bar
      doc.setFillColor(6, 95, 70);
      doc.rect(0, 0, pageW, 4, "F");

      // Logo
      let headerY = 12;
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, "JPEG", 14, 8, 16, 16);
        } catch { /* skip */ }
      }

      // Company name + tagline
      doc.setFontSize(16);
      doc.setTextColor(6, 95, 70);
      doc.text(siteConfig.name, logoDataUrl ? 34 : 14, headerY + 4);
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.text(siteConfig.taglineId, logoDataUrl ? 34 : 14, headerY + 10);

      // Address line
      doc.setFontSize(7);
      doc.setTextColor(150, 160, 170);
      doc.text(
        `${siteConfig.addressId}  |  ${siteConfig.email}  |  ${siteConfig.phone}`,
        14,
        headerY + 15
      );

      // Separator line
      const sepY = headerY + 20;
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.3);
      doc.line(14, sepY, pageW - 14, sepY);

      // Document title
      doc.setFontSize(12);
      doc.setTextColor(30, 40, 50);
      doc.text(t.pdf.title, 14, sepY + 8);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(t.pdf.subtitle, 14, sepY + 13);

      // Meta info block
      let metaY = sepY + 20;
      if (meta.reference || meta.vehicleLabel || meta.dateValue) {
        doc.setFontSize(8);
        const col1X = 14;
        const col2X = pageW / 2 + 10;
        let leftY = metaY;
        let rightY = metaY;

        if (meta.reference) {
          doc.setTextColor(100, 116, 139);
          doc.text(`${t.pdf.quoteRef}:`, col1X, leftY);
          doc.setTextColor(30, 40, 50);
          doc.text(meta.reference, col1X + 30, leftY);
          leftY += 5;
        }
        if (meta.vehicleLabel) {
          doc.setTextColor(100, 116, 139);
          doc.text(`${t.pdf.vehicle}:`, col1X, leftY);
          doc.setTextColor(30, 40, 50);
          doc.text(meta.vehicleLabel, col1X + 25, leftY);
          leftY += 5;
        }
        if (meta.customerName) {
          doc.setTextColor(100, 116, 139);
          doc.text(`${t.pdf.customer}:`, col2X, rightY);
          doc.setTextColor(30, 40, 50);
          doc.text(meta.customerName, col2X + 25, rightY);
          rightY += 5;
        }
        if (meta.dateValue) {
          doc.setTextColor(100, 116, 139);
          doc.text(`${meta.dateLabel ?? t.pdf.date}:`, col2X, rightY);
          doc.setTextColor(30, 40, 50);
          doc.text(meta.dateValue, col2X + 20, rightY);
          rightY += 5;
        }
        metaY = Math.max(leftY, rightY) + 4;
      }

      // --- Table ---
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

      // Summary rows
      body.push(["", "", "", "", t.rab.subtotalLabel, formatIDR(rab.totals.subtotal)]);
      body.push(["", "", "", "", `${t.rab.marginLabel} (${rab.totals.marginPct}%)`, formatIDR(rab.totals.margin)]);
      body.push(["", "", "", "", `${t.rab.ppnLabel} (${rab.totals.ppnPct}%)`, formatIDR(rab.totals.ppn)]);

      autoTable(doc, {
        startY: metaY,
        head,
        body,
        theme: "grid",
        headStyles: {
          fillColor: [6, 95, 70],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          cellPadding: 3,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 30, halign: "right" },
          5: { cellWidth: 32, halign: "right" },
        },
        didParseCell: (data) => {
          const text = String(data.cell.raw ?? "");
          const row = data.row.raw as (string | number)[];
          // Group header rows (group name in col 0, rest empty)
          if (data.section === "body" && text && !text.match(/^\d+$/) && text.length > 2 && String(row[1] ?? "") === "" && String(row[2] ?? "") === "") {
            data.cell.styles.fillColor = [240, 253, 244];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [6, 95, 70];
            data.cell.styles.fontSize = 9;
          }
          // Summary rows
          if (data.section === "body" && (text === t.rab.subtotalLabel || text.startsWith(t.rab.marginLabel) || text.startsWith(t.rab.ppnLabel))) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [71, 85, 105];
          }
        },
        didDrawPage: (data) => {
          // Footer on each page
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(7);
          doc.setTextColor(180, 190, 200);
          doc.text(
            `${siteConfig.name}  |  ${siteConfig.email}  |  ${siteConfig.phone}`,
            14,
            pageH - 10
          );
          doc.text(
            `${t.pdf.page} ${data.pageNumber} ${t.pdf.of} ${doc.getNumberOfPages()}`,
            pageW - 14,
            pageH - 10,
            { align: "right" }
          );
          // Bottom accent bar
          doc.setFillColor(6, 95, 70);
          doc.rect(0, pageH - 4, pageW, 4, "F");
        },
        foot: [
          [
            { content: "", colSpan: 4, styles: { fillColor: [255, 255, 255] } },
            { content: t.rab.totalLabel, styles: { halign: "right", fontSize: 10, fontStyle: "bold", fillColor: [209, 250, 229], textColor: [6, 95, 70] } },
            { content: formatIDR(rab.totals.total), styles: { halign: "right", fontSize: 10, fontStyle: "bold", fillColor: [209, 250, 229], textColor: [6, 95, 70] } },
          ],
        ],
        footStyles: {
          textColor: [6, 95, 70],
          lineColor: [6, 95, 70],
          lineWidth: 0.5,
        },
        margin: { left: 14, right: 14 },
      });

      // --- Final total block (below table) ---
      const finalY = (doc as any).lastAutoTable?.finalY ?? metaY + 20;
      if (finalY < doc.internal.pageSize.getHeight() - 30) {
        doc.setFillColor(6, 95, 70);
        doc.roundedRect(14, finalY + 6, pageW - 28, 14, 2, 2, "F");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(t.rab.totalLabel, 20, finalY + 14.5);
        doc.setFontSize(13);
        doc.text(formatIDR(rab.totals.total), pageW - 20, finalY + 14.5, { align: "right" });
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
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50"
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
