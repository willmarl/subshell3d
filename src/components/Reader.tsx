import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react"
import type { ReactNode } from "react"
import {
  LETTERS,
  LETTER_INK,
  LETTER_TINT,
  ORBITALS,
  superscript,
  type AtomModel,
  type Letter,
  type SubshellFill,
} from "@/data/filling"
import {
  chunkNotes,
  shellParts,
  type Focus,
  type GuideStep,
} from "@/data/story"
import { OrbitalBoxes, ShellGrid } from "@/components/ShellGrid"

const JUMPS: { z: number; label: string }[] = [
  { z: 1, label: "H" },
  { z: 6, label: "C" },
  { z: 8, label: "O" },
  { z: 10, label: "Ne" },
  { z: 11, label: "Na" },
  { z: 18, label: "Ar" },
  { z: 19, label: "K" },
  { z: 21, label: "Sc" },
  { z: 24, label: "Cr" },
  { z: 26, label: "Fe" },
  { z: 29, label: "Cu" },
  { z: 36, label: "Kr" },
]

export function ElementBar({
  model,
  building,
  onZ,
  onBuild,
}: {
  model: AtomModel
  building: boolean
  onZ: (z: number) => void
  onBuild: () => void
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full border border-[#d6dbe4] bg-white text-[#3b4252] hover:bg-[#f1f3f7] disabled:opacity-40"
          aria-label="One fewer electron"
          disabled={model.z <= 1}
          onClick={() => onZ(model.z - 1)}
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">
            {model.symbol}
          </span>
          <span className="truncate text-lg text-[#4b5466]">{model.name}</span>
          <span className="ml-auto shrink-0 text-sm text-[#6b7385] tabular-nums">
            {model.z} electron{model.z === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full border border-[#d6dbe4] bg-white text-[#3b4252] hover:bg-[#f1f3f7] disabled:opacity-40"
          aria-label="One more electron"
          disabled={model.z >= 36}
          onClick={() => onZ(model.z + 1)}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <input
        className="w-full accent-[#1c2230]"
        type="range"
        min={1}
        max={36}
        value={model.z}
        aria-label="Atomic number"
        onChange={(event) => onZ(Number(event.target.value))}
      />
      <div className="flex flex-wrap items-center gap-1">
        {JUMPS.map((jump) => (
          <button
            key={jump.z}
            type="button"
            onClick={() => onZ(jump.z)}
            className="rounded-full border px-2.5 py-0.5 text-xs"
            style={{
              borderColor: model.z === jump.z ? "#1c2230" : "#d6dbe4",
              background: model.z === jump.z ? "#1c2230" : "#fff",
              color: model.z === jump.z ? "#fff" : "#3b4252",
            }}
          >
            {jump.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onBuild}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-[#d6dbe4] bg-white px-2.5 py-0.5 text-xs text-[#3b4252] hover:bg-[#f1f3f7]"
        >
          {building ? (
            <Pause className="size-3" />
          ) : (
            <RotateCcw className="size-3" />
          )}
          {building ? "Stop" : "Fill from H"}
        </button>
      </div>
    </section>
  )
}

export function NotationStrip({
  model,
  step,
  focus,
  onChunk,
}: {
  model: AtomModel
  step: GuideStep
  focus: Focus | null
  onChunk: (id: string) => void
}) {
  const activeIndex = model.notation.findIndex(
    (subshell) => subshell.n === focus?.n && subshell.letter === focus.letter
  )
  const reading = step.kind === "chunk"

  return (
    <div
      className="flex flex-wrap items-baseline gap-x-1 gap-y-2 text-[2rem] leading-none font-medium sm:text-[2.4rem]"
      aria-label="Electron configuration"
    >
      {model.notation.map((subshell, index) => {
        const active = index === activeIndex
        const ahead = reading && activeIndex >= 0 && index > activeIndex
        return (
          <span key={subshell.id} className="flex items-baseline">
            {step.kind === "sum" && index > 0 ? (
              <span className="px-1 text-xl text-[#a3abb9]">+</span>
            ) : null}
            <button
              type="button"
              onClick={() => onChunk(subshell.id)}
              className="rounded-lg px-1.5 py-1 transition"
              style={{
                color: LETTER_INK[subshell.letter],
                background: active
                  ? LETTER_TINT[subshell.letter]
                  : "transparent",
                boxShadow: active
                  ? `inset 0 -3px 0 ${LETTER_INK[subshell.letter]}`
                  : "none",
                opacity: ahead ? 0.3 : 1,
              }}
            >
              {subshell.n}
              {subshell.letter}
              <sup className="text-[0.55em]">{subshell.electrons}</sup>
            </button>
          </span>
        )
      })}
      {step.kind === "sum" ? (
        <span className="pl-2 text-xl text-[#1c2230]">= {model.z}</span>
      ) : null}
    </div>
  )
}

export function StepNav({
  steps,
  index,
  playing,
  onStep,
  onPlay,
}: {
  steps: GuideStep[]
  index: number
  playing: boolean
  onStep: (index: number) => void
  onPlay: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPlay}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#1c2230] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2c3446]"
      >
        {playing ? (
          <Pause className="size-3.5" />
        ) : (
          <Play className="size-3.5" />
        )}
        {playing ? "Pause" : "Walk me through"}
      </button>
      <div className="flex flex-1 items-center gap-1" role="tablist">
        {steps.map((step, stepIndex) => (
          <button
            key={step.key}
            type="button"
            role="tab"
            aria-selected={stepIndex === index}
            aria-label={step.title}
            title={step.title}
            onClick={() => onStep(stepIndex)}
            className="h-2 flex-1 rounded-full transition"
            style={{
              background:
                stepIndex === index
                  ? step.chunk
                    ? LETTER_INK[step.chunk.letter]
                    : "#1c2230"
                  : stepIndex < index
                    ? "#aab2c0"
                    : "#dde1e8",
            }}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Previous step"
        disabled={index <= 0}
        onClick={() => onStep(index - 1)}
        className="grid size-8 place-items-center rounded-full border border-[#d6dbe4] bg-white disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next step"
        disabled={index >= steps.length - 1}
        onClick={() => onStep(index + 1)}
        className="grid size-8 place-items-center rounded-full border border-[#d6dbe4] bg-white disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

export function StepBody({
  model,
  step,
  selected,
  onChunk,
}: {
  model: AtomModel
  step: GuideStep
  selected: SubshellFill | null
  onChunk: (id: string) => void
}) {
  if (selected) {
    return <Decoder model={model} subshell={selected} />
  }

  if (step.kind === "split") {
    return (
      <Prose>
        <p>
          {model.name} is written as {model.notation.length} chunk
          {model.notation.length === 1 ? "" : "s"}. Every chunk has the same
          three parts:
        </p>
        <div className="my-1 grid grid-cols-3 gap-2 text-center">
          <PartCard big="2" label="big number" detail="which shell (floor)" />
          <PartCard big="p" label="letter" detail="which shape on that floor" />
          <PartCard big="²" label="small number" detail="how many electrons" />
        </div>
        <p>
          Chunks are written in the order they fill, lowest energy first. Press
          next, or click any chunk above, to read them one at a time.
        </p>
      </Prose>
    )
  }

  if (step.kind === "sum") {
    return (
      <Prose>
        <p className="text-2xl font-medium">
          {model.notation.map((subshell, index) => (
            <span key={subshell.id}>
              {index > 0 ? <span className="text-[#a3abb9]"> + </span> : null}
              <span style={{ color: LETTER_INK[subshell.letter] }}>
                {subshell.electrons}
              </span>
            </span>
          ))}{" "}
          = {model.z}
        </p>
        <p>
          Add up the small numbers and you get {model.z}, which is {model.name}
          &rsquo;s atomic number. That&rsquo;s a quick check that you read it
          right: a neutral atom has one electron per proton.
        </p>
      </Prose>
    )
  }

  if (step.kind === "shells") {
    return (
      <Prose>
        <p>
          The big number is the shell. Chunks with the same big number live on
          the same floor, even when other chunks sit between them.
        </p>
        <ul className="flex flex-col gap-1.5">
          {model.shells
            .filter((shell) => shell.electrons > 0)
            .map((shell) => {
              const parts = model.notation.filter(
                (subshell) => subshell.n === shell.n
              )
              return (
                <li
                  key={shell.n}
                  className="flex flex-wrap items-baseline gap-x-2"
                >
                  <span className="w-16 font-medium text-[#1c2230]">
                    Shell {shell.n}
                  </span>
                  <span>
                    {parts.map((subshell, index) => (
                      <span key={subshell.id}>
                        {index > 0 ? " + " : ""}
                        <button
                          type="button"
                          onClick={() => onChunk(subshell.id)}
                          className="font-medium"
                          style={{ color: LETTER_INK[subshell.letter] }}
                        >
                          {subshell.id}
                          {superscript(subshell.electrons)}
                        </button>
                      </span>
                    ))}
                  </span>
                  <span className="text-[#6b7385]">
                    = {shell.electrons} of {shell.capacity} seats
                  </span>
                </li>
              )
            })}
        </ul>
        <p>
          Shell capacities come from adding their own subshells, not the shells
          below: shell 2 is 2s + 2p = 2 + 6 = 8, and shell 3 is 3s + 3p + 3d = 2
          + 6 + 10 = 18.
        </p>
      </Prose>
    )
  }

  return (
    <Prose>
      <p>
        The picture with rows of 1, 3, 5 and 7 blobs is a <b>shape chart</b>.
        Each row is a letter, not a shell. It draws each shape once.
      </p>
      <ul className="flex flex-col gap-1">
        {LETTERS.map((letter) => (
          <li key={letter}>
            <span
              className="font-semibold"
              style={{ color: LETTER_INK[letter] }}
            >
              {letter} row
            </span>{" "}
            ({ORBITALS[letter].length} blob
            {ORBITALS[letter].length === 1 ? "" : "s"}) is reused by{" "}
            {[1, 2, 3, 4]
              .filter((n) => LETTERS.indexOf(letter) < n)
              .map((n) => `${n}${letter}`)
              .join(", ")}
          </li>
        ))}
      </ul>
      <p>
        So shell 2 uses the red ball <i>and</i> the yellow dumbbells.
        That&rsquo;s where 2s² comes from, even though the yellow row has no s
        in it.
      </p>
    </Prose>
  )
}

function Decoder({
  model,
  subshell,
}: {
  model: AtomModel
  subshell: SubshellFill
}) {
  const { n, letter, electrons, capacity } = subshell
  const blobs = ORBITALS[letter].length
  const ink = LETTER_INK[letter]
  const position = model.notation.findIndex((item) => item.id === subshell.id)
  const readSoFar = model.notation
    .slice(0, position + 1)
    .reduce((sum, item) => sum + item.electrons, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[auto_auto_auto] justify-center gap-x-5 sm:gap-x-8">
        <span className="text-center text-7xl leading-none font-semibold text-[#1c2230]">
          {n}
        </span>
        <span
          className="text-center text-7xl leading-none font-semibold"
          style={{ color: ink }}
        >
          {letter}
        </span>
        <span className="self-start text-center text-4xl leading-none font-semibold text-[#1c2230]">
          {electrons}
        </span>
        <PartLabel
          title={`shell ${n}`}
          detail={`floor ${n}, holds ${2 * n * n}`}
        />
        <PartLabel
          title={`${letter} shape`}
          detail={`${blobs} blob${blobs === 1 ? "" : "s"}, room for ${capacity}`}
          color={ink}
        />
        <PartLabel
          title={`${electrons} electron${electrons === 1 ? "" : "s"}`}
          detail={`${electrons} of ${capacity} seats`}
        />
      </div>

      <p className="text-center text-lg text-[#1c2230]">
        {electrons > 0 ? (
          <>
            <b>{electrons}</b> electron{electrons === 1 ? "" : "s"} in the{" "}
            <b style={{ color: ink }}>{letter}</b> blob{blobs === 1 ? "" : "s"}{" "}
            of <b>shell {n}</b>.
          </>
        ) : (
          <>
            <b style={{ color: ink }}>{subshell.id}</b> is empty for{" "}
            {model.name}, so it isn&rsquo;t written.
          </>
        )}
      </p>

      <div className="flex flex-col items-center gap-1.5">
        <OrbitalBoxes subshell={subshell} size="lg" />
        <span className="text-xs text-[#6b7385]">
          one box per blob · each holds 2 (↑↓)
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 text-[15px] leading-relaxed text-[#3b4252]">
        {chunkNotes(model, subshell).map((note) => (
          <li key={note} className="flex gap-2">
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full"
              style={{ background: ink }}
            />
            {note}
          </li>
        ))}
      </ul>

      {position >= 0 ? (
        <div className="flex items-center gap-2 text-xs text-[#6b7385]">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6e9ef]">
            <div
              className="h-full rounded-full bg-[#1c2230] transition-all"
              style={{ width: `${(readSoFar / model.z) * 100}%` }}
            />
          </div>
          <span className="tabular-nums">
            {readSoFar} of {model.z} electrons read
          </span>
        </div>
      ) : null}
    </div>
  )
}

function PartLabel({
  title,
  detail,
  color = "#1c2230",
}: {
  title: string
  detail: string
  color?: string
}) {
  return (
    <span
      className="mt-2 flex flex-col items-center border-t-2 pt-1.5 text-center"
      style={{ borderColor: color }}
    >
      <span className="text-sm font-semibold" style={{ color }}>
        {title}
      </span>
      <span className="text-xs text-[#6b7385]">{detail}</span>
    </span>
  )
}

function PartCard({
  big,
  label,
  detail,
}: {
  big: string
  label: string
  detail: string
}) {
  return (
    <span className="flex flex-col items-center rounded-lg border border-[#e3e6ec] bg-[#fafbfc] px-2 py-2">
      <span className="text-3xl leading-none font-semibold text-[#1c2230]">
        {big}
      </span>
      <span className="mt-1 text-xs font-semibold text-[#1c2230]">{label}</span>
      <span className="text-[11px] leading-snug text-[#6b7385]">{detail}</span>
    </span>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[#3b4252]">
      {children}
    </div>
  )
}

export function BuildingPlan({
  model,
  focus,
  onSelect,
}: {
  model: AtomModel
  focus: Focus | null
  onSelect: (n: number, letter: Letter) => void
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-[#1c2230]">
          Every shell at once
        </h2>
        <span className="text-xs text-[#6b7385]">
          rows = big number · columns = letter
        </span>
      </div>
      <ShellGrid model={model} focus={focus} onSelect={onSelect} />
      <p className="text-xs text-[#6b7385]">
        Shell n has n letters:{" "}
        {[1, 2, 3, 4].map((n) => shellParts(n).join(" ")).join(" · ")}
      </p>
    </section>
  )
}
