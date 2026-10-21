import {
  LETTERS,
  capacityOf,
  shellCapacity,
  superscript,
  type AtomModel,
  type Letter,
} from "@/data/filling"
import type { Focus } from "@/data/story"

export type PracticeKind = "read" | "place" | "floor"

export type PracticeChoice = {
  id: string
  label: string
  correct: boolean
  why: string
}

export type PracticeQuestion = {
  id: string
  kind: PracticeKind
  title: string
  prompt: string
  focus: Focus
  why: string
  chunkLabel?: string
  letter?: Letter
  choices?: PracticeChoice[]
  answer?: { n: number; letter: Letter }
}

function rotate<T>(items: T[], by: number) {
  const shift = ((by % items.length) + items.length) % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

function readQuestion(model: AtomModel, id: string): PracticeQuestion | null {
  const subshell = model.notation.find((item) => item.id === id)
  if (!subshell) {
    return null
  }

  const { n, letter, electrons, capacity } = subshell
  const shell = model.shells.find((item) => item.n === n)
  const letterIndex = LETTERS.indexOf(letter)
  const shapeTrap =
    letter === "s" && n === 1
      ? {
          id: "row",
          correct: false,
          label: "The picture's red row is shell 1",
          why: "The red row is the s shape, drawn once. 1s is that shape on floor 1.",
        }
      : letter === "s"
        ? {
            id: "shape",
            correct: false,
            label: `${n}s is a new shape, not the same ball as 1s`,
            why: `${n}s is the same sphere as 1s, on floor ${n}. The picture draws that ball once.`,
          }
        : {
            id: "sublayer",
            correct: false,
            label: `${letter} means sublayer ${letterIndex + 1} of floor ${n}`,
            why: `${letter} is a shape, not sublayer ${letterIndex + 1}. The shapes are s, p, d, and f.`,
          }
  const countTrap =
    shell != null && shell.electrons !== electrons
      ? {
          id: "whole-floor",
          correct: false,
          label: `${electrons} is every electron on floor ${n}`,
          why: `Floor ${n} has ${shell.electrons} electrons here. ${electrons} is only the ${subshell.id} part.`,
        }
      : {
          id: "blobs",
          correct: false,
          label: `${electrons} counts blobs, not electrons`,
          why: `The small number is electrons. ${letter} has ${capacity / 2} ${capacity === 2 ? "blob" : "blobs"}, and each holds 2.`,
        }

  const choices = rotate(
    [
      {
        id: "seats",
        correct: true,
        label: `Floor ${n}, ${letter} shape, ${electrons} of ${capacity} seats`,
        why: "",
      },
      shapeTrap,
      countTrap,
    ],
    n + letterIndex
  )

  return {
    id: `read-${subshell.id}`,
    kind: "read",
    title: "Read it",
    prompt: "What does this chunk say?",
    chunkLabel: `${subshell.id}${superscript(electrons)}`,
    letter,
    focus: { n, letter },
    why: `${n} is the floor, ${letter} is the shape, and ${electrons} is how many electrons are in it. That shape has ${capacity} seats.`,
    choices,
  }
}

function placeQuestion(id: string, model: AtomModel): PracticeQuestion | null {
  const subshell = model.notation.find((item) => item.id === id)
  if (!subshell) {
    return null
  }

  const { n, letter, electrons } = subshell
  return {
    id: `place-${subshell.id}`,
    kind: "place",
    title: "Put it on a floor",
    prompt: "Where do these electrons sit? Click that cell in the grid.",
    chunkLabel: `${subshell.id}${superscript(electrons)}`,
    letter,
    focus: { n, letter },
    answer: { n, letter },
    why: `${subshell.id} is floor ${n}, ${letter} column. The ${letter} row of a shape chart is the shape, not the floor.`,
  }
}

function floorQuestion(n: number): PracticeQuestion {
  const letters = LETTERS.slice(0, n)
  const parts = letters.map((letter) => `${n}${letter}`)
  const caps = letters.map((letter) => capacityOf(letter))
  const total = shellCapacity(n)
  const lastLetter = letters[letters.length - 1] ?? "s"
  const lastCap = caps[caps.length - 1] ?? 2
  let through = 0
  for (let shell = 1; shell <= n; shell += 1) {
    through += shellCapacity(shell)
  }

  const choices = rotate(
    [
      {
        id: "own",
        correct: true,
        label: `${parts.join(" + ")} = ${caps.join(" + ")} = ${total}`,
        why: "",
      },
      {
        id: "part",
        correct: false,
        label: `${lastCap}, only the ${lastLetter} part`,
        why: `${lastCap} is only the ${lastLetter} part of shell ${n}. The floor also has ${parts.slice(0, -1).join(" and ")}.`,
      },
      {
        id: "running",
        correct: false,
        label: `${through}, shells 1 through ${n} added together`,
        why: `${through} piles whole shells on top of each other. Shell ${n} by itself is ${total}.`,
      },
    ],
    n
  )

  return {
    id: `floor-${n}`,
    kind: "floor",
    title: "How full is the floor?",
    prompt: `How many electrons can shell ${n} hold?`,
    focus: { n },
    why: `Shell ${n} is its own subshells, ${parts.join(" + ")}. That is ${caps.join(" + ")} = ${total}.`,
    choices,
  }
}

export function buildPractice(model: AtomModel): PracticeQuestion[] {
  const questions: PracticeQuestion[] = []

  for (const subshell of model.notation) {
    const read = readQuestion(model, subshell.id)
    const place = placeQuestion(subshell.id, model)
    if (read) {
      questions.push(read)
    }
    if (place) {
      questions.push(place)
    }
  }

  for (const shell of model.shells) {
    if (shell.n >= 2 && shell.electrons > 0) {
      questions.push(floorQuestion(shell.n))
    }
  }

  return questions
}

export function openingQuestion(questions: PracticeQuestion[]) {
  for (let index = questions.length - 1; index >= 0; index -= 1) {
    if (questions[index]?.kind === "read") {
      return questions[index]
    }
  }
  return questions[0]!
}

export function questionAfter(
  questions: PracticeQuestion[],
  id: string | null
) {
  const index = questions.findIndex((question) => question.id === id)
  return questions[(index + 1) % questions.length] ?? questions[0]!
}

export function explainPlace(
  question: PracticeQuestion,
  picked: { n: number; letter: Letter }
) {
  const answer = question.answer
  if (!answer) {
    return question.why
  }
  if (picked.n === answer.n && picked.letter === answer.letter) {
    return question.why
  }
  if (picked.letter === answer.letter) {
    return `Same ${answer.letter} shape, wrong floor. You clicked ${picked.n}${picked.letter}. It sits on floor ${answer.n}.`
  }
  if (picked.n === answer.n) {
    return `Right floor, wrong shape. You clicked ${picked.n}${picked.letter}. This chunk is the ${answer.letter} group on that floor.`
  }
  return `You clicked ${picked.n}${picked.letter}. ${answer.n}${answer.letter} is floor ${answer.n}, ${answer.letter} column.`
}
