import { useEffect, useMemo, useState } from "react"
import {
  BuildingPlan,
  ElementBar,
  NotationStrip,
  StepBody,
  StepNav,
} from "@/components/Reader"
import { buildAtom, type Letter } from "@/data/filling"
import {
  VIEW_LABEL,
  buildGuide,
  chunkKey,
  type Focus,
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

  const model = useMemo(() => buildAtom(z), [z])
  const steps = useMemo(() => buildGuide(model), [model])
  const foundIndex = steps.findIndex((step) => step.key === stepKey)
  const stepIndex = foundIndex >= 0 ? foundIndex : 0
  const step = steps[stepIndex]!

  const focus: Focus | null = picked ?? step.focus
  const selected =
    (picked
      ? model.subshells.find(
          (s) => s.n === picked.n && s.letter === picked.letter
        )
      : step.chunk) ?? null

  function setZ(next: number) {
    const clamped = Math.min(36, Math.max(1, next))
    setZRaw(clamped)
    setPicked(null)
    setStepKey(newestChunkKey(clamped))
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
      setZ(z + 1)
    }, BUILD_MS)
    return () => window.clearTimeout(timer)
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.tagName === "INPUT") {
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
    setBuildTarget(z <= 1 ? 36 : z)
    setZ(1)
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
        <header>
          <p className="text-xs font-medium tracking-[0.14em] text-[#6b7385] uppercase">
            How to read electron configurations
          </p>
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
            step={step}
            focus={focus}
            onChunk={pickChunk}
          />
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
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="text-lg font-semibold">
              {picked && selected ? `Looking at ${selected.id}` : step.title}
            </h1>
            <span className="shrink-0 text-xs text-[#8a93a3] tabular-nums">
              {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <StepBody
            model={model}
            step={step}
            selected={selected}
            onChunk={pickChunk}
          />
        </section>

        <BuildingPlan model={model} focus={focus} onSelect={pickSubshell} />
      </div>

      <div className="relative h-[60svh] min-w-0 border-t border-[#e3e6ec] md:h-auto md:border-t-0 md:border-l">
        <AtomScene
          model={model}
          view={view}
          focus={focus}
          onSelect={pickSubshell}
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
