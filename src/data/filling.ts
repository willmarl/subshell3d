export const LETTERS = ["s", "p", "d", "f"] as const

export type Letter = (typeof LETTERS)[number]

export const LETTER_COLOR: Record<Letter, string> = {
  s: "#e5484d",
  p: "#e09a2b",
  d: "#3b6cf0",
  f: "#22a35a",
}

export const AUFBAU = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p"] as const

const SYMBOLS = [
  "H",
  "He",
  "Li",
  "Be",
  "B",
  "C",
  "N",
  "O",
  "F",
  "Ne",
  "Na",
  "Mg",
  "Al",
  "Si",
  "P",
  "S",
  "Cl",
  "Ar",
  "K",
  "Ca",
  "Sc",
  "Ti",
  "V",
  "Cr",
  "Mn",
  "Fe",
  "Co",
  "Ni",
  "Cu",
  "Zn",
  "Ga",
  "Ge",
  "As",
  "Se",
  "Br",
  "Kr",
] as const

const NAMES = [
  "Hydrogen",
  "Helium",
  "Lithium",
  "Beryllium",
  "Boron",
  "Carbon",
  "Nitrogen",
  "Oxygen",
  "Fluorine",
  "Neon",
  "Sodium",
  "Magnesium",
  "Aluminium",
  "Silicon",
  "Phosphorus",
  "Sulfur",
  "Chlorine",
  "Argon",
  "Potassium",
  "Calcium",
  "Scandium",
  "Titanium",
  "Vanadium",
  "Chromium",
  "Manganese",
  "Iron",
  "Cobalt",
  "Nickel",
  "Copper",
  "Zinc",
  "Gallium",
  "Germanium",
  "Arsenic",
  "Selenium",
  "Bromine",
  "Krypton",
] as const

export type OrbitalInfo = {
  name: string
  catalog: string
}

export const ORBITALS: Record<Letter, readonly OrbitalInfo[]> = {
  s: [{ name: "s", catalog: "s" }],
  p: [
    { name: "px", catalog: "p₋₁ · px" },
    { name: "pz", catalog: "p₀ · pz" },
    { name: "py", catalog: "p₁ · py" },
  ],
  d: [
    { name: "dxy", catalog: "d₋₂ · dxy" },
    { name: "dyz", catalog: "d₋₁ · dyz" },
    { name: "dz²", catalog: "d₀ · dz²" },
    { name: "dxz", catalog: "d₁ · dxz" },
    { name: "dx²−y²", catalog: "d₂ · dx²−y²" },
  ],
  f: [
    { name: "f₋₃", catalog: "f₋₃" },
    { name: "f₋₂", catalog: "f₋₂" },
    { name: "f₋₁", catalog: "f₋₁" },
    { name: "f₀", catalog: "f₀" },
    { name: "f₁", catalog: "f₁" },
    { name: "f₂", catalog: "f₂" },
    { name: "f₃", catalog: "f₃" },
  ],
}

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹"

export function superscript(value: number) {
  return String(value).replace(
    /\d/g,
    (digit) => SUPERSCRIPTS[Number(digit)] ?? digit
  )
}

export function capacityOf(letter: Letter) {
  return ORBITALS[letter].length * 2
}

export function shellCapacity(n: number) {
  return 2 * n * n
}

export type OrbitalFill = {
  name: string
  catalog: string
  electrons: number
}

export type SubshellFill = {
  id: string
  n: number
  letter: Letter
  electrons: number
  capacity: number
  orbitals: OrbitalFill[]
}

export type ShellFill = {
  n: number
  electrons: number
  capacity: number
}

export type AtomModel = {
  z: number
  symbol: string
  name: string
  subshells: SubshellFill[]
  notation: SubshellFill[]
  shells: ShellFill[]
  exception: string | null
}

function occupancies(electronCount: number, orbitalCount: number) {
  return Array.from({ length: orbitalCount }, (_, index) => {
    const up = index < electronCount ? 1 : 0
    const down = index < electronCount - orbitalCount ? 1 : 0
    return up + down
  })
}

export function fillCounts(z: number) {
  const counts: Record<string, number> = {}
  let remaining = z

  for (const id of AUFBAU) {
    const letter = id[1] as Letter
    const take = Math.min(capacityOf(letter), remaining)
    counts[id] = take
    remaining -= take
  }

  if (z === 24) {
    counts["4s"] = 1
    counts["3d"] = 5
  }

  if (z === 29) {
    counts["4s"] = 1
    counts["3d"] = 10
  }

  return counts
}

export function buildAtom(z: number): AtomModel {
  const clamped = Math.min(36, Math.max(1, Math.round(z)))
  const counts = fillCounts(clamped)
  const subshells: SubshellFill[] = []

  for (let n = 1; n <= 4; n += 1) {
    LETTERS.forEach((letter, letterIndex) => {
      if (letterIndex >= n) {
        return
      }

      const id = `${n}${letter}`
      const electrons = counts[id] ?? 0
      const infos = ORBITALS[letter]
      const filled = occupancies(electrons, infos.length)

      subshells.push({
        id,
        n,
        letter,
        electrons,
        capacity: infos.length * 2,
        orbitals: infos.map((info, index) => ({
          name: info.name,
          catalog: info.catalog,
          electrons: filled[index] ?? 0,
        })),
      })
    })
  }

  const byId = new Map(subshells.map((subshell) => [subshell.id, subshell]))
  const notation = AUFBAU.flatMap((id) => {
    const subshell = byId.get(id)
    return subshell && subshell.electrons > 0 ? [subshell] : []
  })

  const shells = [1, 2, 3, 4].map((n) => ({
    n,
    electrons: subshells
      .filter((subshell) => subshell.n === n)
      .reduce((sum, subshell) => sum + subshell.electrons, 0),
    capacity: shellCapacity(n),
  }))

  let exception: string | null = null
  if (clamped === 24) {
    exception = "Chromium is 4s¹ 3d⁵. One electron from 4s sits in 3d instead."
  } else if (clamped === 29) {
    exception = "Copper is 4s¹ 3d¹⁰. The 3d set is full, and 4s keeps one."
  }

  return {
    z: clamped,
    symbol: SYMBOLS[clamped - 1] ?? "?",
    name: NAMES[clamped - 1] ?? "Unknown",
    subshells,
    notation,
    shells,
    exception,
  }
}
