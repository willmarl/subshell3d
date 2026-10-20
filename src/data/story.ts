import type { Letter } from "@/data/filling"

export type ViewMode = "floors" | "nested" | "catalog"

export type Focus = {
  n?: number
  letter?: Letter
}

export type StoryStep = {
  title: string
  body: string
  z: number
  view: ViewMode
  focus: Focus | null
}

export const STORY: StoryStep[] = [
  {
    title: "Read 2p²",
    body: "The 2 is the shell, p is the shape, and ² is how many electrons are in it.",
    z: 6,
    view: "floors",
    focus: { n: 2, letter: "p" },
  },
  {
    title: "That picture is a shape chart",
    body: "The yellow row is the p shape, drawn once. It is not shell 2. The rows hold 1, 3, 5, and 7 blobs.",
    z: 6,
    view: "catalog",
    focus: { letter: "p" },
  },
  {
    title: "Shell 2 has an s",
    body: "2s² is the red sphere on floor 2, beside the three dumbbells. Same shape as 1s, one floor up.",
    z: 6,
    view: "floors",
    focus: { n: 2 },
  },
  {
    title: "Each blob holds 2",
    body: "s has 1 blob, so 2 electrons. p has 3, so 6. d has 5, so 10. f has 7, so 14.",
    z: 6,
    view: "floors",
    focus: null,
  },
  {
    title: "Floor 2 holds 8",
    body: "2 + 6 = 8, and both numbers belong to shell 2. The 6 is only the p part of that floor.",
    z: 6,
    view: "floors",
    focus: { n: 2 },
  },
  {
    title: "Carbon",
    body: "1s² 2s² 2p² is six electrons. The two 2p electrons sit in different dumbbells, one each, before pairing.",
    z: 6,
    view: "floors",
    focus: { n: 2, letter: "p" },
  },
  {
    title: "4s fills before 3d",
    body: "Scandium already has two electrons in 4s, on the top floor, and one electron in 3d on the floor below. Drag back to 19 and 20: 4s fills while 3d is still empty.",
    z: 21,
    view: "floors",
    focus: null,
  },
]

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

export const VIEW_COPY: Record<ViewMode, string> = {
  floors:
    "Each floor is one shell. The letter says which shapes sit on that floor.",
  nested:
    "2s is the same sphere as 1s, only larger. The chart drew that ball once.",
  catalog:
    "These rows are shapes, not shells. Shell 2 uses the red sphere and the yellow dumbbells together.",
}
