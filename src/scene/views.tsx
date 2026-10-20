import { useMemo } from "react"
import { BoxGeometry, CanvasTexture, EdgesGeometry } from "three"
import {
  LETTERS,
  LETTER_INK,
  LETTER_TINT,
  ORBITALS,
  type AtomModel,
  type Letter,
} from "@/data/filling"
import { isEmphasized, type Focus } from "@/data/story"
import {
  CATALOG_GAP,
  CATALOG_SCALE,
  CATALOG_Y,
  FLOOR_DEPTH,
  FLOOR_LEFT,
  FLOOR_ORBITAL_SCALE,
  FLOOR_RIGHT,
  FLOOR_Y,
  GROUP_X,
  SHELL_RADIUS,
  orbitalSlot,
  visibleFloors,
} from "@/scene/layout"
import { Orbital } from "@/scene/orbitals"

const INK = "#1c2230"
const MUTED = "#8a93a3"

const labelTextures = new Map<string, CanvasTexture>()

function labelTexture(text: string, color: string, weight: number) {
  const key = `${color}|${weight}|${text}`
  const cached = labelTextures.get(key)
  if (cached) {
    return cached
  }

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not draw a label")
  }

  const font = `${weight} 64px Inter Variable, sans-serif`
  context.font = font
  const width = Math.ceil(context.measureText(text).width + 40)
  canvas.width = Math.max(width, 96)
  canvas.height = 112
  context.font = font
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.lineJoin = "round"
  context.lineWidth = 14
  context.strokeStyle = "rgba(255,255,255,0.92)"
  context.strokeText(text, canvas.width / 2, canvas.height / 2)
  context.fillStyle = color
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true
  labelTextures.set(key, texture)
  return texture
}

function Label({
  position,
  children,
  color = INK,
  size = 12,
  weight = 600,
}: {
  position: [number, number, number]
  children: string
  color?: string
  size?: number
  weight?: number
}) {
  const texture = labelTexture(children, color, weight)
  const height = size / 36
  const width = height * (texture.image.width / texture.image.height)

  return (
    <sprite position={position} scale={[width, height, 1]} renderOrder={60}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        toneMapped={false}
      />
    </sprite>
  )
}

function orbitalOpacity(electrons: number, emphasized: boolean) {
  const base = electrons > 0 ? 0.95 : 0.28
  return emphasized ? base : base * 0.3
}

function SubshellCluster({
  model,
  n,
  letter,
  focus,
  onSelect,
}: {
  model: AtomModel
  n: number
  letter: Letter
  focus: Focus | null
  onSelect: (n: number, letter: Letter) => void
}) {
  const subshell = model.subshells.find(
    (item) => item.n === n && item.letter === letter
  )
  if (!subshell) {
    return null
  }

  const emphasized = isEmphasized(focus, n, letter)
  const active = focus?.n === n && focus.letter === letter
  const y = FLOOR_Y[n] ?? 0
  const count = subshell.orbitals.length
  const padWidth = letter === "f" ? 3.1 : Math.max(1, count * 0.7 + 0.3)
  const padDepth = letter === "f" ? 1.9 : 1.2

  return (
    <group position={[GROUP_X[letter], y, 0]}>
      {active ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <planeGeometry args={[padWidth, padDepth]} />
          <meshBasicMaterial color={LETTER_TINT[letter]} />
        </mesh>
      ) : null}
      <Label
        position={[0, letter === "f" ? 1.25 : 1.1, 0]}
        color={emphasized ? LETTER_INK[letter] : MUTED}
        size={active ? 17 : 13}
      >
        {`${subshell.id}  ${subshell.electrons}/${subshell.capacity}`}
      </Label>
      {subshell.orbitals.map((orbital, index) => (
        <group key={orbital.name} position={orbitalSlot(letter, index, count)}>
          <Orbital
            letter={letter}
            index={index}
            electrons={orbital.electrons}
            opacity={orbitalOpacity(orbital.electrons, emphasized)}
            scale={FLOOR_ORBITAL_SCALE}
            spin={active}
            interactive
            onSelect={() => onSelect(n, letter)}
          />
          {active && (letter === "p" || letter === "d") ? (
            <Label
              position={[0, -0.5, 0.3]}
              size={8}
              color={MUTED}
              weight={500}
            >
              {orbital.name}
            </Label>
          ) : null}
        </group>
      ))}
    </group>
  )
}

export function Floors({
  model,
  focus,
  topShell,
  onSelect,
}: {
  model: AtomModel
  focus: Focus | null
  topShell: number
  onSelect: (n: number, letter: Letter) => void
}) {
  const shown = model.shells.slice(0, visibleFloors(topShell))

  return (
    <group>
      {shown.map((shell) => {
        const empty = shell.electrons === 0
        const emphasized = focus?.n == null || focus.n === shell.n
        const y = FLOOR_Y[shell.n] ?? 0
        const right = FLOOR_RIGHT[shell.n] ?? 6
        const width = right - FLOOR_LEFT
        const fade = empty ? 0.35 : emphasized ? 1 : 0.55

        return (
          <group key={shell.n}>
            <mesh position={[FLOOR_LEFT + width / 2, y - 0.06, 0]}>
              <boxGeometry args={[width, 0.12, FLOOR_DEPTH]} />
              <meshStandardMaterial
                color={emphasized && !empty ? "#ffffff" : "#eef0f4"}
                transparent
                opacity={fade}
                roughness={0.9}
              />
            </mesh>
            <FloorEdges
              width={width}
              y={y}
              color={focus?.n === shell.n ? INK : "#b9c1ce"}
              opacity={fade}
            />
            <Label
              position={[FLOOR_LEFT - 0.85, y + 0.35, 0]}
              color={emphasized && !empty ? INK : MUTED}
              size={17}
            >
              {`Shell ${shell.n}`}
            </Label>
            <Label
              position={[FLOOR_LEFT - 0.85, y - 0.05, 0]}
              color={MUTED}
              size={12}
              weight={500}
            >
              {empty ? "empty" : `${shell.electrons} / ${shell.capacity}`}
            </Label>
            {LETTERS.map((letter) => (
              <SubshellCluster
                key={`${shell.n}${letter}`}
                model={model}
                n={shell.n}
                letter={letter}
                focus={focus}
                onSelect={onSelect}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

function FloorEdges({
  width,
  y,
  color,
  opacity,
}: {
  width: number
  y: number
  color: string
  opacity: number
}) {
  const geometry = useMemo(
    () => new EdgesGeometry(new BoxGeometry(width, 0.12, FLOOR_DEPTH)),
    [width]
  )
  return (
    <lineSegments
      geometry={geometry}
      position={[FLOOR_LEFT + width / 2, y - 0.06, 0]}
    >
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  )
}

function nestedOpacity(
  letter: Letter,
  n: number,
  electrons: number,
  emphasized: boolean
) {
  if (letter === "s") {
    const glass = [0, 0.85, 0.32, 0.2, 0.13][n] ?? 0.13
    const base = electrons > 0 ? glass : glass * 0.6
    return emphasized ? base : base * 0.7
  }

  const base = electrons > 0 ? 0.92 : 0.12
  return emphasized ? base : base * 0.28
}

export function Nested({
  model,
  focus,
}: {
  model: AtomModel
  focus: Focus | null
}) {
  return (
    <group>
      <mesh renderOrder={50}>
        <sphereGeometry args={[0.09, 24, 18]} />
        <meshBasicMaterial color={INK} depthTest={false} />
      </mesh>
      <Label position={[0, 0.3, 0]} size={11} color={MUTED}>
        nucleus
      </Label>
      {model.subshells.map((subshell) => {
        const emphasized = isEmphasized(focus, subshell.n, subshell.letter)
        const shellScale = (SHELL_RADIUS[subshell.n] ?? 1) / 0.72
        const scale = subshell.letter === "s" ? shellScale : shellScale * 0.5
        const opacity = nestedOpacity(
          subshell.letter,
          subshell.n,
          subshell.electrons,
          emphasized
        )

        return (
          <group key={subshell.id}>
            {subshell.letter === "s" ? (
              <Label
                position={[(SHELL_RADIUS[subshell.n] ?? 1) + 0.3, 0.2, 0]}
                color={LETTER_INK.s}
                size={15}
              >
                {`${subshell.n}s`}
              </Label>
            ) : null}
            {subshell.orbitals.map((orbital, index) => {
              const showShape =
                subshell.letter === "s" ||
                subshell.electrons > 0 ||
                (focus != null && emphasized)
              if (!showShape) {
                return null
              }

              return (
                <Orbital
                  key={`${subshell.id}-${orbital.name}`}
                  letter={subshell.letter}
                  index={index}
                  electrons={orbital.electrons}
                  opacity={opacity}
                  scale={scale}
                  depthWrite={subshell.letter === "s" && subshell.n === 1}
                  renderOrder={
                    subshell.letter === "s" ? subshell.n : 10 + subshell.n
                  }
                  doubleSide={subshell.letter === "s"}
                />
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

export function Catalog({
  model,
  focus,
  onSelect,
}: {
  model: AtomModel
  focus: Focus | null
  onSelect: (n: number, letter: Letter) => void
}) {
  const reading =
    focus?.n != null && focus.letter != null
      ? model.subshells.find(
          (item) => item.n === focus.n && item.letter === focus.letter
        )
      : undefined

  return (
    <group>
      {LETTERS.map((letter) => {
        const active = focus?.letter === letter
        const emphasized = focus?.letter == null || active
        const infos = ORBITALS[letter]
        const count = infos.length
        const y = CATALOG_Y[letter]
        const fromModel = model.notation.find((s) => s.letter === letter)
        const target = fromModel ?? { n: LETTERS.indexOf(letter) + 1 }

        return (
          <group key={letter} position={[0, y, 0]}>
            <Label
              position={[0, 1.05, 0]}
              color={emphasized ? LETTER_INK[letter] : MUTED}
              size={active ? 17 : 14}
            >
              {active && reading
                ? `${letter} row · ${reading.id} uses ${count === 1 ? "this shape" : `these ${count} shapes`}`
                : `${letter} row · ${count} shape${count === 1 ? "" : "s"}`}
            </Label>
            {infos.map((info, index) => (
              <group
                key={info.catalog}
                position={[(index - (count - 1) / 2) * CATALOG_GAP, 0, 0]}
              >
                <Orbital
                  letter={letter}
                  index={index}
                  electrons={
                    active && reading
                      ? (reading.orbitals[index]?.electrons ?? 0)
                      : 0
                  }
                  opacity={emphasized ? 0.95 : 0.3}
                  scale={CATALOG_SCALE}
                  spin={active}
                  interactive
                  onSelect={() => onSelect(target.n, letter)}
                />
                <Label
                  position={[0, -0.85, 0]}
                  size={10}
                  color={MUTED}
                  weight={500}
                >
                  {info.catalog}
                </Label>
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}
