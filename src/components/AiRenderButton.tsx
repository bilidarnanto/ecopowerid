"use client";

import { useState, useCallback } from "react";
import {
  EXTERIOR_COLOR_MAP,
  INTERIOR_COLOR_MAP,
  DEFAULT_EXTERIOR_COLOR,
  DEFAULT_INTERIOR_COLOR,
  type VehicleType,
} from "@/lib/configurator-data";

type AiRenderButtonProps = {
  vehicleType: VehicleType | null;
  packageCode: string | null;
  layoutCode: string | null;
  materialCode: string | null;
  addonCodes: string[];
  includePlts: boolean;
  exteriorColor?: string | null;
  interiorColor?: string | null;
};

// Build a descriptive prompt from the configuration
function buildPrompt(props: AiRenderButtonProps): string {
  const type = props.vehicleType ?? "campervan";
  const exteriorName =
    EXTERIOR_COLOR_MAP.get(props.exteriorColor ?? DEFAULT_EXTERIOR_COLOR)?.labelId ?? "white";
  const interiorName =
    INTERIOR_COLOR_MAP.get(props.interiorColor ?? DEFAULT_INTERIOR_COLOR)?.labelId ?? "teal";

  const pkg = props.packageCode ?? "";
  const isPremium = pkg.includes("PRM");
  const isDeluxe = pkg.includes("DLX");

  const vehicleLabel =
    type === "campervan"
      ? "custom campervan"
      : type === "motorhome"
        ? "luxury motorhome"
        : type === "foodtruck"
          ? "food truck"
          : "solar panel installation";

  const features: string[] = [];
  if (props.includePlts) features.push("roof-mounted solar panels");
  if (isPremium) features.push("premium package with roof rack, air conditioning");
  if (isDeluxe) features.push("deluxe package with roof rack");
  for (const code of props.addonCodes) {
    if (code.includes("AC")) features.push("roof air conditioning unit");
    if (code.includes("AWNING")) features.push("retractable side awning");
    if (code.includes("SIGN")) features.push("LED signage board");
    if (code.includes("HOOD")) features.push("exhaust ventilation hood");
    if (code.includes("ROOF")) features.push("heavy-duty roof rack");
  }

  const featureStr = features.length > 0 ? ` featuring ${features.join(", ")}` : "";

  return (
    `Photorealistic professional photograph of a ${exteriorName} ${vehicleLabel}${featureStr}, ` +
    `${interiorName} interior accents visible through windows, ` +
    `parked in a lush tropical Indonesian setting with palm trees, ` +
    `golden hour warm lighting, automotive photography, 8K resolution, ` +
    `sharp details, professional studio-quality render, shallow depth of field`
  );
}

export function AirRenderButton(props: AiRenderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const prompt = buildPrompt(props);
      const res = await fetch("/api/ai-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
      setShowModal(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal generate render";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [props]);

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition-all hover:border-purple-400 hover:bg-purple-100 disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
            Generating AI Render...
          </>
        ) : (
          <>✨ Generate Photorealistic Render</>
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {/* Render Modal */}
      {showModal && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-bold text-slate-900">✨ AI Photorealistic Render</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Image */}
            <div className="relative bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="AI Rendered vehicle"
                className="w-full object-contain"
                style={{ maxHeight: "60vh" }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <p className="text-[11px] text-slate-400">
                Generated by AI · Hasil dapat berbeda dengan produk aktual
              </p>
              <div className="flex gap-2">
                <a
                  href={imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  ⬇ Download
                </a>
                <button
                  type="button"
                  onClick={generate}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                >
                  🔄 Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
