import { LETTER_INK } from "@/data/filling"
import type { PracticeChoice, PracticeQuestion } from "@/data/practice"

export type PracticeVerdict = {
  correct: boolean
  choiceId?: string
  why: string
}

export function ModeToggle({
  mode,
  onMode,
}: {
  mode: "learn" | "practice"
  onMode: (mode: "learn" | "practice") => void
}) {
  const modes = ["learn", "practice"] as const
  return (
    <div
      className="flex gap-1 rounded-full border border-[#e3e6ec] bg-white p-1"
      role="tablist"
      aria-label="Mode"
    >
      {modes.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={mode === item}
          onClick={() => onMode(item)}
          className="rounded-full px-3 py-1 text-sm capitalize"
          style={{
            background: mode === item ? "#1c2230" : "transparent",
            color: mode === item ? "#fff" : "#3b4252",
          }}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function PracticeCard({
  question,
  verdict,
  streak,
  onChoice,
  onNext,
}: {
  question: PracticeQuestion
  verdict: PracticeVerdict | null
  streak: number
  onChoice: (choice: PracticeChoice) => void
  onNext: () => void
}) {
  const filled = Math.min(streak, 3)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-[#3b4252]">
        {question.prompt}
      </p>
      {question.chunkLabel ? (
        <p
          className="text-center text-5xl leading-none font-semibold"
          style={{
            color: question.letter ? LETTER_INK[question.letter] : "#1c2230",
          }}
        >
          {question.chunkLabel}
        </p>
      ) : null}
      {question.choices ? (
        <div className="flex flex-col gap-2">
          {question.choices.map((choice) => {
            const picked = verdict?.choiceId === choice.id
            const showCorrect = verdict != null && choice.correct
            return (
              <button
                key={choice.id}
                type="button"
                disabled={verdict != null}
                onClick={() => onChoice(choice)}
                className="rounded-xl border px-3 py-2.5 text-left text-sm leading-snug disabled:cursor-default"
                style={{
                  borderColor: showCorrect
                    ? "#14813f"
                    : picked
                      ? "#c92a32"
                      : "#d6dbe4",
                  background: showCorrect
                    ? "#e5f6ec"
                    : picked
                      ? "#fdecec"
                      : "#fff",
                  color: "#1c2230",
                }}
              >
                {choice.label}
              </button>
            )
          })}
        </div>
      ) : verdict == null ? (
        <p className="text-sm text-[#6b7385]">
          The grid is just under this card. Rows are floors, columns are shapes.
        </p>
      ) : null}
      {verdict ? (
        <div className="flex flex-col gap-3">
          <p
            className="text-sm font-semibold"
            style={{ color: verdict.correct ? "#14813f" : "#c92a32" }}
          >
            {verdict.correct ? "Right." : "Not quite."}
          </p>
          <p className="text-[15px] leading-relaxed text-[#3b4252]">
            {verdict.why}
          </p>
          <button
            type="button"
            onClick={onNext}
            className="self-start rounded-full bg-[#1c2230] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2c3446]"
          >
            Next
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2" aria-label="Correct in a row">
        {[0, 1, 2].map((pip) => (
          <span
            key={pip}
            className="size-2 rounded-full"
            style={{ background: pip < filled ? "#1c2230" : "#dde1e8" }}
          />
        ))}
        <span className="text-xs text-[#6b7385]">
          {streak >= 3 ? "3 in a row" : "3 in a row to land it"}
        </span>
      </div>
    </div>
  )
}
