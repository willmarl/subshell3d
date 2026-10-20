import {
  LETTER_COLOR,
  superscript,
  type AtomModel,
  type Letter,
} from "@/data/filling"
import { STORY, VIEW_COPY, type Focus, type ViewMode } from "@/data/story"

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "floors", label: "Floors" },
  { id: "nested", label: "Nested" },
  { id: "catalog", label: "Shape chart" },
]

const JUMPS: { z: number; label: string }[] = [
  { z: 6, label: "C" },
  { z: 10, label: "Ne" },
  { z: 18, label: "Ar" },
  { z: 19, label: "K" },
  { z: 20, label: "Ca" },
  { z: 21, label: "Sc" },
  { z: 24, label: "Cr" },
  { z: 29, label: "Cu" },
  { z: 36, label: "Kr" },
]

export function Hud({
  model,
  view,
  focus,
  storyIndex,
  onZ,
  onView,
  onFocus,
  onStory,
}: {
  model: AtomModel
  view: ViewMode
  focus: Focus | null
  storyIndex: number | null
  onZ: (z: number) => void
  onView: (view: ViewMode) => void
  onFocus: (focus: Focus | null) => void
  onStory: (index: number) => void
}) {
  const active = model.notation.find(
    (subshell) => subshell.n === focus?.n && subshell.letter === focus.letter
  )

  return (
    <aside className="pointer-events-auto flex max-h-[48svh] w-full flex-col gap-4 overflow-y-auto border-white/10 bg-[#0e1218]/88 p-4 text-[#e8edf5] shadow-2xl backdrop-blur-md md:h-svh md:max-h-none md:w-[380px] md:border-r">
      <header>
        <p className="text-[11px] tracking-[0.16em] text-[#9aa6b8] uppercase">
          Electron configuration
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          How to read 1s² 2s² 2p²
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-[#b7c0ce]">
          The number is the shell. The letter is the shape. The superscript is
          the electron count.
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {model.symbol}{" "}
            <span className="text-sm font-normal text-[#b7c0ce]">
              {model.name}
            </span>
          </h2>
          <p className="text-sm text-[#b7c0ce]">{model.z} electrons</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Configuration">
          {model.notation.map((subshell) => {
            const selected =
              focus?.n === subshell.n && focus.letter === subshell.letter
            return (
              <button
                key={subshell.id}
                type="button"
                onClick={() =>
                  onFocus({ n: subshell.n, letter: subshell.letter })
                }
                className="rounded-md border px-2 py-1 text-base leading-none"
                style={{
                  borderColor: selected
                    ? LETTER_COLOR[subshell.letter]
                    : "rgba(255,255,255,0.12)",
                  background: selected
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                  color: LETTER_COLOR[subshell.letter],
                }}
              >
                {subshell.n}
                {subshell.letter}
                <sup>{superscript(subshell.electrons)}</sup>
              </button>
            )
          })}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[#9aa6b8]">
          {active
            ? `${active.n} = shell · ${active.letter} = shape · ${superscript(active.electrons)} = ${active.electrons} electron${active.electrons === 1 ? "" : "s"} in ${active.id}`
            : "Click a chunk to fly to that subshell."}
        </p>
        {model.exception ? (
          <p className="mt-2 text-xs leading-relaxed text-[#f6c445]">
            {model.exception}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="size-7 rounded-md border border-white/15 text-lg leading-none"
            aria-label="Fewer electrons"
            onClick={() => onZ(model.z - 1)}
          >
            −
          </button>
          <input
            className="w-full accent-[#f4f7fb]"
            type="range"
            min={1}
            max={36}
            value={model.z}
            aria-label="Atomic number"
            onChange={(event) => onZ(Number(event.target.value))}
          />
          <button
            type="button"
            className="size-7 rounded-md border border-white/15 text-lg leading-none"
            aria-label="More electrons"
            onClick={() => onZ(model.z + 1)}
          >
            +
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {JUMPS.map((jump) => (
            <button
              key={jump.z}
              type="button"
              onClick={() => onZ(jump.z)}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-[#c5ceda]"
              style={{
                background:
                  model.z === jump.z ? "rgba(255,255,255,0.12)" : "transparent",
              }}
            >
              {jump.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div
          className="grid grid-cols-3 gap-1"
          role="tablist"
          aria-label="View"
        >
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => onView(item.id)}
              className="rounded-md border px-2 py-1.5 text-xs"
              style={{
                borderColor:
                  view === item.id ? "#f4f7fb" : "rgba(255,255,255,0.12)",
                background:
                  view === item.id ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#c5ceda]">
          {VIEW_COPY[view]}
        </p>
      </section>

      <section className="grid grid-cols-4 gap-1">
        {model.shells.map((shell) => {
          const selected = focus?.n === shell.n && focus.letter == null
          return (
            <button
              key={shell.n}
              type="button"
              onClick={() => onFocus({ n: shell.n })}
              className="rounded-md border px-1 py-1.5 text-center"
              style={{
                borderColor: selected ? "#f4f7fb" : "rgba(255,255,255,0.1)",
              }}
            >
              <span className="block text-[10px] text-[#9aa6b8]">
                shell {shell.n}
              </span>
              <span className="text-sm">
                {shell.electrons}
                <span className="text-[#9aa6b8]">/{shell.capacity}</span>
              </span>
            </button>
          )
        })}
      </section>

      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs tracking-[0.14em] text-[#9aa6b8] uppercase">
            Walk through
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded-md border border-white/15 px-2 py-0.5 text-xs"
              onClick={() => onStory(Math.max(0, (storyIndex ?? 0) - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-md border border-white/15 px-2 py-0.5 text-xs"
              onClick={() =>
                onStory(Math.min(STORY.length - 1, (storyIndex ?? -1) + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
        {STORY.map((step, index) => {
          const selected = storyIndex === index
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => onStory(index)}
              className="rounded-lg border px-2.5 py-2 text-left"
              style={{
                borderColor: selected ? "#f4f7fb" : "rgba(255,255,255,0.08)",
                background: selected ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              <span className="text-sm font-medium">
                {index + 1}. {step.title}
              </span>
              {selected ? (
                <span className="mt-1 block text-xs leading-relaxed text-[#c5ceda]">
                  {step.body}
                </span>
              ) : null}
            </button>
          )
        })}
      </section>

      <p className="text-[11px] leading-relaxed text-[#8b95a8]">
        Two colors on a blob are the wave’s sign, not two electrons. Electrons
        are the bright dots, at most two on a blob. Drag to orbit, scroll to
        zoom. f shapes are simplified.
      </p>
      <LetterKey />
    </aside>
  )
}

function LetterKey() {
  const letters: Letter[] = ["s", "p", "d", "f"]
  const counts = ["1 blob · 2 e⁻", "3 · 6", "5 · 10", "7 · 14"]
  return (
    <ul className="grid grid-cols-2 gap-1 text-[11px] text-[#c5ceda]">
      {letters.map((letter, index) => (
        <li key={letter} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ background: LETTER_COLOR[letter] }}
          />
          {letter} · {counts[index]}
        </li>
      ))}
    </ul>
  )
}
