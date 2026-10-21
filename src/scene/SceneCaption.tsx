import { LETTER_INK, ORBITALS, type AtomModel } from "@/data/filling"
import type { Focus, ViewMode } from "@/data/story"

function captionFor(model: AtomModel, view: ViewMode, focus: Focus | null) {
  const subshell =
    focus?.n != null && focus.letter != null
      ? model.subshells.find(
          (item) => item.n === focus.n && item.letter === focus.letter
        )
      : undefined

  if (view === "catalog") {
    const letter = focus?.letter
    if (!letter) {
      return "Each row is one letter's shapes, drawn once. Rows are not shells."
    }
    const count = ORBITALS[letter].length
    const users = [1, 2, 3, 4]
      .filter((n) => "spdf".indexOf(letter) < n)
      .map((n) => `${n}${letter}`)
    const reusedBy =
      users.length === 1
        ? `Only ${users[0]} uses ${count === 1 ? "it" : "them"}`
        : `${users.slice(0, -1).join(", ")} and ${users.at(-1)} all reuse ${count === 1 ? "it" : "them"}`
    const dots = subshell
      ? ` The dark dots are ${subshell.id}'s ${subshell.electrons} electron${subshell.electrons === 1 ? "" : "s"}.`
      : ""
    return `The ${letter} row is a shape, not a shell: ${count} blob${count === 1 ? "" : "s"}. ${reusedBy}.${dots}`
  }

  if (view === "nested") {
    if (focus?.letter === "s" && focus.n) {
      return `${focus.n}s is the same ball as 1s, scaled up. The bigger the shell number, the bigger the sphere.`
    }
    return "Shells really sit around each other. 2s wraps 1s, 3s wraps 2s, and the other shapes sit inside."
  }

  if (focus?.n != null && focus.letter == null) {
    const shell = model.shells.find((item) => item.n === focus.n)
    if (shell) {
      return `Floor ${shell.n} is shell ${shell.n}. Its ${shell.capacity} seats come from its own subshells, and ${shell.electrons} of them are filled.`
    }
  }

  if (subshell) {
    const count = subshell.orbitals.length
    return `Floor ${subshell.n} is shell ${subshell.n}. Its ${count} ${subshell.letter} blob${count === 1 ? "" : "s"} hold ${subshell.electrons} of ${subshell.capacity} electrons.`
  }

  return "Each floor is one shell. Dark dots are electrons, empty blobs are open seats."
}

export function SceneCaption({
  model,
  view,
  focus,
}: {
  model: AtomModel
  view: ViewMode
  focus: Focus | null
}) {
  const color = focus?.letter ? LETTER_INK[focus.letter] : "#1c2230"
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-1">
      <p
        className="max-w-xl rounded-xl border bg-white/92 px-4 py-2 text-center text-[15px] leading-snug text-[#1c2230] shadow-sm backdrop-blur"
        style={{ borderColor: color }}
      >
        {captionFor(model, view, focus)}
      </p>
      <p className="text-[11px] text-[#6b7385]">
        Two colors on one blob are the wave&rsquo;s sign, not two electrons ·
        drag to rotate · scroll to zoom
      </p>
    </div>
  )
}
