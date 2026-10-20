import {
  LETTERS,
  ORBITALS,
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

export function chunkNotes(model: AtomModel, subshell: SubshellFill) {
  const { n, letter, electrons, capacity } = subshell
  const blobs = ORBITALS[letter].length
  const notes: string[] = []

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
  if (model.exception && (subshell.id === "4s" || subshell.id === "3d")) {
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
