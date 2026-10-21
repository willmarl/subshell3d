import {
  LETTERS,
  ORBITALS,
  exceptionFor,
  superscript,
  type AtomModel,
  type Letter,
  type SubshellFill,
} from "@/data/filling"

export type ViewMode = "floors" | "nested" | "catalog"

export type Focus = {
  n?: number
  letter?: Letter
}

export type StepKind = "split" | "chunk" | "sum" | "shells" | "chart"

export type GuideStep = {
  key: string
  kind: StepKind
  title: string
  focus: Focus | null
  view?: ViewMode
  chunk?: SubshellFill
}

export function chunkKey(id: string) {
  return `chunk-${id}`
}

export function buildGuide(model: AtomModel): GuideStep[] {
  const last = model.notation.at(-1)
  const chunks: GuideStep[] = model.notation.map((subshell, index) => ({
    key: chunkKey(subshell.id),
    kind: "chunk",
    title: `Chunk ${index + 1}: ${subshell.id}${superscript(subshell.electrons)}`,
    focus: { n: subshell.n, letter: subshell.letter },
    chunk: subshell,
  }))

  return [
    {
      key: "split",
      kind: "split",
      title: "Split it into chunks",
      focus: null,
    },
    ...chunks,
    {
      key: "sum",
      kind: "sum",
      title: "Add the small numbers",
      focus: null,
    },
    {
      key: "shells",
      kind: "shells",
      title: "Group by the big number",
      focus: null,
    },
    {
      key: "chart",
      kind: "chart",
      title: "Why your picture looked different",
      focus: last ? { letter: last.letter } : null,
      view: "catalog",
    },
  ]
}

export function lockedSet(z: number, n: number, letter: Letter) {
  if (n === 3 && letter === "d" && z >= 11 && z <= 19) {
    return "Locked until calcium. The blue seats on floor 3 open once 4s is full."
  }
  if (n === 4 && letter === "d" && z >= 29 && z <= 37) {
    return "Locked until strontium. The blue seats on floor 4 open once 5s is full."
  }
  if (n === 4 && letter === "f" && z >= 29 && z <= 56) {
    return "Locked until lanthanum. The green seats on floor 4 open once 6s is full."
  }
  return null
}

export function chunkNotes(model: AtomModel, subshell: SubshellFill) {
  const { n, letter, electrons, capacity } = subshell
  const blobs = ORBITALS[letter].length
  const notes: string[] = []
  const lock = lockedSet(model.z, n, letter)
  if (lock) {
    notes.push(lock)
  }

  if (letter === "s" && n === 1) {
    notes.push("Shell 1 only has an s. There is no 1p, 1d or 1f.")
  } else if (letter === "s") {
    notes.push(
      `${n}s is the same sphere as 1s, only bigger. Shape charts draw that ball once, but every shell has its own.`
    )
  }

  if (electrons === 0) {
    notes.push(
      `${model.name} has nothing here yet. The ${blobs} ${blobs === 1 ? "blob is" : "blobs are"} empty seats.`
    )
  } else if (electrons === capacity) {
    notes.push(`Full: all ${capacity} seats are taken.`)
  } else {
    notes.push(
      `Partly full: ${electrons} of ${capacity} seats are taken, ${capacity - electrons} still open.`
    )
  }

  if (blobs > 1 && electrons > 1) {
    notes.push(
      electrons <= blobs
        ? `Electrons spread out one per blob before any pair up, so these ${electrons} each get their own.`
        : `Each of the ${blobs} blobs got one electron first, then ${electrons - blobs} of them paired up.`
    )
  }

  const has3d = model.subshells.some((s) => s.id === "3d" && s.electrons > 0)
  if (subshell.id === "4s" && model.z >= 19) {
    notes.push(
      "4s is written before 3d because it fills first. It costs less energy, even though it's on floor 4."
    )
  }
  if (subshell.id === "3d" && has3d) {
    notes.push(
      "3d is on floor 3, but it only starts filling after 4s. That's why it comes after 4s in the notation."
    )
  }
  if (subshell.id === "5s" && electrons > 0) {
    notes.push(
      "5s fills right after krypton, before the blue 4d seats and long before the green 4f seats."
    )
  }
  if (subshell.id === "4d" && electrons > 0) {
    notes.push(
      "Blue on floor 4 fills after 5s and before 5p. Green 4f stays empty through this whole stretch, including element 46."
    )
  }
  if (subshell.id === "4f" && electrons === 0 && model.z >= 37 && !lock) {
    notes.push(
      "Green stays empty here. It does not fill at 46. That element is filling blue 4d. Green starts at cerium, 58, after 6s."
    )
  }
  if (subshell.id === "4f" && electrons > 0) {
    notes.push(
      "Green on floor 4 fills after 6s. Floor 5's red and orange are already full by then. Its blue seats, 5d, come after green."
    )
  }
  if (subshell.id === "6s" && electrons > 0) {
    notes.push(
      "6s fills before 4f. The red seat on floor 6 is cheaper than the green seats on floor 4."
    )
  }
  if (subshell.id === "5d" && electrons > 0 && model.z >= 71) {
    notes.push("Blue on floor 5 fills after the green 4f set is full.")
  }
  if (model.exception && exceptionFor(model.z)?.counts[subshell.id] != null) {
    notes.push(model.exception)
  }

  return notes
}

export function shellParts(n: number) {
  return LETTERS.slice(0, n).map((letter) => `${n}${letter}`)
}

export function isEmphasized(focus: Focus | null, n: number, letter: Letter) {
  if (!focus) {
    return true
  }

  if (focus.n != null && focus.n !== n) {
    return false
  }

  if (focus.letter != null && focus.letter !== letter) {
    return false
  }

  return true
}

export const VIEW_LABEL: Record<ViewMode, string> = {
  floors: "Floors",
  nested: "Nested",
  catalog: "Shape chart",
}
