"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

type GalleryItem = {
  id: string;
  titleId: string;
  titleEn: string;
  category: string;
  imagePath: string;
  descriptionId: string | null;
  descriptionEn: string | null;
  featured: boolean;
};

const CATEGORIES = ["all", "campervan", "motorhome", "foodtruck", "plts"] as const;

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");

  const filtered = useMemo(
    () => (cat === "all" ? items : items.filter((i) => i.category === cat)),
    [items, cat]
  );

  const catLabel = (c: (typeof CATEGORIES)[number]) =>
    c === "all" ? t.gallery.all : t.gallery[c];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {t.gallery.title}
      </h1>
      <p className="mt-2 text-slate-600">{t.gallery.subtitle}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              cat === c
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            {catLabel(c)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          {t.common.loading === "Memuat..." ? "Belum ada foto di kategori ini." : "No photos in this category yet."}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <figure
              key={item.id}
              className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                item.featured ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imagePath}
                  alt={lang === "id" ? item.titleId : item.titleEn}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <figcaption className="p-4">
                {item.featured && (
                  <span className="mb-1.5 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    ★ {t.admin.galleryFeatured}
                  </span>
                )}
                <h3 className="font-bold text-slate-900">
                  {lang === "id" ? item.titleId : item.titleEn}
                </h3>
                {item.descriptionId && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {lang === "id" ? item.descriptionId : item.descriptionEn}
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
