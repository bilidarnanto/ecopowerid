"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  DEFAULT_EXTERIOR_COLOR,
  DEFAULT_INTERIOR_COLOR,
  EXTERIOR_COLOR_MAP,
  INTERIOR_COLOR_MAP,
  type VehicleType,
} from "@/lib/configurator-data";
import { useI18n } from "@/lib/i18n/provider";

// ------------------------------------------------------------------
// Utilitas warna: turunkan palet terang/gelap dari satu warna dasar
// ------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Campur hex dengan hitam (amt negatif) atau putih (amt positif) */
function tint(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amt >= 0 ? 255 : 0;
  const f = Math.abs(amt);
  const mix = (c: number) => Math.round(c + (t - c) * f);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// ------------------------------------------------------------------
// Proyeksi isometrik dengan kontrol rotasi
// ------------------------------------------------------------------

const cos30 = Math.cos(Math.PI / 6);
const sin30 = 0.5;
const S = 30; // piksel per satuan

type V3 = [number, number, number];
type V2 = [number, number];

// Sudut rotasi Y-axis (derajat) — dikontrol user
function P(
  x: number,
  y: number,
  z: number,
  ox: number,
  oy: number,
  rotY: number = 0
): V2 {
  const rad = (rotY * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  // Rotasi Y-axis
  const rx = x * cosR - z * sinR;
  const rz = x * sinR + z * cosR;
  return [
    ox + (rx - rz) * cos30 * S,
    oy + (rx + rz) * sin30 * S - y * S,
  ];
}

function pts(corners: V3[], ox: number, oy: number, rotY: number = 0): string {
  return corners
    .map(([x, y, z]) =>
      P(x, y, z, ox, oy, rotY)
        .map((n) => +n.toFixed(1))
        .join(",")
    )
    .join(" ");
}

// ------------------------------------------------------------------
// Sketchy line effect — garis tangan
// ------------------------------------------------------------------

function sketchyLine(
  x1: number, y1: number,
  x2: number, y2: number,
  seed: number = 0
): string {
  // Buat beberapa garis tumpang tindih dengan sedikit randomness
  const lines: string[] = [];
  const count = 3; // jumlah overlay
  for (let i = 0; i < count; i++) {
    const jitter = 0.6;
    const dx = ((seed + i) * 13.37) % jitter - jitter / 2;
    const dy = ((seed + i) * 7.91) % jitter - jitter / 2;
    const dx2 = ((seed + i) * 19.23) % jitter - jitter / 2;
    const dy2 = ((seed + i) * 3.17) % jitter - jitter / 2;
    lines.push(`M ${(x1 + dx).toFixed(1)},${(y1 + dy).toFixed(1)} L ${(x2 + dx2).toFixed(1)},${(y2 + dy2).toFixed(1)}`);
  }
  return lines.join(" ");
}

// ------------------------------------------------------------------
// Dimensi dasar kendaraan (satuan relatif)
// ------------------------------------------------------------------

type Dims = { L: number; W: number; H: number; r: number };

const DIMS: Record<Exclude<VehicleType, "plts">, Dims> = {
  campervan: { L: 5.2, W: 2.0, H: 2.15, r: 0.42 },
  motorhome: { L: 7.0, W: 2.4, H: 2.9, r: 0.5 },
  foodtruck: { L: 4.6, W: 2.0, H: 2.35, r: 0.4 },
};

const COLORS = {
  outline: "#334155",
  outlineThin: "#64748b",
  glass: "rgba(147, 197, 253, 0.45)",
  glassEdge: "#7a93ad",
  wheel: "#1e293b",
  wheelHub: "#7d8ca0",
  roofAccent: "#c7d2de",
  rack: "#64748b",
  ac: "#9fb0c0",
  acDark: "#8294a5",
  solar: "#1e3a8a",
  solarLine: "#3b5bdb",
  sign: "#f59e0b",
  signGlow: "#fde68a",
  light: "#fde68a",
  grille: "#475569",
  trim: "#475569",
  grid: "#e2e8f0",
  gridMajor: "#cbd5e1",
  dimLine: "#94a3b8",
  dimText: "#64748b",
  sketchy: "#1e293b",
};

/** Palet body dari warna eksterior terpilih */
function bodyPalette(exteriorCode: string | null) {
  const base =
    EXTERIOR_COLOR_MAP.get(exteriorCode ?? "")?.swatch ??
    EXTERIOR_COLOR_MAP.get(DEFAULT_EXTERIOR_COLOR)!.swatch;
  return {
    side: tint(base, -0.12),
    front: tint(base, -0.04),
    roof: tint(base, 0.08),
    sideDark: tint(base, -0.22),
    frontDark: tint(base, -0.14),
  };
}

/** Warna aksen interior (strip & detail) */
function interiorAccent(interiorCode: string | null) {
  return (
    INTERIOR_COLOR_MAP.get(interiorCode ?? "")?.swatch ??
    INTERIOR_COLOR_MAP.get(DEFAULT_INTERIOR_COLOR)!.swatch
  );
}

const ACCENT: Record<string, string> = {
  "MAT-HPL": "#0d9488",
  "MAT-PLY": "#b45309",
  "MAT-ALU": "#64748b",
};

type SketchProps = {
  vehicleType: VehicleType | null;
  packageCode: string | null;
  layoutCode: string | null;
  materialCode: string | null;
  addonCodes: string[];
  includePlts: boolean;
  exteriorColor?: string | null;
  interiorColor?: string | null;
};

export function VehicleSketch({
  vehicleType,
  packageCode,
  layoutCode,
  materialCode,
  addonCodes,
  includePlts,
  exteriorColor,
  interiorColor,
}: SketchProps) {
  const { t } = useI18n();
  const [rotation, setRotation] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startRot: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addonKey = addonCodes.join("|");

  const scene = useMemo(() => {
    if (!vehicleType || vehicleType === "plts") return null;
    return buildScene(vehicleType, {
      packageCode,
      layoutCode,
      materialCode,
      addons: addonKey,
      includePlts,
      exteriorColor,
      interiorColor,
      rotY: rotation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, packageCode, layoutCode, materialCode, addonKey, includePlts, exteriorColor, interiorColor, rotation]);

  // Mouse drag untuk rotasi
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startRot: rotation };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [rotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const newRot = dragRef.current.startRot + dx * 0.5;
    setRotation(Math.max(-60, Math.min(120, newRot)));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  if (!scene) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-400">
        {vehicleType === "plts" ? <PltsSketch /> : t.configurator.previewEmpty}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Ground grid — garis grid seperti SketchUp */}
      <svg
        viewBox={scene.viewBox}
        role="img"
        aria-label={t.configurator.preview}
        className="h-auto w-full"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <filter id="sketchy">
            <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" />
          </filter>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width={scene.viewBox.split(" ")[2]} height={scene.viewBox.split(" ")[3]} fill="url(#skyGrad)" />

        {/* Ground grid */}
        {scene.groundGrid}

        {/* Dimension annotations */}
        {scene.dimensions}

        {/* Vehicle elements */}
        {scene.elements}

        {/* Sketchy outline overlay */}
        {scene.sketchyLines}
      </svg>

      {/* Rotation controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setRotation((r) => Math.max(-60, r - 15)); }}
          className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
          aria-label="Putar kiri"
        >
          ↶
        </button>
        <span className="min-w-[3ch] text-center text-[10px] font-semibold text-slate-500">
          {Math.round(rotation)}°
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setRotation((r) => Math.min(120, r + 15)); }}
          className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
          aria-label="Putar kanan"
        >
          ↷
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setRotation(30); }}
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] text-slate-400 hover:bg-slate-100"
          aria-label="Reset rotasi"
        >
          ⟲
        </button>
      </div>

      {/* Drag hint */}
      {!isDragging && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-slate-900/60 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
          ↔ Geser untuk memutar
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Pembangun scene
// ------------------------------------------------------------------

type SceneInput = {
  packageCode: string | null;
  layoutCode: string | null;
  materialCode: string | null;
  addons: string;
  includePlts: boolean;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  rotY: number;
};

function buildScene(type: Exclude<VehicleType, "plts">, input: SceneInput) {
  const { L, W, H, r } = DIMS[type];
  const addons = new Set(input.addons.split("|").filter(Boolean));
  const pkg = input.packageCode ?? "";
  const accent = ACCENT[input.materialCode ?? ""] ?? ACCENT["MAT-HPL"];
  const body = bodyPalette(input.exteriorColor ?? null);
  const interior = interiorAccent(input.interiorColor ?? null);
  const rotY = input.rotY;

  // Opsi visual dari paket & add-on
  const roofRack =
    addons.has("CV-AD-ROOF") ||
    pkg.includes("DLX") ||
    pkg.includes("PRM");
  const ac =
    addons.has("CV-AD-AC") ||
    addons.has("MH-AD-AC") ||
    addons.has("MH-AD-ROOFAC") ||
    pkg.includes("PRM");
  const awning = addons.has("CV-AD-AWNING") || addons.has("MH-AD-AWNING") || addons.has("FT-AD-AWNING");
  const solarVent = addons.has("CV-AD-SOLARV") || addons.has("MH-AD-SOLARV");
  const exhaust = addons.has("FT-AD-HOOD");
  const ledSign = addons.has("FT-AD-SIGN");
  const solarPanel = input.includePlts;

  // Jendela sisi sesuai tipe & layout
  const windows = getWindows(type, input.layoutCode);

  // Batas & offset agar gambar terpusat
  const minX = -W * cos30 * S;
  const maxX = L * cos30 * S;
  const minY = -H * S;
  const maxY = (L + W) * sin30 * S;
  const pad = 50;
  const vbW = Math.ceil(maxX - minX + pad * 2);
  const vbH = Math.ceil(maxY - minY + pad * 2);
  const viewBox = [0, 0, vbW, vbH].join(" ");
  const ox = -minX + pad;
  const oy = -minY + pad;

  const el: React.ReactNode[] = [];
  const add = (node: React.ReactNode) => el.push(node);

  // Ground grid
  const gridElements: React.ReactNode[] = [];

  // Grid lines — seperti SketchUp ground plane
  const gridSize = 3;
  const gridStep = 1.0;
  for (let i = -gridSize; i <= gridSize; i += gridStep) {
    // Garis sejajar X (horizontal-ish)
    const [gx1, gy1] = P(i * gridStep, 0, -gridSize * gridStep, ox, oy, rotY);
    const [gx2, gy2] = P(i * gridStep, 0, gridSize * gridStep, ox, oy, rotY);
    const isMajor = i === 0;
    gridElements.push(
      <line
        key={`grid-x-${i}`}
        x1={gx1} y1={gy1} x2={gx2} y2={gy2}
        stroke={isMajor ? COLORS.gridMajor : COLORS.grid}
        strokeWidth={isMajor ? 1.5 : 0.6}
        opacity={isMajor ? 0.8 : 0.4}
      />
    );
    // Garis sejajar Z (vertical-ish)
    const [gz1, gz2y] = P(-gridSize * gridStep, 0, i * gridStep, ox, oy, rotY);
    const [gz2, gz2y2] = P(gridSize * gridStep, 0, i * gridStep, ox, oy, rotY);
    gridElements.push(
      <line
        key={`grid-z-${i}`}
        x1={gz1} y1={gz2y} x2={gz2} y2={gz2y2}
        stroke={isMajor ? COLORS.gridMajor : COLORS.grid}
        strokeWidth={isMajor ? 1.5 : 0.6}
        opacity={isMajor ? 0.8 : 0.4}
      />
    );
  }
  // Axis labels
  const [axX, axY] = P(gridSize * gridStep + 0.3, 0, 0, ox, oy, rotY);
  const [axZ, axZy] = P(0, 0, gridSize * gridStep + 0.3, ox, oy, rotY);
  gridElements.push(
    <text key="axis-x" x={axX} y={axY} fontSize="9" fill={COLORS.dimText} textAnchor="middle" fontWeight="600">X</text>
  );
  gridElements.push(
    <text key="axis-z" x={axZ} y={axZy} fontSize="9" fill={COLORS.dimText} textAnchor="middle" fontWeight="600">Z</text>
  );

  // Dimension annotations
  const dimElements: React.ReactNode[] = [];
  // Dimensi panjang (X-axis)
  const [d1x, d1y] = P(0, -0.3, W + 0.15, ox, oy, rotY);
  const [d2x, d2y] = P(L, -0.3, W + 0.15, ox, oy, rotY);
  dimElements.push(
    <g key="dim-length" opacity={0.7}>
      <line x1={d1x} y1={d1y} x2={d2x} y2={d2y} stroke={COLORS.dimLine} strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={d1x} y1={d1y - 4} x2={d1x} y2={d1y + 4} stroke={COLORS.dimLine} strokeWidth={0.8} />
      <line x1={d2x} y1={d2y - 4} x2={d2x} y2={d2y + 4} stroke={COLORS.dimLine} strokeWidth={0.8} />
      <text x={(d1x + d2x) / 2} y={Math.min(d1y, d2y) - 5} fontSize="8" fill={COLORS.dimText} textAnchor="middle" fontWeight="500">
        {L.toFixed(1)}m
      </text>
    </g>
  );
  // Dimensi tinggi (Y-axis)
  const [h1x, h1y] = P(L + 0.15, 0, W + 0.15, ox, oy, rotY);
  const [h2x, h2y] = P(L + 0.15, H, W + 0.15, ox, oy, rotY);
  dimElements.push(
    <g key="dim-height" opacity={0.7}>
      <line x1={h1x} y1={h1y} x2={h2x} y2={h2y} stroke={COLORS.dimLine} strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={h1x - 4} y1={h1y} x2={h1x + 4} y2={h1y} stroke={COLORS.dimLine} strokeWidth={0.8} />
      <line x1={h2x - 4} y1={h2y} x2={h2x + 4} y2={h2y} stroke={COLORS.dimLine} strokeWidth={0.8} />
      <text x={h1x + 8} y={(h1y + h2y) / 2 + 3} fontSize="8" fill={COLORS.dimText} textAnchor="start" fontWeight="500">
        {H.toFixed(2)}m
      </text>
    </g>
  );
  // Dimensi lebar (Z-axis)
  const [w1x, w1y] = P(L + 0.15, -0.3, 0, ox, oy, rotY);
  const [w2x, w2y] = P(L + 0.15, -0.3, W, ox, oy, rotY);
  dimElements.push(
    <g key="dim-width" opacity={0.7}>
      <line x1={w1x} y1={w1y} x2={w2x} y2={w2y} stroke={COLORS.dimLine} strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={w1x} y1={w1y - 4} x2={w1x} y2={w1y + 4} stroke={COLORS.dimLine} strokeWidth={0.8} />
      <line x1={w2x} y1={w2y - 4} x2={w2x} y2={w2y + 4} stroke={COLORS.dimLine} strokeWidth={0.8} />
      <text x={(w1x + w2x) / 2} y={Math.min(w1y, w2y) - 5} fontSize="8" fill={COLORS.dimText} textAnchor="middle" fontWeight="500">
        {W.toFixed(1)}m
      </text>
    </g>
  );

  // Sketchy outline lines — garis tangan
  const sketchyElements: React.ReactNode[] = [];

  // Titik pojok body
  const BL: V3 = [0, 0, 0];
  const BR: V3 = [0, 0, W];
  const FL: V3 = [L, 0, 0];
  const FR: V3 = [L, 0, W];
  const TBL: V3 = [0, H, 0];
  const TBR: V3 = [0, H, W];
  const TFL: V3 = [L, H, 0];
  const TFR: V3 = [L, H, W];

  // Helper untuk membuat sketchy path dari polygon corners
  const sketchyPolygon = (corners: V3[], seed: number, opacity: number = 0.15) => {
    const projected = corners.map(([x, y, z]) => P(x, y, z, ox, oy, rotY));
    let d = "";
    for (let i = 0; i < projected.length; i++) {
      const [x1, y1] = projected[i];
      const [x2, y2] = projected[(i + 1) % projected.length];
      d += sketchyLine(x1, y1, x2, y2, seed + i) + " ";
    }
    return (
      <path
        key={`sketchy-${seed}`}
        d={d}
        fill="none"
        stroke={COLORS.sketchy}
        strokeWidth={0.7}
        opacity={opacity}
        strokeLinecap="round"
      />
    );
  };

  // 1. Bayangan tanah
  const [scx, scy] = P(L / 2, 0, W / 2, ox, oy, rotY);
  add(
    <ellipse
      key="shadow"
      cx={scx}
      cy={scy}
      rx={(L * cos30 + W * sin30) * S * 0.52}
      ry={(L * sin30 + W * cos30) * S * 0.42}
      fill="rgba(15,23,42,0.08)"
    />
  );

  // 2. Sisi body (z = W) — menghadap kiri-atas
  add(
    <polygon
      key="side"
      points={pts([TFR, TBR, BR, FR], ox, oy, rotY)}
      fill={body.side}
      stroke={COLORS.outline}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );

  // 3. Depan body (x = L) — menghadap kanan-bawah
  add(
    <polygon
      key="front"
      points={pts([TFL, TFR, FR, FL], ox, oy, rotY)}
      fill={body.front}
      stroke={COLORS.outline}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );

  // 4. Atap (y = H)
  add(
    <polygon
      key="roof"
      points={pts([TFL, TFR, TBR, TBL], ox, oy, rotY)}
      fill={body.roof}
      stroke={COLORS.outline}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );

  // ------------------------------------------------------------------
  // Detail SISI (z = W)
  // ------------------------------------------------------------------

  // Strip interior (warna sesuai pilihan interior) + garis aksen material tipis
  add(
    <polygon
      key="stripe"
      points={pts(
        [
          [0.08 * L, 0.46 * H, W],
          [0.92 * L, 0.46 * H, W],
          [0.92 * L, 0.52 * H, W],
          [0.08 * L, 0.52 * H, W],
        ],
        ox, oy, rotY
      )}
      fill={interior}
      opacity={0.9}
    />
  );
  add(
    <polygon
      key="accent-line"
      points={pts(
        [
          [0.08 * L, 0.53 * H, W],
          [0.92 * L, 0.53 * H, W],
          [0.92 * L, 0.55 * H, W],
          [0.08 * L, 0.55 * H, W],
        ],
        ox, oy, rotY
      )}
      fill={accent}
      opacity={0.9}
    />
  );

  // Jendela sisi
  const winY1 = type === "foodtruck" ? 0.4 * H : 0.56 * H;
  const winY2 = type === "foodtruck" ? 0.66 * H : 0.82 * H;
  windows.forEach(([x1, x2], i) => {
    add(
      <polygon
        key={`win-${i}`}
        points={pts(
          [
            [x1 * L, winY1, W],
            [x2 * L, winY1, W],
            [x2 * L, winY2, W],
            [x1 * L, winY2, W],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.glass}
        stroke={COLORS.glassEdge}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    );
  });

  // Pintu samping (campervan) — garis vertikal putus-putus
  if (type === "campervan") {
    const [ax, ay] = P(0.74 * L, 0.06 * H, W, ox, oy, rotY);
    const [bx, by] = P(0.74 * L, 0.86 * H, W, ox, oy, rotY);
    add(
      <line
        key="door"
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        stroke={COLORS.outline}
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />
    );
  }

  // Awning (tergulung) + kaki penyangga
  if (awning) {
    add(
      <polygon
        key="awning"
        points={pts(
          [
            [0.22 * L, 0.84 * H, W + 0.02],
            [0.78 * L, 0.84 * H, W + 0.02],
            [0.78 * L, 0.91 * H, W + 0.02],
            [0.22 * L, 0.91 * H, W + 0.02],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.rack}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    const armL = P(0.28 * L, 0.84 * H, W, ox, oy, rotY);
    const armL2 = P(0.28 * L, 0.62 * H, W, ox, oy, rotY);
    const armR = P(0.72 * L, 0.84 * H, W, ox, oy, rotY);
    const armR2 = P(0.72 * L, 0.62 * H, W, ox, oy, rotY);
    add(
      <path
        key="awning-arms"
        d={`M ${armL.join(",")} L ${armL2.join(",")} M ${armR.join(",")} L ${armR2.join(",")}`}
        stroke={COLORS.trim}
        strokeWidth={1.2}
      />
    );
  }

  // ------------------------------------------------------------------
  // Detail DEPAN (x = L)
  // ------------------------------------------------------------------

  // Kaca depan
  add(
    <polygon
      key="windshield"
      points={pts(
        [
          [L, 0.52 * H, 0.14 * W],
          [L, 0.52 * H, 0.86 * W],
          [L, 0.82 * H, 0.74 * W],
          [L, 0.82 * H, 0.26 * W],
        ],
        ox, oy, rotY
      )}
      fill={COLORS.glass}
      stroke={COLORS.glassEdge}
      strokeWidth={1}
      strokeLinejoin="round"
    />
  );

  // Bumper bawah
  add(
    <polygon
      key="bumper"
      points={pts(
        [
          [L, 0, 0.08 * W],
          [L, 0, 0.92 * W],
          [L, 0.06 * H, 0.92 * W],
          [L, 0.06 * H, 0.08 * W],
        ],
        ox, oy, rotY
      )}
      fill={COLORS.grille}
    />
  );

  // Grille
  add(
    <polygon
      key="grille"
      points={pts(
        [
          [L, 0.08 * H, 0.34 * W],
          [L, 0.08 * H, 0.66 * W],
          [L, 0.18 * H, 0.66 * W],
          [L, 0.18 * H, 0.34 * W],
        ],
        ox, oy, rotY
      )}
      fill={COLORS.grille}
    />
  );

  // Lampu depan
  for (const [zx, key] of [
    [0.18 * W, "light-l"],
    [0.82 * W, "light-r"],
  ] as const) {
    const [cx, cy] = P(L, 0.13 * H, zx, ox, oy, rotY);
    add(
      <ellipse
        key={key}
        cx={cx}
        cy={cy}
        rx={0.09 * W * S}
        ry={0.05 * W * S}
        fill={COLORS.light}
        stroke={COLORS.trim}
        strokeWidth={0.8}
      />
    );
  }

  // LED signage (food truck)
  if (ledSign) {
    add(
      <polygon
        key="sign"
        points={pts(
          [
            [L, 0.28 * H, 0.18 * W],
            [L, 0.28 * H, 0.82 * W],
            [L, 0.42 * H, 0.82 * W],
            [L, 0.42 * H, 0.18 * W],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.sign}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    add(
      <polygon
        key="sign-inner"
        points={pts(
          [
            [L, 0.31 * H, 0.24 * W],
            [L, 0.31 * H, 0.76 * W],
            [L, 0.39 * H, 0.76 * W],
            [L, 0.39 * H, 0.24 * W],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.signGlow}
      />
    );
  }

  // ------------------------------------------------------------------
  // Detail ATAP (y = H)
  // ------------------------------------------------------------------

  // Panel surya
  if (solarPanel) {
    const p1: V3 = [0.14 * L, H + 0.02, 0.16 * W];
    const p2: V3 = [0.5 * L, H + 0.02, 0.16 * W];
    const p3: V3 = [0.5 * L, H + 0.02, 0.84 * W];
    const p4: V3 = [0.14 * L, H + 0.02, 0.84 * W];
    add(
      <polygon
        key="solar"
        points={pts([p1, p2, p3, p4], ox, oy, rotY)}
        fill={COLORS.solar}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    // garis sel
    for (const fx of [0.26, 0.38]) {
      const [ax, ay] = P(fx * L, H + 0.02, 0.16 * W, ox, oy, rotY);
      const [bx, by] = P(fx * L, H + 0.02, 0.84 * W, ox, oy, rotY);
      add(
        <line key={`solar-v-${fx}`} x1={ax} y1={ay} x2={bx} y2={by} stroke={COLORS.solarLine} strokeWidth={0.8} />
      );
    }
    const [gx1, gy1] = P(0.14 * L, H + 0.02, 0.5 * W, ox, oy, rotY);
    const [gx2, gy2] = P(0.5 * L, H + 0.02, 0.5 * W, ox, oy, rotY);
    add(
      <line key="solar-h" x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke={COLORS.solarLine} strokeWidth={0.8} />
    );
  }

  // Rel atap (roof rack)
  if (roofRack) {
    for (const [zx, key] of [
      [0.1 * W, "rack-1"],
      [0.9 * W, "rack-2"],
    ] as const) {
      add(
        <polygon
          key={key}
          points={pts(
            [
              [0.08 * L, H + 0.04, zx],
              [0.92 * L, H + 0.04, zx],
              [0.92 * L, H + 0.1, zx],
              [0.08 * L, H + 0.1, zx],
            ],
            ox, oy, rotY
          )}
          fill={COLORS.rack}
          stroke={COLORS.outline}
          strokeWidth={0.8}
        />
      );
    }
    for (const fx of [0.28, 0.5, 0.72]) {
      add(
        <polygon
          key={`rack-x-${fx}`}
          points={pts(
            [
              [fx * L, H + 0.04, 0.1 * W],
              [fx * L, H + 0.04, 0.9 * W],
              [fx * L, H + 0.1, 0.9 * W],
              [fx * L, H + 0.1, 0.1 * W],
            ],
            ox, oy, rotY
          )}
          fill={COLORS.roofAccent}
          stroke={COLORS.outline}
          strokeWidth={0.8}
        />
      );
    }
  }

  // AC atap
  if (ac) {
    const x1 = 0.58 * L;
    const x2 = 0.72 * L;
    const z1 = 0.3 * W;
    const z2 = 0.7 * W;
    const ah = 0.16;
    add(
      <polygon
        key="ac-top"
        points={pts(
          [
            [x1, H + ah, z1],
            [x2, H + ah, z1],
            [x2, H + ah, z2],
            [x1, H + ah, z2],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.ac}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    add(
      <polygon
        key="ac-side"
        points={pts(
          [
            [x1, H, z2],
            [x2, H, z2],
            [x2, H + ah, z2],
            [x1, H + ah, z2],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.acDark}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    add(
      <polygon
        key="ac-front"
        points={pts(
          [
            [x2, H, z1],
            [x2, H, z2],
            [x2, H + ah, z2],
            [x2, H + ah, z1],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.roofAccent}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
  }

  // Exhaust hood (food truck)
  if (exhaust) {
    const x1 = 0.2 * L;
    const x2 = 0.3 * L;
    const z1 = 0.42 * W;
    const z2 = 0.58 * W;
    const eh = 0.22;
    add(
      <polygon
        key="exh-top"
        points={pts(
          [
            [x1, H + eh, z1],
            [x2, H + eh, z1],
            [x2, H + eh, z2],
            [x1, H + eh, z2],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.ac}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    add(
      <polygon
        key="exh-front"
        points={pts(
          [
            [x2, H, z1],
            [x2, H, z2],
            [x2, H + eh, z2],
            [x2, H + eh, z1],
          ],
          ox, oy, rotY
        )}
        fill={COLORS.acDark}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
  }

  // Solar vent (kubah kecil)
  if (solarVent) {
    const [cx, cy] = P(0.85 * L, H, 0.5 * W, ox, oy, rotY);
    add(
      <ellipse
        key="vent"
        cx={cx}
        cy={cy}
        rx={0.09 * W * S}
        ry={0.06 * W * S}
        fill={COLORS.ac}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
  }

  // ------------------------------------------------------------------
  // Roda (digambar paling akhir agar tampak di depan body)
  // ------------------------------------------------------------------

  const wheels: { x: number; z: number; front?: boolean }[] = [
    { x: 0.14 * L, z: W + 0.02 },
    { x: 0.88 * L, z: W + 0.02 },
    { x: L + 0.02, z: 0.22 * W, front: true },
    { x: L + 0.02, z: 0.78 * W, front: true },
  ];
  if (type === "motorhome") wheels.splice(1, 0, { x: 0.5 * L, z: W + 0.02 });

  wheels.forEach((w, i) => {
    const [cx, cy] = P(w.x, r, w.z, ox, oy, rotY);
    const rx = (w.front ? 0.5 : 0.62) * r * S;
    const ry = (w.front ? 0.62 : 0.5) * r * S;
    add(
      <ellipse
        key={`wheel-${i}`}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={COLORS.wheel}
        stroke="#0f172a"
        strokeWidth={1}
      />
    );
    add(<ellipse key={`hub-${i}`} cx={cx} cy={cy} rx={rx * 0.4} ry={ry * 0.4} fill={COLORS.wheelHub} />);
  });

  // ------------------------------------------------------------------
  // Sketchy overlay — garis tangan pada tepi body
  // ------------------------------------------------------------------

  sketchyElements.push(sketchyPolygon([TFL, TFR, TBR, TBL], 100, 0.12)); // atap
  sketchyElements.push(sketchyPolygon([TFR, TBR, BR, FR], 200, 0.15)); // sisi
  sketchyElements.push(sketchyPolygon([TFL, TFR, FR, FL], 300, 0.15)); // depan

  return {
    viewBox,
    elements: el,
    groundGrid: gridElements,
    dimensions: dimElements,
    sketchyLines: sketchyElements,
  };
}

// ------------------------------------------------------------------
// Jendela sisi per tipe & layout
// ------------------------------------------------------------------

function getWindows(type: Exclude<VehicleType, "plts">, layout: string | null): [number, number][] {
  if (type === "campervan") {
    if (layout === "CV-LAY-1") return [[0.18, 0.42], [0.55, 0.85]];
    if (layout === "CV-LAY-2") return [[0.16, 0.38], [0.48, 0.68], [0.78, 0.95]];
    return [[0.18, 0.45], [0.55, 0.85]];
  }
  if (type === "motorhome") {
    return [[0.12, 0.27], [0.32, 0.47], [0.55, 0.7], [0.76, 0.92]];
  }
  // foodtruck: jendela layanan besar
  return [[0.15, 0.62]];
}

// ------------------------------------------------------------------
// Placeholder PLTS (panel surya sederhana)
// ------------------------------------------------------------------

function PltsSketch() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" role="img" aria-label="PLTS">
      <circle cx={172} cy={26} r={14} fill="#fbbf24" />
      {[172 - 24, 172 + 24].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={10}
          x2={x}
          y2={42}
          stroke="#fcd34d"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <polygon points="34,88 118,52 158,70 74,106" fill="#1e3a8a" stroke="#0f172a" strokeWidth={1.5} />
      <polygon points="118,52 158,70 158,96 118,78" fill="#dbe3ea" stroke="#334155" strokeWidth={1.5} />
      <line x1={70} y1={102} x2={58} y2={132} stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
      <line x1={112} y1={62} x2={106} y2={132} stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
      <line x1={40} y1={134} x2={180} y2={134} stroke="#cbd5e1" strokeWidth={2} />
    </svg>
  );
}
