import { Lock } from "lucide-react"
import {
  LETTERS,
  LETTER_INK,
  LETTER_TINT,
  superscript,
  type AtomModel,
  type Letter,
  type SubshellFill,
} from "@/data/filling"
import { isEmphasized, lockedSet, type Focus } from "@/data/story"

export function OrbitalBoxes({
  subshell,
  size = "sm",
}: {
  subshell: SubshellFill
  size?: "sm" | "lg"
}) {
  const box = size === "lg" ? "h-11 w-8 text-base" : "h-6 w-3.5 text-[10px]"
  return (
    <span className="inline-flex gap-1">
      {subshell.orbitals.map((orbital) => (
        <span
          key={orbital.name}
          className={`${box} flex flex-col items-center justify-center rounded-[4px] border leading-none`}
          style={{
            borderColor:
              orbital.electrons > 0 ? LETTER_INK[subshell.letter] : "#cfd5df",
            background: orbital.electrons > 0 ? "#fff" : "transparent",
            color: "#1c2230",
          }}
        >
          <span>{orbital.electrons > 0 ? "↑" : "\u00a0"}</span>
          <span>{orbital.electrons > 1 ? "↓" : "\u00a0"}</span>
        </span>
      ))}
    </span>
  )
}

export function ShellGrid({
  model,
  focus,
  onSelect,
}: {
  model: AtomModel
  focus: Focus | null
  onSelect: (n: number, letter: Letter) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[400px] grid-cols-[3.5rem_0.7fr_1.1fr_1.5fr_2fr_3rem] gap-1 text-xs">
        <span />
        {LETTERS.map((letter) => (
          <span
            key={letter}
            className="pb-0.5 text-center font-semibold"
            style={{ color: LETTER_INK[letter] }}
          >
            {letter}
          </span>
        ))}
        <span className="text-center text-[#8a93a3]">total</span>
        {model.shells.map((shell) => (
          <ShellRow
            key={shell.n}
            model={model}
            n={shell.n}
            focus={focus}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function ShellRow({
  model,
  n,
  focus,
  onSelect,
}: {
  model: AtomModel
  n: number
  focus: Focus | null
  onSelect: (n: number, letter: Letter) => void
}) {
  const shell = model.shells.find((item) => item.n === n)
  const rowActive = focus?.n === n
  return (
    <>
      <span
        className="flex items-center text-[11px] font-medium"
        style={{ color: rowActive ? "#1c2230" : "#6b7385" }}
      >
        Shell {n}
      </span>
      {LETTERS.map((letter, index) => {
        if (index >= n) {
          return (
            <span
              key={letter}
              className="flex items-center justify-center rounded-md border border-dashed border-[#d6dbe4] text-[10px] text-[#a3abb9]"
            >
              no {n}
              {letter}
            </span>
          )
        }

        const subshell = model.subshells.find(
          (item) => item.n === n && item.letter === letter
        )
        if (!subshell) {
          return <span key={letter} />
        }

        const active = focus?.n === n && focus.letter === letter
        const dim = focus != null && !isEmphasized(focus, n, letter)
        const locked = lockedSet(model.z, n, letter) != null
        return (
          <button
            key={letter}
            type="button"
            onClick={() => onSelect(n, letter)}
            className="flex flex-col items-center gap-1 rounded-md border px-1 py-1 transition"
            style={{
              borderColor: active ? LETTER_INK[letter] : "#dfe3ea",
              borderWidth: active ? 2 : 1,
              background:
                active || subshell.electrons > 0 ? LETTER_TINT[letter] : "#fff",
              opacity: dim ? 0.45 : 1,
            }}
          >
            <span
              className="text-[11px] font-semibold"
              style={{ color: LETTER_INK[letter] }}
            >
              {subshell.id}
              {subshell.electrons > 0 ? superscript(subshell.electrons) : ""}
            </span>
            <span className="relative">
              <span className={locked ? "opacity-40" : undefined}>
                <OrbitalBoxes subshell={subshell} />
              </span>
              {locked ? (
                <Lock
                  className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2"
                  style={{ color: LETTER_INK[letter] }}
                  aria-label="Locked"
                />
              ) : null}
            </span>
          </button>
        )
      })}
      <span
        className="flex items-center justify-center text-[11px] tabular-nums"
        style={{
          color:
            shell && shell.electrons === shell.capacity ? "#1c2230" : "#8a93a3",
          fontWeight: shell && shell.electrons === shell.capacity ? 600 : 400,
        }}
      >
        {shell?.electrons}/{shell?.capacity}
      </span>
    </>
  )
}
