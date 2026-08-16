"use client";

import { useMemo } from "react";
import type { VehicleType } from "@/lib/configurator-data";
import { useI18n } from "@/lib/i18n/provider";

// ------------------------------------------------------------------
// Proyeksi isometrik sederhana (sketsa teknik 3D)
// x = panjang (depan-belakang), y = tinggi, z = lebar (kiri-kanan)
// ------------------------------------------------------------------

const cos30 = Math.cos(Math.PI / 6);
const sin30 = 0.5;
const S = 30; // piksel per satuan

type V3 = [number, number, number];
type V2 = [number, number];

function P(x: number, y: number, z: number, ox: number, oy: number): V2 {
  return [ox + (x - z) * cos30 * S, oy + (x + z) * sin30 * S - y * S];
}

function pts(corners: V3[], ox: number, oy: number): string {
  return corners
    .map(([x, y, z]) =>
      P(x, y, z, ox, oy)
        .map((n) => +n.toFixed(1))
        .join(",")
    )
    .join(" ");
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
  side: "#dbe3ea",
  front: "#eef2f7",
  roof: "#f8fafc",
  outline: "#334155",
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
};

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
};

export function VehicleSketch({
  vehicleType,
  packageCode,
  layoutCode,
  materialCode,
  addonCodes,
  includePlts,
}: SketchProps) {
  const { t } = useI18n();

  const addonKey = addonCodes.join("|");

  const scene = useMemo(() => {
    if (!vehicleType || vehicleType === "plts") return null;
    return buildScene(vehicleType, {
      packageCode,
      layoutCode,
      materialCode,
      addons: addonKey,
      includePlts,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, packageCode, layoutCode, materialCode, addonKey, includePlts]);

  if (!scene) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-400">
        {vehicleType === "plts" ? <PltsSketch /> : t.configurator.previewEmpty}
      </div>
    );
  }

  return (
    <svg
      viewBox={scene.viewBox}
      role="img"
      aria-label={t.configurator.preview}
      className="h-auto w-full select-none"
    >
      {scene.elements}
    </svg>
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
};

function buildScene(type: Exclude<VehicleType, "plts">, input: SceneInput) {
  const { L, W, H, r } = DIMS[type];
  const addons = new Set(input.addons.split("|").filter(Boolean));
  const pkg = input.packageCode ?? "";
  const accent = ACCENT[input.materialCode ?? ""] ?? ACCENT["MAT-HPL"];

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
  const awning =
    addons.has("CV-AD-AWNING") ||
    addons.has("MH-AD-AWNING") ||
    addons.has("FT-AD-AWNING");
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
  const pad = 30;
  const viewBox = [
    0,
    0,
    Math.ceil(maxX - minX + pad * 2),
    Math.ceil(maxY - minY + pad * 2),
  ].join(" ");
  const ox = -minX + pad;
  const oy = -minY + pad;

  const el: React.ReactNode[] = [];
  const add = (node: React.ReactNode) => el.push(node);

  // Titik pojok body
  const BL: V3 = [0, 0, 0];
  const BR: V3 = [0, 0, W];
  const FL: V3 = [L, 0, 0];
  const FR: V3 = [L, 0, W];
  const TBL: V3 = [0, H, 0];
  const TBR: V3 = [0, H, W];
  const TFL: V3 = [L, H, 0];
  const TFR: V3 = [L, H, W];

  // 1. Bayangan tanah
  const [scx, scy] = P(L / 2, 0, W / 2, ox, oy);
  add(
    <ellipse
      key="shadow"
      cx={scx}
      cy={scy}
      rx={(L * cos30 + W * sin30) * S * 0.52}
      ry={(L * sin30 + W * cos30) * S * 0.42}
      fill="rgba(15,23,42,0.12)"
    />
  );

  // 2. Sisi body (z = W) — menghadap kiri-atas
  add(
    <polygon
      key="side"
      points={pts([TFR, TBR, BR, FR], ox, oy)}
      fill={COLORS.side}
      stroke={COLORS.outline}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );

  // 3. Depan body (x = L) — menghadap kanan-bawah
  add(
    <polygon
      key="front"
      points={pts([TFL, TFR, FR, FL], ox, oy)}
      fill={COLORS.front}
      stroke={COLORS.outline}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );

  // 4. Atap (y = H)
  add(
    <polygon
      key="roof"
      points={pts([TFL, TFR, TBR, TBL], ox, oy)}
      fill={COLORS.roof}
      stroke={COLORS.outline}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );

  // ------------------------------------------------------------------
  // Detail SISI (z = W)
  // ------------------------------------------------------------------

  // Strip material (warna aksen sesuai pilihan)
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
        ox,
        oy
      )}
      fill={accent}
      opacity={0.85}
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
          ox,
          oy
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
    const [ax, ay] = P(0.74 * L, 0.06 * H, W, ox, oy);
    const [bx, by] = P(0.74 * L, 0.86 * H, W, ox, oy);
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
          ox,
          oy
        )}
        fill={COLORS.rack}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    const armL = P(0.28 * L, 0.84 * H, W, ox, oy);
    const armL2 = P(0.28 * L, 0.62 * H, W, ox, oy);
    const armR = P(0.72 * L, 0.84 * H, W, ox, oy);
    const armR2 = P(0.72 * L, 0.62 * H, W, ox, oy);
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
        ox,
        oy
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
        ox,
        oy
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
        ox,
        oy
      )}
      fill={COLORS.grille}
    />
  );

  // Lampu depan
  for (const [zx, key] of [
    [0.18 * W, "light-l"],
    [0.82 * W, "light-r"],
  ] as const) {
    const [cx, cy] = P(L, 0.13 * H, zx, ox, oy);
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
          ox,
          oy
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
          ox,
          oy
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
        points={pts([p1, p2, p3, p4], ox, oy)}
        fill={COLORS.solar}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
    // garis sel
    for (const fx of [0.26, 0.38]) {
      const [ax, ay] = P(fx * L, H + 0.02, 0.16 * W, ox, oy);
      const [bx, by] = P(fx * L, H + 0.02, 0.84 * W, ox, oy);
      add(
        <line key={`solar-v-${fx}`} x1={ax} y1={ay} x2={bx} y2={by} stroke={COLORS.solarLine} strokeWidth={0.8} />
      );
    }
    const [gx1, gy1] = P(0.14 * L, H + 0.02, 0.5 * W, ox, oy);
    const [gx2, gy2] = P(0.5 * L, H + 0.02, 0.5 * W, ox, oy);
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
            ox,
            oy
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
            ox,
            oy
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
          ox,
          oy
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
          ox,
          oy
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
          ox,
          oy
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
          ox,
          oy
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
          ox,
          oy
        )}
        fill={COLORS.acDark}
        stroke={COLORS.outline}
        strokeWidth={1}
      />
    );
  }

  // Solar vent (kubah kecil)
  if (solarVent) {
    const [cx, cy] = P(0.85 * L, H, 0.5 * W, ox, oy);
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
    { x: 0.14 * L, z: W + 0.02 }, // roda belakang sisi
    { x: 0.88 * L, z: W + 0.02 }, // roda depan sisi
    { x: L + 0.02, z: 0.22 * W, front: true }, // roda kiri depan
    { x: L + 0.02, z: 0.78 * W, front: true }, // roda kanan depan
  ];
  if (type === "motorhome") wheels.splice(1, 0, { x: 0.5 * L, z: W + 0.02 });

  wheels.forEach((w, i) => {
    const [cx, cy] = P(w.x, r, w.z, ox, oy);
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
    add(
      <ellipse key={`hub-${i}`} cx={cx} cy={cy} rx={rx * 0.4} ry={ry * 0.4} fill={COLORS.wheelHub} />
    );
  });

  return { viewBox, elements: el };
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
