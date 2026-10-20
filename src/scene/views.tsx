import { CanvasTexture } from "three"
import {
  LETTERS,
  LETTER_COLOR,
  ORBITALS,
  type AtomModel,
  type Letter,
} from "@/data/filling"
import { isEmphasized, type Focus } from "@/data/story"
import {
  CATALOG_GAP,
  CATALOG_SCALE,
  CATALOG_Y,
  FLOOR_CENTER_X,
  FLOOR_ORBITAL_SCALE,
  FLOOR_RADIUS,
  FLOOR_Y,
  GROUP_X,
  SHELL_RADIUS,
  orbitalSlot,
} from "@/scene/layout"
import { Orbital } from "@/scene/orbitals"

const labelTextures = new Map<string, CanvasTexture>()

function labelTexture(text: string, color: string) {
  const key = `${color}|${text}`
  const cached = labelTextures.get(key)
  if (cached) {
    return cached
  }

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not draw a label")
  }

  const font = "600 36px Inter Variable, sans-serif"
  context.font = font
  const width = Math.ceil(context.measureText(text).width + 32)
  canvas.width = Math.max(width, 64)
  canvas.height = 72
  context.font = font
  context.fillStyle = color
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  labelTextures.set(key, texture)
  return texture
}

function Label({
  position,
  children,
  color = "#d5dbe6",
  size = 12,
}: {
  position: [number, number, number]
  children: string
  color?: string
  size?: number
}) {
  const texture = labelTexture(children, color)
  const height = size / 40
  const width = height * (texture.image.width / texture.image.height)

  return (
    <sprite position={position} scale={[width, height, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        toneMapped={false}
      />
    </sprite>
  )
}

function floorOpacity(electrons: number, emphasized: boolean) {
  const base = electrons > 0 ? 0.94 : 0.22
  return emphasized ? base : base * 0.32
}

function SubshellCluster({
  model,
  n,
  letter,
  focus,
  onFocus,
}: {
  model: AtomModel
  n: number
  letter: Letter
  focus: Focus | null
  onFocus: (focus: Focus) => void
}) {
  const subshell = model.subshells.find(
    (item) => item.n === n && item.letter === letter
  )
  const emphasized = isEmphasized(focus, n, letter)
  const y = FLOOR_Y[n] ?? 0

  if (!subshell) {
    return (
      <Label
        position={[GROUP_X[letter], y + 0.45, 0]}
        color="#8b95a8"
      >{`no ${n}${letter}`}</Label>
    )
  }

  return (
    <group position={[GROUP_X[letter], y, 0]}>
      <Label
        position={[0, 1.15, 0]}
        color={emphasized ? LETTER_COLOR[letter] : "#8b95a8"}
        size={15}
      >
        {`${subshell.id}  ${subshell.electrons}/${subshell.capacity}${letter === "f" ? " · simplified" : ""}`}
      </Label>
      {subshell.orbitals.map((orbital, index) => (
        <group
          key={orbital.name}
          position={orbitalSlot(letter, index, subshell.orbitals.length)}
        >
          <Orbital
            letter={letter}
            index={index}
            electrons={orbital.electrons}
            opacity={floorOpacity(orbital.electrons, emphasized)}
            scale={FLOOR_ORBITAL_SCALE}
            interactive
            onSelect={() => onFocus({ n, letter })}
          />
          {letter === "p" || letter === "d" ? (
            <Label position={[0, -0.58, 0]} size={11}>
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
  onFocus,
}: {
  model: AtomModel
  focus: Focus | null
  onFocus: (focus: Focus) => void
}) {
  return (
    <group>
      {model.shells.map((shell) => {
        const emphasized = focus?.n == null || focus.n === shell.n
        const y = FLOOR_Y[shell.n] ?? 0
        return (
          <group key={shell.n}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[FLOOR_CENTER_X, y, 0]}
            >
              <circleGeometry args={[FLOOR_RADIUS, 80]} />
              <meshStandardMaterial
                color={emphasized ? "#161d29" : "#10151d"}
                roughness={1}
                metalness={0}
              />
            </mesh>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[FLOOR_CENTER_X, y + 0.015, 0]}
            >
              <ringGeometry args={[FLOOR_RADIUS - 0.28, FLOOR_RADIUS, 80]} />
              <meshBasicMaterial
                color={emphasized ? "#d5deea" : "#2a3444"}
                transparent
                opacity={emphasized ? 0.85 : 0.45}
              />
            </mesh>
            <Label
              position={[FLOOR_CENTER_X - FLOOR_RADIUS + 0.15, y + 0.85, 0]}
              color={emphasized ? "#f2f5f8" : "#8b95a8"}
              size={18}
            >
              {`Shell ${shell.n}`}
            </Label>
            <Label
              position={[FLOOR_CENTER_X + FLOOR_RADIUS - 0.15, y + 0.85, 0]}
              size={16}
            >
              {`${shell.electrons} / ${shell.capacity}`}
            </Label>
            {LETTERS.map((letter) => (
              <SubshellCluster
                key={`${shell.n}${letter}`}
                model={model}
                n={shell.n}
                letter={letter}
                focus={focus}
                onFocus={onFocus}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

function nestedOpacity(
  letter: Letter,
  n: number,
  electrons: number,
  emphasized: boolean
) {
  if (letter === "s") {
    const glass = [0, 0.88, 0.36, 0.22, 0.14][n] ?? 0.14
    const base = electrons > 0 ? glass : glass * 0.6
    return emphasized ? base : base * 0.8
  }

  const base = electrons > 0 ? 0.92 : 0.1
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
        <meshBasicMaterial color="#fff6df" depthTest={false} />
      </mesh>
      <Label position={[0, 0.28, 0]} size={12}>
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
                position={[(SHELL_RADIUS[subshell.n] ?? 1) + 0.25, 0.18, 0]}
                color={LETTER_COLOR.s}
                size={14}
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
  focus,
  onFocus,
}: {
  focus: Focus | null
  onFocus: (focus: Focus) => void
}) {
  return (
    <group>
      {LETTERS.map((letter) => {
        const emphasized = focus?.letter == null || focus.letter === letter
        const infos = ORBITALS[letter]
        const count = infos.length
        const y = CATALOG_Y[letter]

        return (
          <group key={letter} position={[0, y, 0]}>
            <Label
              position={[-4.6, 0.35, 0]}
              color={LETTER_COLOR[letter]}
              size={15}
            >
              {letter === "f" ? "f shape · simplified" : `${letter} shape`}
            </Label>
            {infos.map((info, index) => (
              <group
                key={info.catalog}
                position={[(index - (count - 1) / 2) * CATALOG_GAP, 0, 0]}
              >
                <Orbital
                  letter={letter}
                  index={index}
                  electrons={0}
                  opacity={emphasized ? 0.96 : 0.4}
                  scale={CATALOG_SCALE}
                  interactive
                  onSelect={() => onFocus({ letter })}
                />
                <Label position={[0, -0.95, 0]} size={12}>
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
