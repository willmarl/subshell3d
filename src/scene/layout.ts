import { MAX_SHELL, type Letter } from "@/data/filling"
import type { Focus, ViewMode } from "@/data/story"

type Vec3 = [number, number, number]

export const FLOOR_Y = [0, 0, 2.3, 4.6, 6.9, 9.2, 11.5]

export const GROUP_X: Record<Letter, number> = {
  s: -3.2,
  p: -1.6,
  d: 1.25,
  f: 4.55,
}

export const FLOOR_LEFT = -4.1
export const FLOOR_RIGHT = [0, -2.35, -0.55, 3.15, 6.15, 6.15, 6.15]
export const FLOOR_DEPTH = 2.6
export const ORBITAL_GAP = 0.7
export const FLOOR_ORBITAL_SCALE = 0.36

export const CATALOG_Y: Record<Letter, number> = {
  s: 3.55,
  p: 1.2,
  d: -1.35,
  f: -4.05,
}

export const CATALOG_SCALE = 0.58
export const CATALOG_GAP = 1.38

export const SHELL_RADIUS = [0, 0.72, 1.5, 2.35, 3.25, 4.2, 5.2]

export function visibleFloors(topShell: number) {
  return Math.min(MAX_SHELL, Math.max(1, topShell) + 1)
}

export function orbitalSlot(
  letter: Letter,
  index: number,
  count: number
): Vec3 {
  if (letter === "f") {
    const row = index < 4 ? 0 : 1
    const rowCount = row === 0 ? 4 : 3
    const rowIndex = row === 0 ? index : index - 4
    return [
      (rowIndex - (rowCount - 1) / 2) * ORBITAL_GAP,
      0.42,
      row === 0 ? -0.42 : 0.42,
    ]
  }

  return [(index - (count - 1) / 2) * ORBITAL_GAP, 0.42, 0]
}

export const CAMERA_FOV = 40
const HALF_FOV_TAN = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180)

function fitDistance(halfWidth: number, halfHeight: number, aspect: number) {
  return Math.max(
    halfWidth / (HALF_FOV_TAN * aspect),
    halfHeight / HALF_FOV_TAN
  )
}

function frame(
  left: number,
  right: number,
  bottom: number,
  top: number,
  aspect: number,
  tilt = 0.55
) {
  const distance = Math.max(
    5.5,
    fitDistance((right - left) / 2 + 0.4, (top - bottom) / 2 + 1.6, aspect)
  )
  const cx = (left + right) / 2
  const cy = (bottom + top) / 2
  return {
    position: [cx, cy + distance * tilt, distance] as Vec3,
    target: [cx, cy, 0] as Vec3,
  }
}

function catalogHalfWidth(letter: Letter) {
  return ((ORBITAL_COUNT[letter] - 1) * CATALOG_GAP) / 2 + 0.9
}

const ORBITAL_COUNT: Record<Letter, number> = { s: 1, p: 3, d: 5, f: 7 }

export function cameraGoal(
  view: ViewMode,
  focus: Focus | null,
  topShell: number,
  aspect: number
) {
  if (view === "catalog") {
    if (focus?.letter) {
      const y = CATALOG_Y[focus.letter]
      const distance = Math.max(
        9,
        fitDistance(catalogHalfWidth(focus.letter), 2.4, aspect)
      )
      return {
        position: [0, y + 0.8, distance] as Vec3,
        target: [0, y + 0.1, 0] as Vec3,
      }
    }

    const distance = fitDistance(catalogHalfWidth("f"), 5.4, aspect)
    return {
      position: [0, 0, distance] as Vec3,
      target: [0, 0, 0] as Vec3,
    }
  }

  if (view === "nested") {
    const radius = focus?.n
      ? (SHELL_RADIUS[focus.n] ?? 3.25)
      : (SHELL_RADIUS[topShell] ?? 3.25)
    const distance = Math.max(
      4.5,
      fitDistance(radius + 0.6, radius + 0.6, aspect)
    )
    return {
      position: [distance * 0.45, distance * 0.3, distance * 0.85] as Vec3,
      target: [0, 0, 0] as Vec3,
    }
  }

  if (focus?.n && focus.letter) {
    const x = GROUP_X[focus.letter]
    const y = FLOOR_Y[focus.n] ?? 0
    const halfWidth = { s: 1.3, p: 1.7, d: 2.2, f: 2.3 }[focus.letter]
    const distance = Math.max(4.6, fitDistance(halfWidth, 1.6, aspect))
    return {
      position: [x * 0.7, y + distance * 0.45, distance] as Vec3,
      target: [x * 0.85, y + 0.4, 0] as Vec3,
    }
  }

  const labelLeft = FLOOR_LEFT - 1.8
  if (focus?.n) {
    const y = FLOOR_Y[focus.n] ?? 0
    return frame(labelLeft, FLOOR_RIGHT[focus.n] ?? 6, y, y + 1, aspect, 0.7)
  }

  const floors = visibleFloors(topShell)
  return frame(
    labelLeft,
    FLOOR_RIGHT[floors] ?? 6,
    0,
    (FLOOR_Y[floors] ?? 0) + 1,
    aspect
  )
}
