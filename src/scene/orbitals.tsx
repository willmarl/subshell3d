import { useMemo } from "react"
import {
  DoubleSide,
  FrontSide,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
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

function ElectronDots({ count }: { count: number }) {
  if (count <= 0) {
    return null
  }

  const spots =
    count === 1
      ? [
          {
            position: [0.05, 0.34, 0.52] as [number, number, number],
            color: "#f4f8ff",
          },
        ]
      : [
          {
            position: [0.24, 0.3, 0.5] as [number, number, number],
            color: "#f4f8ff",
          },
          {
            position: [-0.24, 0.38, 0.5] as [number, number, number],
            color: "#5ad7ff",
          },
        ]

  return (
    <group>
      {spots.map((spot) => (
        <mesh key={spot.color} position={spot.position} renderOrder={30}>
          <sphereGeometry args={[0.11, 16, 12]} />
          <meshStandardMaterial
            color={spot.color}
            emissive={spot.color}
            emissiveIntensity={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
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
  onSelect?: () => void
}) {
  const lobes = lobesFor(letter, index)
  const glow = electrons > 0 ? 0.38 : 0.08

  return (
    <group scale={scale}>
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
      <ElectronDots count={electrons} />
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
