"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, RoundedBox as DreiRoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  DEFAULT_EXTERIOR_COLOR,
  DEFAULT_INTERIOR_COLOR,
  EXTERIOR_COLOR_MAP,
  INTERIOR_COLOR_MAP,
  type VehicleType,
} from "@/lib/configurator-data";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type Vehicle3DProps = {
  vehicleType: VehicleType | null;
  packageCode: string | null;
  layoutCode: string | null;
  materialCode: string | null;
  addonCodes: string[];
  includePlts: boolean;
  exteriorColor?: string | null;
  interiorColor?: string | null;
};

// ------------------------------------------------------------------
// Vehicle dimensions (meters)
// ------------------------------------------------------------------

type Dims = { L: number; W: number; H: number; wheelR: number; wheelW: number };

const DIMS: Record<Exclude<VehicleType, "plts">, Dims> = {
  campervan:  { L: 5.2, W: 2.0, H: 2.15, wheelR: 0.42, wheelW: 0.22 },
  motorhome:  { L: 7.0, W: 2.4, H: 2.9,  wheelR: 0.50, wheelW: 0.28 },
  foodtruck:  { L: 4.6, W: 2.0, H: 2.35, wheelR: 0.40, wheelW: 0.20 },
};

// ------------------------------------------------------------------
// Color utilities
// ------------------------------------------------------------------

function hexToThree(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function getBodyColor(exteriorCode: string | null): THREE.Color {
  const base =
    EXTERIOR_COLOR_MAP.get(exteriorCode ?? "")?.swatch ??
    EXTERIOR_COLOR_MAP.get(DEFAULT_EXTERIOR_COLOR)!.swatch;
  return hexToThree(base);
}

function getInteriorColor(interiorCode: string | null): THREE.Color {
  const swatch =
    INTERIOR_COLOR_MAP.get(interiorCode ?? "")?.swatch ??
    INTERIOR_COLOR_MAP.get(DEFAULT_INTERIOR_COLOR)!.swatch;
  return hexToThree(swatch);
}

function darken(c: THREE.Color, amt: number): THREE.Color {
  return c.clone().multiplyScalar(1 - amt);
}

function lighten(c: THREE.Color, amt: number): THREE.Color {
  return c.clone().lerp(new THREE.Color(1, 1, 1), amt);
}

// ------------------------------------------------------------------
// Rounded box helper (for body panels)
// ------------------------------------------------------------------

function RoundedBoxPanel({
  args,
  radius = 0.05,
  color,
  metalness = 0.3,
  roughness = 0.5,
  position = [0, 0, 0],
  rotation,
}: {
  args: [number, number, number];
  radius?: number;
  color: THREE.Color;
  metalness?: number;
  roughness?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <DreiRoundedBox
      args={args}
      radius={radius}
      smoothness={4}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        envMapIntensity={0.8}
      />
    </DreiRoundedBox>
  );
}

// ------------------------------------------------------------------
// Wheel component
// ------------------------------------------------------------------

function Wheel({
  position,
  radius,
  width,
}: {
  position: [number, number, number];
  radius: number;
  width: number;
}) {
  return (
    <group position={position}>
      {/* Tire */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, width, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.55, radius * 0.55, width + 0.02, 16]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Hub cap */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.25, radius * 0.25, width + 0.04, 8]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.15} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// Window component (glass panel)
// ------------------------------------------------------------------

function GlassPanel({
  position,
  args,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  args: [number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={args} />
      <meshPhysicalMaterial
        color="#88bbee"
        transparent
        opacity={0.35}
        roughness={0.05}
        metalness={0.1}
        transmission={0.6}
        thickness={0.02}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

// ------------------------------------------------------------------
// Roof Rack
// ------------------------------------------------------------------

function RoofRack({
  L,
  W,
  H,
}: {
  L: number;
  W: number;
  H: number;
}) {
  const rackColor = new THREE.Color("#5a6570");
  const railH = 0.06;
  const railW = 0.04;

  return (
    <group position={[0, H + railH / 2 + 0.01, 0]}>
      {/* Side rails */}
      {[-1, 1].map((side) => (
        <mesh
          key={`rail-${side}`}
          position={[0, 0, side * (W * 0.42)]}
          castShadow
        >
          <boxGeometry args={[L * 0.82, railH, railW]} />
          <meshStandardMaterial color={rackColor} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* Cross bars */}
      {[-0.3, 0, 0.3].map((xFrac, i) => (
        <mesh key={`cross-${i}`} position={[xFrac * L, 0, 0]} castShadow>
          <boxGeometry args={[railW, railH, W * 0.88]} />
          <meshStandardMaterial color={rackColor} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------
// Solar Panel
// ------------------------------------------------------------------

function SolarPanel({
  L,
  W,
  H,
}: {
  L: number;
  W: number;
  H: number;
}) {
  const panelColor = new THREE.Color("#0f2a6e");
  const lineColor = new THREE.Color("#2255bb");

  return (
    <group position={[0, H + 0.025, 0]}>
      {/* Panel base */}
      <mesh position={[-0.15 * L, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[L * 0.36, 0.02, W * 0.65]} />
        <meshStandardMaterial color={panelColor} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Grid lines (subtle) */}
      {[-0.05, 0.05].map((xFrac, i) => (
        <mesh key={`sv-${i}`} position={[xFrac * L, 0.011, 0]}>
          <boxGeometry args={[0.005, 0.002, W * 0.65]} />
          <meshStandardMaterial color={lineColor} metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-0.15 * L, 0.011, 0]}>
        <boxGeometry args={[L * 0.36, 0.002, 0.005]} />
        <meshStandardMaterial color={lineColor} metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// AC Unit on roof
// ------------------------------------------------------------------

function ACUnit({
  L,
  W,
  H,
}: {
  L: number;
  W: number;
  H: number;
}) {
  const acColor = new THREE.Color("#c8d4dc");
  const acDark = new THREE.Color("#8a9aa8");

  return (
    <group position={[0.15 * L, H + 0.08, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.16, W * 0.38]} />
        <meshStandardMaterial color={acColor} metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Top vent */}
      <mesh position={[0, 0.081, 0]}>
        <boxGeometry args={[0.5, 0.02, W * 0.28]} />
        <meshStandardMaterial color={acDark} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// Exhaust Hood (food truck)
// ------------------------------------------------------------------

function ExhaustHood({
  L,
  W,
  H,
}: {
  L: number;
  W: number;
  H: number;
}) {
  const hoodColor = new THREE.Color("#8a9aa8");

  return (
    <group position={[-0.15 * L, H + 0.12, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.24, W * 0.18]} />
        <meshStandardMaterial color={hoodColor} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Chimney pipe */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 12]} />
        <meshStandardMaterial color="#606a74" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// Awning
// ------------------------------------------------------------------

function Awning({
  L,
  W,
  H,
}: {
  L: number;
  W: number;
  H: number;
}) {
  const awningColor = new THREE.Color("#3a4a56");

  return (
    <group position={[0, H * 0.82, W * 0.5 + 0.04]}>
      {/* Rolled awning housing */}
      <mesh castShadow>
        <boxGeometry args={[L * 0.52, 0.08, 0.1]} />
        <meshStandardMaterial color={awningColor} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Support arms */}
      {[-0.2, 0.2].map((xFrac, i) => (
        <mesh key={`arm-${i}`} position={[xFrac * L, -0.15, -0.04]}>
          <boxGeometry args={[0.025, 0.35, 0.025]} />
          <meshStandardMaterial color="#4a5568" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------
// LED Sign (food truck)
// ------------------------------------------------------------------

function LEDSign({
  L,
  W,
  H,
}: {
  L: number;
  W: number;
  H: number;
}) {
  return (
    <group position={[L * 0.5 + 0.01, H * 0.35, 0]}>
      {/* Sign backing */}
      <mesh>
        <boxGeometry args={[0.02, 0.28, W * 0.6]} />
        <meshStandardMaterial color="#c07800" metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Glow face */}
      <mesh position={[0.011, 0, 0]}>
        <boxGeometry args={[0.005, 0.22, W * 0.5]} />
        <meshStandardMaterial
          color="#fde68a"
          emissive="#fbbf24"
          emissiveIntensity={0.8}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// Main Vehicle Body
// ------------------------------------------------------------------

function VehicleBody({
  type,
  dims,
  bodyColor,
  interiorColor,
  layoutCode,
  addonSet,
  exteriorColor,
}: {
  type: Exclude<VehicleType, "plts">;
  dims: Dims;
  bodyColor: THREE.Color;
  interiorColor: THREE.Color;
  layoutCode: string | null;
  addonSet: Set<string>;
  exteriorColor: string | null;
}) {
  const { L, W, H } = dims;
  const darkBody = darken(bodyColor, 0.15);
  const lightBody = lighten(bodyColor, 0.08);
  const accentColor = new THREE.Color("#0d9488");
  const chromeColor = new THREE.Color("#c0c8d0");
  const glassColor = new THREE.Color("#88bbee");
  const blackTrim = new THREE.Color("#1a202c");

  // Window positions based on type and layout
  const windows = useMemo(() => {
    if (type === "campervan") {
      if (layoutCode === "CV-LAY-2") {
        return [
          { x: -0.15, w: 0.55, z: W / 2 + 0.01 },
          { x: 0.55, w: 0.45, z: W / 2 + 0.01 },
          { x: 1.4, w: 0.35, z: W / 2 + 0.01 },
        ];
      }
      return [
        { x: -0.3, w: 0.9, z: W / 2 + 0.01 },
        { x: 1.0, w: 0.9, z: W / 2 + 0.01 },
      ];
    }
    if (type === "motorhome") {
      return [
        { x: -1.2, w: 0.7, z: W / 2 + 0.01 },
        { x: -0.2, w: 0.7, z: W / 2 + 0.01 },
        { x: 0.8, w: 0.7, z: W / 2 + 0.01 },
        { x: 1.8, w: 0.7, z: W / 2 + 0.01 },
      ];
    }
    // foodtruck — large service window
    return [{ x: -0.4, w: 1.4, z: W / 2 + 0.01 }];
  }, [type, layoutCode, W]);

  return (
    <group>
      {/* === MAIN BODY === */}
      {/* Bottom section (chassis area) */}
      <RoundedBoxPanel
        args={[L, H * 0.45, W]}
        radius={0.06}
        color={darkBody}
        metalness={0.35}
        roughness={0.45}
        position={[0, H * 0.225, 0]}
      />
      {/* Upper body */}
      <RoundedBoxPanel
        args={[L - 0.02, H * 0.55, W - 0.02]}
        radius={0.04}
        color={bodyColor}
        metalness={0.4}
        roughness={0.35}
        position={[0, H * 0.725, 0]}
      />
      {/* Roof */}
      <RoundedBoxPanel
        args={[L + 0.04, 0.06, W + 0.04]}
        radius={0.02}
        color={lightBody}
        metalness={0.3}
        roughness={0.4}
        position={[0, H + 0.03, 0]}
      />

      {/* === INTERIOR ACCENT STRIPE === */}
      <mesh position={[0, H * 0.5, W / 2 + 0.011]}>
        <planeGeometry args={[L * 0.84, H * 0.06]} />
        <meshStandardMaterial color={interiorColor} metalness={0.1} roughness={0.6} />
      </mesh>
      {/* Accent line below stripe */}
      <mesh position={[0, H * 0.44, W / 2 + 0.012]}>
        <planeGeometry args={[L * 0.84, H * 0.02]} />
        <meshStandardMaterial color={accentColor} metalness={0.2} roughness={0.5} />
      </mesh>

      {/* === WINDOWS === */}
      {windows.map((win, i) => (
        <GlassPanel
          key={`win-${i}`}
          position={[win.x, H * 0.72, win.z]}
          args={[win.w, H * 0.28]}
        />
      ))}

      {/* === FRONT FACE === */}
      {/* Windshield */}
      <GlassPanel
        position={[L / 2 + 0.011, H * 0.7, 0]}
        args={[W * 0.68, H * 0.3]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Grille */}
      <mesh position={[L / 2 + 0.011, H * 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[W * 0.32, H * 0.12]} />
        <meshStandardMaterial color={blackTrim} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Bumper */}
      <mesh position={[L / 2 + 0.011, H * 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[W * 0.84, H * 0.08]} />
        <meshStandardMaterial color={chromeColor} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Headlights */}
      {[-1, 1].map((side) => (
        <mesh
          key={`light-${side}`}
          position={[L / 2 + 0.012, H * 0.2, side * W * 0.38]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial
            color="#fde68a"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
            metalness={0.1}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* === SIDE DOOR LINE (campervan) === */}
      {type === "campervan" && (
        <mesh position={[1.0, H * 0.45, W / 2 + 0.013]}>
          <planeGeometry args={[0.015, H * 0.72]} />
          <meshStandardMaterial color={darken(bodyColor, 0.25)} metalness={0.3} roughness={0.5} />
        </mesh>
      )}

      {/* === FOOD TRUCK SERVICE WINDOW === */}
      {type === "foodtruck" && (
        <group>
          {/* Service counter */}
          <mesh position={[-0.1, H * 0.4, W / 2 + 0.15]}>
            <boxGeometry args={[1.4, 0.04, 0.25]} />
            <meshStandardMaterial color="#8B7355" metalness={0.1} roughness={0.7} />
          </mesh>
          {/* Counter supports */}
          {[-0.55, 0.55].map((xFrac, i) => (
            <mesh key={`sup-${i}`} position={[xFrac, H * 0.35, W / 2 + 0.12]}>
              <boxGeometry args={[0.04, 0.15, 0.04]} />
              <meshStandardMaterial color="#6b5b3e" metalness={0.1} roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* === ADDONS === */}
      {addonSet.has("roof-rack") && <RoofRack L={L} W={W} H={H} />}
      {addonSet.has("ac") && <ACUnit L={L} W={W} H={H} />}
      {addonSet.has("exhaust") && <ExhaustHood L={L} W={W} H={H} />}
      {addonSet.has("awning") && <Awning L={L} W={W} H={H} />}
      {addonSet.has("led-sign") && <LEDSign L={L} W={W} H={H} />}
    </group>
  );
}

// ------------------------------------------------------------------
// Ground Plane
// ------------------------------------------------------------------

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[12, 64]} />
      <meshStandardMaterial
        color="#e8e8e8"
        roughness={0.95}
        metalness={0.0}
      />
    </mesh>
  );
}

// ------------------------------------------------------------------
// Scene (inner)
// ------------------------------------------------------------------

function VehicleScene({
  vehicleType,
  packageCode,
  layoutCode,
  materialCode,
  addonCodes,
  includePlts,
  exteriorColor,
  interiorColor,
}: Vehicle3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const type = vehicleType && vehicleType !== "plts" ? vehicleType : "campervan";
  const dims = DIMS[type];

  const bodyColor = getBodyColor(exteriorColor ?? null);
  const intColor = getInteriorColor(interiorColor ?? null);

  const pkg = packageCode ?? "";
  const addons = useMemo(() => {
    const s = new Set<string>();
    // Package-based addons
    if (pkg.includes("DLX") || pkg.includes("PRM")) s.add("roof-rack");
    if (pkg.includes("PRM")) s.add("ac");
    // Explicit addon codes → friendly names
    for (const code of addonCodes) {
      if (code.includes("ROOF") || code.includes("RACK")) s.add("roof-rack");
      if (code.includes("AC")) s.add("ac");
      if (code.includes("HOOD") || code.includes("EXHAUST")) s.add("exhaust");
      if (code.includes("AWNING")) s.add("awning");
      if (code.includes("SIGN")) s.add("led-sign");
    }
    if (includePlts) s.add("solar");
    return s;
  }, [pkg, addonCodes, includePlts]);

  // Gentle auto-rotation when not interacting
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#b4c6e0" />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#fff5e6" />

      {/* Environment for reflections */}
      <Environment preset="city" environmentIntensity={0.6} />

      {/* Ground */}
      <Ground />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={20}
        blur={2}
        far={6}
      />

      {/* Vehicle */}
      <group ref={groupRef} position={[0, dims.wheelR + 0.02, 0]}>
        <VehicleBody
          type={type}
          dims={dims}
          bodyColor={bodyColor}
          interiorColor={intColor}
          layoutCode={layoutCode}
          addonSet={addons}
          exteriorColor={exteriorColor ?? null}
        />

        {/* Solar panel on roof */}
        {addons.has("solar") && <SolarPanel L={dims.L} W={dims.W} H={dims.H} />}

        {/* Wheels */}
        {type === "campervan" && (
          <>
            <Wheel position={[-dims.L * 0.34, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
            <Wheel position={[dims.L * 0.38, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
          </>
        )}
        {type === "motorhome" && (
          <>
            <Wheel position={[-dims.L * 0.34, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
            <Wheel position={[0, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
            <Wheel position={[dims.L * 0.34, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
          </>
        )}
        {type === "foodtruck" && (
          <>
            <Wheel position={[-dims.L * 0.32, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
            <Wheel position={[dims.L * 0.34, 0, dims.W / 2 + dims.wheelW / 2 + 0.02]} radius={dims.wheelR} width={dims.wheelW} />
          </>
        )}
      </group>
    </>
  );
}

// ------------------------------------------------------------------
// PLTS-only scene (solar panel ground mount)
// ------------------------------------------------------------------

function PltsScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
      <Environment preset="city" environmentIntensity={0.5} />
      <Ground />
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={15} blur={2} far={5} />

      <group position={[0, 0.8, 0]}>
        {/* Panel */}
        <mesh rotation={[-0.3, 0, 0]} position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.04, 1.1]} />
          <meshStandardMaterial color="#0f2a6e" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Grid lines */}
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={`lg-${i}`} position={[x, 0.021, 0]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.005, 0.002, 1.1]} />
            <meshStandardMaterial color="#2255bb" />
          </mesh>
        ))}
        {/* Legs */}
        {[-0.7, 0.7].map((x, i) => (
          <mesh key={`leg-${i}`} position={[x, -0.4, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ------------------------------------------------------------------
// Main exported component
// ------------------------------------------------------------------

export function Vehicle3D(props: Vehicle3DProps) {
  const isPlts = props.vehicleType === "plts";

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200">
      <Canvas
        shadows
        camera={{ position: [5, 4, 6], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#e8ecf0"]} />
        <fog attach="fog" args={["#e8ecf0", 15, 30]} />
        <Suspense fallback={null}>
          {isPlts ? <PltsScene /> : <VehicleScene {...props} />}
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={16}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.1}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Overlay hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-slate-900/60 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm">
        🖱 Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
