export const LETTERS = ["s", "p", "d", "f"] as const

export type Letter = (typeof LETTERS)[number]

export const LETTER_COLOR: Record<Letter, string> = {
  s: "#e5484d",
  p: "#e09a2b",
  d: "#3b6cf0",
  f: "#22a35a",
}

export const LETTER_INK: Record<Letter, string> = {
  s: "#c92a32",
  p: "#a8640a",
  d: "#2a55d6",
  f: "#14813f",
}

export const LETTER_TINT: Record<Letter, string> = {
  s: "#fdecec",
  p: "#fdf3e1",
  d: "#e9effe",
  f: "#e5f6ec",
}

export const MAX_Z = 86
export const MAX_SHELL = 6

export const AUFBAU = [
  "1s",
  "2s",
  "2p",
  "3s",
  "3p",
  "4s",
  "3d",
  "4p",
  "5s",
  "4d",
  "5p",
  "6s",
  "4f",
  "5d",
  "6p",
] as const

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
  "Rb",
  "Sr",
  "Y",
  "Zr",
  "Nb",
  "Mo",
  "Tc",
  "Ru",
  "Rh",
  "Pd",
  "Ag",
  "Cd",
  "In",
  "Sn",
  "Sb",
  "Te",
  "I",
  "Xe",
  "Cs",
  "Ba",
  "La",
  "Ce",
  "Pr",
  "Nd",
  "Pm",
  "Sm",
  "Eu",
  "Gd",
  "Tb",
  "Dy",
  "Ho",
  "Er",
  "Tm",
  "Yb",
  "Lu",
  "Hf",
  "Ta",
  "W",
  "Re",
  "Os",
  "Ir",
  "Pt",
  "Au",
  "Hg",
  "Tl",
  "Pb",
  "Bi",
  "Po",
  "At",
  "Rn",
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
  "Rubidium",
  "Strontium",
  "Yttrium",
  "Zirconium",
  "Niobium",
  "Molybdenum",
  "Technetium",
  "Ruthenium",
  "Rhodium",
  "Palladium",
  "Silver",
  "Cadmium",
  "Indium",
  "Tin",
  "Antimony",
  "Tellurium",
  "Iodine",
  "Xenon",
  "Caesium",
  "Barium",
  "Lanthanum",
  "Cerium",
  "Praseodymium",
  "Neodymium",
  "Promethium",
  "Samarium",
  "Europium",
  "Gadolinium",
  "Terbium",
  "Dysprosium",
  "Holmium",
  "Erbium",
  "Thulium",
  "Ytterbium",
  "Lutetium",
  "Hafnium",
  "Tantalum",
  "Tungsten",
  "Rhenium",
  "Osmium",
  "Iridium",
  "Platinum",
  "Gold",
  "Mercury",
  "Thallium",
  "Lead",
  "Bismuth",
  "Polonium",
  "Astatine",
  "Radon",
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
  return LETTERS.slice(0, Math.min(n, LETTERS.length)).reduce(
    (sum, letter) => sum + capacityOf(letter),
    0
  )
}

const EXCEPTIONS: Record<
  number,
  { counts: Record<string, number>; note: string }
> = {
  24: {
    counts: { "4s": 1, "3d": 5 },
    note: "Chromium is 4s¹ 3d⁵. One electron from 4s sits in 3d instead.",
  },
  29: {
    counts: { "4s": 1, "3d": 10 },
    note: "Copper is 4s¹ 3d¹⁰. The 3d set is full, and 4s keeps one.",
  },
  41: {
    counts: { "5s": 1, "4d": 4 },
    note: "Niobium is 5s¹ 4d⁴. One electron from 5s sits in 4d instead.",
  },
  42: {
    counts: { "5s": 1, "4d": 5 },
    note: "Molybdenum is 5s¹ 4d⁵. One electron from 5s sits in 4d instead.",
  },
  44: {
    counts: { "5s": 1, "4d": 7 },
    note: "Ruthenium is 5s¹ 4d⁷. One electron from 5s sits in 4d instead.",
  },
  45: {
    counts: { "5s": 1, "4d": 8 },
    note: "Rhodium is 5s¹ 4d⁸. One electron from 5s sits in 4d instead.",
  },
  46: {
    counts: { "5s": 0, "4d": 10 },
    note: "Palladium is 4d¹⁰. Both 5s electrons sit in 4d, so 5s is empty. The green 4f seats are still empty too.",
  },
  47: {
    counts: { "5s": 1, "4d": 10 },
    note: "Silver is 5s¹ 4d¹⁰. The 4d set is full, and 5s keeps one.",
  },
  57: {
    counts: { "4f": 0, "5d": 1 },
    note: "Lanthanum is 6s² 5d¹. Its extra electron sits in 5d, and 4f is still empty.",
  },
  58: {
    counts: { "4f": 1, "5d": 1 },
    note: "Cerium is 6s² 4f¹ 5d¹. Green 4f starts here, with one electron also in 5d.",
  },
  64: {
    counts: { "4f": 7, "5d": 1 },
    note: "Gadolinium is 6s² 4f⁷ 5d¹. One electron sits in 5d so 4f can stay half full.",
  },
  78: {
    counts: { "6s": 1, "5d": 9 },
    note: "Platinum is 6s¹ 5d⁹. One electron from 6s sits in 5d instead.",
  },
  79: {
    counts: { "6s": 1, "5d": 10 },
    note: "Gold is 6s¹ 5d¹⁰. The 5d set is full, and 6s keeps one.",
  },
}

export function exceptionFor(z: number) {
  return EXCEPTIONS[z] ?? null
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
    const letter = id.slice(1) as Letter
    const take = Math.min(capacityOf(letter), remaining)
    counts[id] = take
    remaining -= take
  }

  const exception = EXCEPTIONS[z]
  if (exception) {
    Object.assign(counts, exception.counts)
  }

  return counts
}

export function buildAtom(z: number): AtomModel {
  const clamped = Math.min(MAX_Z, Math.max(1, Math.round(z)))
  const counts = fillCounts(clamped)
  const subshells: SubshellFill[] = []

  for (let n = 1; n <= MAX_SHELL; n += 1) {
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

  const shells = Array.from({ length: MAX_SHELL }, (_, index) => index + 1).map(
    (n) => ({
      n,
      electrons: subshells
        .filter((subshell) => subshell.n === n)
        .reduce((sum, subshell) => sum + subshell.electrons, 0),
      capacity: shellCapacity(n),
    })
  )

  const exception = EXCEPTIONS[clamped]?.note ?? null

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
