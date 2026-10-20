import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import {
  AddEquation,
  CircleGeometry,
  CustomBlending,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OneMinusDstColorFactor,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  ZeroFactor,
} from "three"
import type { Letter } from "@/data/filling"

const SPHERE = new SphereGeometry(1, 28, 20)
const TORUS = new TorusGeometry(0.44, 0.11, 14, 32)

const TONES: Record<Letter, [string, string]> = {
  s: ["#e5484d", "#ffb1ad"],
  p: ["#f6c445", "#e07a1f"],
  d: ["#4d7dff", "#c5d8ff"],
  f: ["#2fbf70", "#d5e6dc"],
}

type LobeKind = "sphere" | "lobe" | "ring"

type Lobe = {
  kind: LobeKind
  dir: [number, number, number]
  color: string
  radius: number
  length: number
}

const UP = new Vector3(0, 1, 0)

function tone(letter: Letter, index: number) {
  return TONES[letter][index % 2]
}

function ringDirs(
  count: number,
  plane: "xy" | "xz" | "yz",
  turn = 0
): [number, number, number][] {
  return Array.from({ length: count }, (_, index) => {
    const angle = turn + (index / count) * Math.PI * 2
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    if (plane === "xy") {
      return [cosine, sine, 0]
    }
    if (plane === "xz") {
      return [cosine, 0, sine]
    }
    return [0, cosine, sine]
  })
}

function clover(
  letter: Letter,
  plane: "xy" | "xz" | "yz",
  axesAligned: boolean
): Lobe[] {
  const turn = axesAligned ? 0 : Math.PI / 4
  return ringDirs(4, plane, turn).map((dir, index) => ({
    kind: "lobe" as const,
    dir,
    color: tone(letter, index),
    radius: 0.26,
    length: 0.5,
  }))
}

function dumbbell(letter: Letter, axis: [number, number, number]): Lobe[] {
  return [
    {
      kind: "lobe",
      dir: axis,
      color: tone(letter, 0),
      radius: 0.34,
      length: 0.58,
    },
    {
      kind: "lobe",
      dir: [-axis[0], -axis[1], -axis[2]],
      color: tone(letter, 1),
      radius: 0.34,
      length: 0.58,
    },
  ]
}

const F_DIRECTIONS: [number, number, number][][] = [
  [
    [1, 1, 1],
    [1, 1, -1],
    [1, -1, 1],
    [1, -1, -1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [-1, -1, -1],
  ],
  [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ],
  ringDirs(6, "xy"),
  [
    [0, 0, 1],
    [0, 0, -1],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ],
  ringDirs(6, "xz", 0.35),
  [
    ...ringDirs(4, "xy", 0.2).map(
      ([x, y]) => [x, y, 0.55] as [number, number, number]
    ),
    ...ringDirs(4, "xy", 0.2 + Math.PI / 4).map(
      ([x, y]) => [x, y, -0.55] as [number, number, number]
    ),
  ],
  ringDirs(6, "yz", 0.2),
]

export function lobesFor(letter: Letter, index: number): Lobe[] {
  if (letter === "s") {
    return [
      {
        kind: "sphere",
        dir: [0, 0, 0],
        color: tone(letter, 0),
        radius: 0.72,
        length: 0.72,
      },
    ]
  }

  if (letter === "p") {
    const axes: [number, number, number][] = [
      [1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
    ]
    return dumbbell(letter, axes[index] ?? axes[0])
  }

  if (letter === "d") {
    if (index === 2) {
      return [
        ...dumbbell(letter, [0, 0, 1]),
        {
          kind: "ring",
          dir: [0, 1, 0],
          color: tone(letter, 1),
          radius: 0.11,
          length: 0.44,
        },
      ]
    }

    const clovers = [
      clover(letter, "xy", false),
      clover(letter, "yz", false),
      clover(letter, "xz", false),
      clover(letter, "xy", true),
    ]
    return clovers[index > 2 ? index - 1 : index] ?? clovers[0]
  }

  const dirs = F_DIRECTIONS[index] ?? F_DIRECTIONS[0]
  return dirs.map((dir, lobeIndex) => ({
    kind: "lobe" as const,
    dir,
    color: tone(letter, lobeIndex),
    radius: 0.2,
    length: 0.4,
  }))
}

function LobeMesh({
  lobe,
  opacity,
  depthWrite,
  renderOrder,
  doubleSide,
  glow,
}: {
  lobe: Lobe
  opacity: number
  depthWrite: boolean
  renderOrder: number
  doubleSide: boolean
  glow: number
}) {
  const placement = useMemo(() => {
    if (lobe.kind !== "lobe") {
      return { quaternion: new Quaternion(), position: new Vector3() }
    }

    const direction = new Vector3(...lobe.dir).normalize()
    const quaternion = new Quaternion().setFromUnitVectors(UP, direction)
    const position = direction.multiplyScalar(lobe.length * 0.8)
    return { quaternion, position }
  }, [lobe])

  const material = (
    <meshStandardMaterial
      color={lobe.color}
      emissive={lobe.color}
      emissiveIntensity={glow}
      transparent={opacity < 0.98}
      opacity={opacity}
      roughness={0.38}
      metalness={0.04}
      depthWrite={depthWrite}
      side={doubleSide ? DoubleSide : FrontSide}
    />
  )

  if (lobe.kind === "ring") {
    return (
      <mesh geometry={TORUS} renderOrder={renderOrder}>
        {material}
      </mesh>
    )
  }

  if (lobe.kind === "sphere") {
    return (
      <mesh geometry={SPHERE} scale={lobe.radius} renderOrder={renderOrder}>
        {material}
      </mesh>
    )
  }

  return (
    <mesh
      geometry={SPHERE}
      quaternion={placement.quaternion}
      position={placement.position}
      scale={[lobe.radius, lobe.length, lobe.radius]}
      renderOrder={renderOrder}
    >
      {material}
    </mesh>
  )
}

const DOT = new SphereGeometry(0.14, 18, 14)
const HALO = new CircleGeometry(1, 48)
const RIPPLE = new TorusGeometry(0.2, 0.028, 8, 28)
const ALONE: [number, number, number] = [0, 0.3, 0.6]
const PAIR_RIGHT: [number, number, number] = [0.24, 0.3, 0.58]
const PAIR_LEFT: [number, number, number] = [-0.24, 0.3, 0.58]
const ARRIVE_SECONDS = 2.2
const LEAVE_SECONDS = 0.55
const ARRIVE_FLASHES = 3

function arrivePresentation(t: number) {
  const popEnd = 0.16
  if (t < popEnd) {
    const u = t / popEnd
    return { scale: u * u * (3 - 2 * u) * 1.7, flash: u }
  }

  const u = (t - popEnd) / (1 - popEnd)
  const flash = Math.max(0, Math.sin(u * Math.PI * ARRIVE_FLASHES * 2))
  const fade = 1 - u
  return {
    scale: 1 + flash * 1.15 * (0.45 + fade),
    flash,
  }
}

function leaveScale(t: number) {
  if (t < 0.22) {
    return 1 + t * 1.6
  }
  return 1.35 * (1 - (t - 0.22) / 0.78)
}

function ElectronDots({
  count,
  color,
  parentScale,
}: {
  count: number
  color: string
  parentScale: number
}) {
  return (
    <group>
      <ElectronDot
        show={count >= 1}
        position={count >= 2 ? PAIR_RIGHT : ALONE}
        color={color}
        parentScale={parentScale}
      />
      <ElectronDot
        show={count >= 2}
        position={PAIR_LEFT}
        color={color}
        parentScale={parentScale}
      />
    </group>
  )
}

function ElectronDot({
  show,
  position,
  color,
  parentScale,
}: {
  show: boolean
  position: [number, number, number]
  color: string
  parentScale: number
}) {
  const holder = useRef<Group>(null)
  const dot = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const ripple = useRef<Mesh>(null)
  const material = useRef<MeshStandardMaterial>(null)
  const haloMaterial = useRef<MeshBasicMaterial>(null)
  const rippleMaterial = useRef<MeshBasicMaterial>(null)
  const anchor = useRef(new Vector3(...position))
  const placed = useRef(false)
  const progress = useRef(1)
  const phase = useRef<"arrive" | "leave" | "still">("still")
  const wasShown = useRef(show)
  const camera = useThree((state) => state.camera)

  useFrame((_, delta) => {
    const mesh = dot.current
    const group = holder.current
    if (!mesh || !group) {
      return
    }

    if (!placed.current) {
      group.position.copy(anchor.current)
      placed.current = true
    }

    anchor.current.set(...position)
    group.position.lerp(anchor.current, 1 - Math.exp(-delta * 10))

    if (show !== wasShown.current) {
      wasShown.current = show
      progress.current = 0
      phase.current = show ? "arrive" : "leave"
    }

    const step = Math.min(delta, 1 / 30)

    if (phase.current !== "still") {
      const duration =
        phase.current === "arrive" ? ARRIVE_SECONDS : LEAVE_SECONDS
      progress.current = Math.min(1, progress.current + step / duration)
      const t = progress.current
      const arriving = phase.current === "arrive"
      const presented = arriving ? arrivePresentation(t) : null
      const scale = presented ? presented.scale : leaveScale(t)
      const flash = presented ? presented.flash : 0
      mesh.scale.setScalar(Math.max(0, scale))
      if (material.current) {
        const white = arriving ? flash : (1 - t) * 0.8
        material.current.color.setRGB(
          0.08 + white * 0.92,
          0.1 + white * 0.9,
          0.15 + white * 0.85
        )
        material.current.emissiveIntensity = arriving
          ? flash * 2.4
          : (1 - t) * 0.6
        material.current.depthTest = !arriving
      }
      const glow = halo.current
      if (glow && haloMaterial.current) {
        const worldRadius = arriving ? 0.28 + flash * 0.8 : 0
        glow.visible = arriving && worldRadius > 0.02
        glow.quaternion.copy(camera.quaternion)
        glow.scale.setScalar(worldRadius / Math.max(parentScale, 0.15))
      }
      const ring = ripple.current
      if (ring && rippleMaterial.current) {
        const showRing = !arriving
        ring.visible = showRing
        ring.quaternion.copy(camera.quaternion)
        ring.scale.setScalar(0.45 + t * 2.2)
        rippleMaterial.current.opacity = showRing ? (1 - t) * 0.7 : 0
      }
      if (t >= 1) {
        phase.current = "still"
        mesh.scale.setScalar(show ? 1 : 0)
        if (material.current) {
          material.current.color.set("#141a26")
          material.current.emissiveIntensity = 0
          material.current.depthTest = true
        }
        if (glow) {
          glow.visible = false
        }
        if (ring) {
          ring.visible = false
        }
      }
      return
    }

    mesh.scale.setScalar(show ? 1 : 0)
  })

  return (
    <group ref={holder}>
      <mesh ref={halo} geometry={HALO} visible={false} renderOrder={28}>
        <meshBasicMaterial
          ref={haloMaterial}
          color="#ffffff"
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          blending={CustomBlending}
          blendSrc={OneMinusDstColorFactor}
          blendDst={ZeroFactor}
          blendEquation={AddEquation}
        />
      </mesh>
      <mesh ref={dot} geometry={DOT} renderOrder={31} scale={show ? 1 : 0}>
        <meshStandardMaterial
          ref={material}
          color="#141a26"
          emissive="#ffffff"
          emissiveIntensity={0}
          roughness={0.35}
        />
      </mesh>
      <mesh ref={ripple} geometry={RIPPLE} visible={false} renderOrder={29}>
        <meshBasicMaterial
          ref={rippleMaterial}
          color={color}
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

export function Orbital({
  letter,
  index,
  electrons,
  opacity,
  scale = 1,
  depthWrite = true,
  renderOrder = 0,
  doubleSide = false,
  interactive = false,
  spin = false,
  onSelect,
}: {
  letter: Letter
  index: number
  electrons: number
  opacity: number
  scale?: number
  depthWrite?: boolean
  renderOrder?: number
  doubleSide?: boolean
  interactive?: boolean
  spin?: boolean
  onSelect?: () => void
}) {
  const lobes = lobesFor(letter, index)
  const glow = electrons > 0 ? 0.12 : 0
  const spinner = useRef<Group>(null)

  useFrame((_, delta) => {
    const group = spinner.current
    if (!group) {
      return
    }
    if (spin) {
      group.rotation.y = wrapAngle(group.rotation.y + delta * 0.6)
    } else if (group.rotation.y !== 0) {
      const eased = group.rotation.y * Math.exp(-delta * 5)
      group.rotation.y = Math.abs(eased) < 0.001 ? 0 : eased
    }
  })

  return (
    <group scale={scale}>
      <group ref={spinner}>
        {lobes.map((lobe, lobeIndex) => (
          <LobeMesh
            key={`${lobe.kind}-${lobeIndex}`}
            lobe={lobe}
            opacity={opacity}
            depthWrite={depthWrite}
            renderOrder={renderOrder}
            doubleSide={doubleSide}
            glow={glow}
          />
        ))}
      </group>
      <ElectronDots
        count={electrons}
        color={tone(letter, 0)}
        parentScale={scale}
      />
      {interactive ? (
        <mesh
          renderOrder={40}
          onClick={(event) => {
            event.stopPropagation()
            onSelect?.()
          }}
          onPointerOver={(event) => {
            event.stopPropagation()
            document.body.style.cursor = "pointer"
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto"
          }}
        >
          <sphereGeometry args={[0.95, 12, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  )
}
