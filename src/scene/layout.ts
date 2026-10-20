import type { Letter } from "@/data/filling"
import type { Focus, ViewMode } from "@/data/story"

export const FLOOR_Y = [0, 0, 3.5, 7, 10.5]

export const GROUP_X: Record<Letter, number> = {
  s: -3.15,
  p: -1.75,
  d: 1.4,
  f: 4.4,
}

export const FLOOR_CENTER_X = 1.05
export const ORBITAL_GAP = 0.7
export const FLOOR_ORBITAL_SCALE = 0.36
export const FLOOR_RADIUS = 5.05

export const CATALOG_Y: Record<Letter, number> = {
  s: 3.55,
  p: 1.2,
  d: -1.35,
  f: -4.05,
}

export const CATALOG_SCALE = 0.58
export const CATALOG_GAP = 1.38

export const SHELL_RADIUS = [0, 0.72, 1.5, 2.35, 3.25]

export function orbitalSlot(
  letter: Letter,
  index: number,
  count: number
): [number, number, number] {
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

export function cameraGoal(view: ViewMode, focus: Focus | null) {
  if (view === "catalog") {
    if (focus?.letter) {
      const y = CATALOG_Y[focus.letter]
      const distance = focus.letter === "f" ? 15 : 13
      return {
        position: [0, y + 0.1, distance] as [number, number, number],
        target: [0, y, 0] as [number, number, number],
      }
    }

    return {
      position: [0, -0.2, 15] as [number, number, number],
      target: [0, -0.25, 0] as [number, number, number],
    }
  }

  if (view === "nested") {
    const radius = focus?.n ? SHELL_RADIUS[focus.n] : 3.6
    const distance = Math.max(6.2, radius * 3)
    return {
      position: [distance * 0.55, distance * 0.38, distance] as [
        number,
        number,
        number,
      ],
      target: [-0.8, 0, 0] as [number, number, number],
    }
  }

  if (focus?.n && focus.letter) {
    const x = GROUP_X[focus.letter]
    const y = FLOOR_Y[focus.n] ?? 0
    return {
      position: [x - 0.8, y + 2.4, 5.6] as [number, number, number],
      target: [x - 1.5, y + 0.4, 0] as [number, number, number],
    }
  }

  if (focus?.n) {
    const y = FLOOR_Y[focus.n] ?? 0
    return {
      position: [FLOOR_CENTER_X - 0.4, y + 4.2, 8.4] as [
        number,
        number,
        number,
      ],
      target: [FLOOR_CENTER_X - 1.6, y + 0.3, 0] as [number, number, number],
    }
  }

  return {
    position: [0.2, 16.5, 15.5] as [number, number, number],
    target: [-1.6, 5.2, 0] as [number, number, number],
  }
}
