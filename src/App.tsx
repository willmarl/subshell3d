import { useEffect, useMemo, useState } from "react"
import {
  ModeToggle,
  PracticeCard,
  type PracticeVerdict,
} from "@/components/Practice"
import {
  BuildingPlan,
  ElementBar,
  NotationStrip,
  StepBody,
  StepNav,
} from "@/components/Reader"
import { MAX_Z, buildAtom, type Letter } from "@/data/filling"
import {
  buildPractice,
  explainPlace,
  openingQuestion,
  questionAfter,
  type PracticeChoice,
} from "@/data/practice"
import {
  VIEW_LABEL,
  buildGuide,
  chunkKey,
  type Focus,
  type GuideStep,
  type ViewMode,
} from "@/data/story"
import { AtomScene } from "@/scene/AtomScene"
import { SceneCaption } from "@/scene/SceneCaption"

const VIEWS: ViewMode[] = ["floors", "nested", "catalog"]
const STEP_MS = 4500
const BUILD_MS = 650

function newestChunkKey(z: number) {
  const last = buildAtom(z).notation.at(-1)
  return last ? chunkKey(last.id) : "split"
}

export default function App() {
  const [z, setZRaw] = useState(6)
  const [stepKey, setStepKey] = useState("split")
  const [picked, setPicked] = useState<{ n: number; letter: Letter } | null>(
    null
  )
  const [view, setView] = useState<ViewMode>("floors")
  const [playing, setPlaying] = useState(false)
  const [buildTarget, setBuildTarget] = useState<number | null>(null)
  const [mode, setMode] = useState<"learn" | "practice">("learn")
  const [practiceKey, setPracticeKey] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<PracticeVerdict | null>(null)
  const [streak, setStreak] = useState(0)

  const model = useMemo(() => buildAtom(z), [z])
  const steps = useMemo(() => buildGuide(model), [model])
  const questions = useMemo(() => buildPractice(model), [model])
  const question =
    questions.find((item) => item.id === practiceKey) ??
    openingQuestion(questions)
  const foundIndex = steps.findIndex((step) => step.key === stepKey)
  const stepIndex = foundIndex >= 0 ? foundIndex : 0
  const step = steps[stepIndex]!

  const focus: Focus | null =
    mode === "practice"
      ? verdict
        ? question.focus
        : null
      : (picked ?? step.focus)
  const notationStep: GuideStep =
    mode === "practice" ? { ...step, kind: "split" } : step
  const selected =
    (picked
      ? model.subshells.find(
          (s) => s.n === picked.n && s.letter === picked.letter
        )
      : step.chunk) ?? null

  function setZ(next: number, followNewest = false) {
    const clamped = Math.min(MAX_Z, Math.max(1, next))
    setZRaw(clamped)
    setPicked(null)
    if (followNewest) {
      setStepKey(newestChunkKey(clamped))
    }
    setPracticeKey(null)
    setVerdict(null)
    if (view === "catalog" && step.kind === "chart") {
      setView("floors")
    }
  }

  function goToStep(index: number) {
    const next = steps[Math.min(steps.length - 1, Math.max(0, index))]
    if (!next) {
      return
    }
    setPicked(null)
    setStepKey(next.key)
    if (next.view) {
      setView(next.view)
    } else if (step.kind === "chart" && view === "catalog") {
      setView("floors")
    }
  }

  function pickChunk(id: string) {
    setPlaying(false)
    goToStep(steps.findIndex((s) => s.key === chunkKey(id)))
  }

  function pickSubshell(n: number, letter: Letter) {
    setPlaying(false)
    const key = chunkKey(`${n}${letter}`)
    const index = steps.findIndex((s) => s.key === key)
    if (index >= 0) {
      goToStep(index)
      return
    }
    setPicked({ n, letter })
  }

  useEffect(() => {
    if (!playing) {
      return
    }
    const timer = window.setTimeout(() => {
      if (stepIndex >= steps.length - 1) {
        setPlaying(false)
        return
      }
      goToStep(stepIndex + 1)
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  })

  useEffect(() => {
    if (buildTarget == null) {
      return
    }
    const timer = window.setTimeout(() => {
      if (z >= buildTarget) {
        setBuildTarget(null)
        return
      }
      setZ(z + 1, true)
    }, BUILD_MS)
    return () => window.clearTimeout(timer)
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.tagName === "INPUT") {
        return
      }
      if (mode === "practice") {
        return
      }
      if (event.key === "ArrowRight") {
        setPlaying(false)
        goToStep(stepIndex + 1)
      } else if (event.key === "ArrowLeft") {
        setPlaying(false)
        goToStep(stepIndex - 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function toggleBuild() {
    if (buildTarget != null) {
      setBuildTarget(null)
      return
    }
    setPlaying(false)
    setBuildTarget(z <= 1 ? MAX_Z : z)
    setZ(1)
  }

  function chooseMode(next: "learn" | "practice") {
    setMode(next)
    setPlaying(false)
    setBuildTarget(null)
    setVerdict(null)
    if (next === "practice") {
      setView("floors")
    }
  }

  function grade(correct: boolean, why: string, choiceId?: string) {
    setVerdict({ correct, why, choiceId })
    setStreak((current) => (correct ? current + 1 : 0))
    setView("floors")
    setPlaying(false)
  }

  function answerChoice(choice: PracticeChoice) {
    if (mode !== "practice" || verdict) {
      return
    }
    grade(choice.correct, choice.correct ? question.why : choice.why, choice.id)
  }

  function answerPlace(n: number, letter: Letter) {
    if (mode !== "practice" || question.kind !== "place" || verdict) {
      return false
    }
    const correct =
      question.answer?.n === n && question.answer.letter === letter
    grade(correct, explainPlace(question, { n, letter }))
    return true
  }

  function showNextQuestion() {
    const next = questionAfter(questions, question.id)
    setPracticeKey(next.id)
    setVerdict(null)
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false)
      return
    }
    setBuildTarget(null)
    if (stepIndex >= steps.length - 1) {
      goToStep(0)
    }
    setPlaying(true)
  }

  return (
    <main className="min-h-svh w-full overflow-x-hidden bg-[#f5f6f8] text-[#1c2230] md:grid md:h-svh md:grid-cols-[30rem_minmax(0,1fr)] md:overflow-hidden">
      <div className="sidebar-scroll flex w-full min-w-0 flex-col gap-5 overflow-x-hidden p-4 sm:p-6 md:w-[30rem] md:overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-[0.14em] text-[#6b7385] uppercase">
            How to read electron configurations
          </p>
          <ModeToggle mode={mode} onMode={chooseMode} />
        </header>

        <ElementBar
          model={model}
          building={buildTarget != null}
          onZ={(next) => {
            setBuildTarget(null)
            setZ(next)
          }}
          onBuild={toggleBuild}
        />

        <section className="flex flex-col gap-4 rounded-2xl border border-[#e3e6ec] bg-white p-4 shadow-sm sm:p-5">
          <NotationStrip
            model={model}
            step={notationStep}
            focus={focus}
            onChunk={(id) => {
              if (mode === "practice") {
                const subshell = model.subshells.find((item) => item.id === id)
                if (subshell) {
                  answerPlace(subshell.n, subshell.letter)
                }
                return
              }
              pickChunk(id)
            }}
          />
          {mode === "learn" ? (
            <StepNav
              steps={steps}
              index={stepIndex}
              playing={playing}
              onStep={(index) => {
                setPlaying(false)
                goToStep(index)
              }}
              onPlay={togglePlay}
            />
          ) : null}
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="text-lg font-semibold">
              {mode === "practice"
                ? question.title
                : picked && selected
                  ? `Looking at ${selected.id}`
                  : step.title}
            </h1>
            {mode === "learn" ? (
              <span className="shrink-0 text-xs text-[#8a93a3] tabular-nums">
                {stepIndex + 1} / {steps.length}
              </span>
            ) : null}
          </div>
          {mode === "practice" ? (
            <PracticeCard
              question={question}
              verdict={verdict}
              streak={streak}
              onChoice={answerChoice}
              onNext={showNextQuestion}
            />
          ) : (
            <StepBody
              model={model}
              step={step}
              selected={selected}
              onChunk={pickChunk}
            />
          )}
        </section>

        <BuildingPlan
          model={model}
          focus={focus}
          hint={
            mode === "practice" && question.kind === "place" && verdict == null
              ? "Click the cell this chunk belongs to"
              : undefined
          }
          onSelect={(n, letter) => {
            if (answerPlace(n, letter)) {
              return
            }
            if (mode === "practice") {
              return
            }
            pickSubshell(n, letter)
          }}
        />
      </div>

      <div className="relative h-[60svh] min-w-0 border-t border-[#e3e6ec] md:h-auto md:border-t-0 md:border-l">
        <AtomScene
          model={model}
          view={view}
          focus={focus}
          onSelect={(n, letter) => {
            if (answerPlace(n, letter)) {
              return
            }
            if (mode === "practice") {
              return
            }
            pickSubshell(n, letter)
          }}
        />
        <div
          className="absolute top-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-[#e3e6ec] bg-white/90 p-1 shadow-sm backdrop-blur"
          role="tablist"
          aria-label="3D view"
        >
          {VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={view === item}
              onClick={() => setView(item)}
              className="rounded-full px-3 py-1 text-sm"
              style={{
                background: view === item ? "#1c2230" : "transparent",
                color: view === item ? "#fff" : "#3b4252",
              }}
            >
              {VIEW_LABEL[item]}
            </button>
          ))}
        </div>
        <SceneCaption model={model} view={view} focus={focus} />
      </div>
    </main>
  )
}
