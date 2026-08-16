"use client";

import { useCallback, useEffect, useState } from "react";
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
  createdAt: string;
};

const CATEGORIES = ["campervan", "motorhome", "foodtruck", "plts"];

export default function AdminGaleriPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form upload
  const [file, setFile] = useState<File | null>(null);
  const [titleId, setTitleId] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState("campervan");
  const [featured, setFeatured] = useState(false);
  const [descId, setDescId] = useState("");
  const [descEn, setDescEn] = useState("");
  const [uploading, setUploading] = useState(false);

  // Edit
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/gallery");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setItems(data.items);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function upload() {
    setError(null);
    setMessage(null);
    if (!file) {
      setError(t.admin.galleryUpload + "!");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("titleId", titleId.trim() || "Tanpa Judul");
    form.append("titleEn", titleEn.trim() || titleId.trim() || "Untitled");
    form.append("category", category);
    form.append("featured", String(featured));
    form.append("descriptionId", descId.trim());
    form.append("descriptionEn", descEn.trim());

    setUploading(true);
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal upload");
      setFile(null);
      setTitleId("");
      setTitleEn("");
      setCategory("campervan");
      setFeatured(false);
      setDescId("");
      setDescEn("");
      setMessage(`✅ ${data.item.titleId}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/gallery/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId: editing.titleId,
          titleEn: editing.titleEn,
          category: editing.category,
          featured: editing.featured,
          descriptionId: editing.descriptionId || null,
          descriptionEn: editing.descriptionEn || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function remove(item: GalleryItem) {
    if (!window.confirm(t.common.confirmDelete)) return;
    await fetch(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">🖼️ {t.admin.galleryTitle}</h1>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Upload */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">+ {t.admin.galleryAdd}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">{t.admin.galleryUpload} *</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
            />
            {file && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt="" className="h-14 w-20 rounded-lg object-cover" />
                <span className="text-xs text-slate-500">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">{t.admin.galleryTitleId} *</span>
              <input
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">{t.admin.galleryTitleEn} *</span>
              <input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">{t.admin.galleryCategory}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span className="text-sm font-semibold text-slate-700">{t.admin.galleryFeatured}</span>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Deskripsi (ID)</span>
              <input
                value={descId}
                onChange={(e) => setDescId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Deskripsi (EN)</span>
              <input
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
          </div>
        </div>
        <button
          onClick={upload}
          disabled={uploading}
          className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {uploading ? `${t.common.loading}...` : `↑ ${t.admin.galleryUpload}`}
        </button>
      </div>

      {/* Daftar */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items === null ? (
          <div className="col-span-full text-center text-slate-500">{t.common.loading}</div>
        ) : items.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {t.admin.galleryNoItems}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imagePath} alt={item.titleId} className="aspect-[4/3] w-full object-cover" />
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-slate-800">{item.titleId}</span>
                  {item.featured && <span className="text-xs">⭐</span>}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {item.category} · {item.titleEn}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setEditing({ ...item })}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    ✏️ {t.common.edit}
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    🗑️ {t.common.delete}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">✏️ {t.common.edit}</h3>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">{t.admin.galleryTitleId}</span>
                <input
                  value={editing.titleId}
                  onChange={(e) => setEditing({ ...editing, titleId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">{t.admin.galleryTitleEn}</span>
                <input
                  value={editing.titleEn}
                  onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">{t.admin.galleryCategory}</span>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Deskripsi (ID)</span>
                <input
                  value={editing.descriptionId ?? ""}
                  onChange={(e) => setEditing({ ...editing, descriptionId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Deskripsi (EN)</span>
                <input
                  value={editing.descriptionEn ?? ""}
                  onChange={(e) => setEditing({ ...editing, descriptionEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="text-sm font-semibold text-slate-700">{t.admin.galleryFeatured}</span>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                {t.common.save}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
