import { useMemo, useState } from "react"
import { Hud } from "@/components/Hud"
import { buildAtom } from "@/data/filling"
import { STORY, type Focus, type ViewMode } from "@/data/story"
import { AtomScene } from "@/scene/AtomScene"

export default function App() {
  const [z, setZ] = useState(6)
  const [view, setView] = useState<ViewMode>("floors")
  const [focus, setFocus] = useState<Focus | null>(null)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const model = useMemo(() => buildAtom(z), [z])

  function showSubshell(next: Focus | null) {
    setFocus(next)
    if (next?.letter && view === "catalog" && next.n != null) {
      setView("floors")
    }
  }

  function showStory(index: number) {
    const step = STORY[index]
    if (!step) {
      return
    }

    setStoryIndex(index)
    setZ(step.z)
    setView(step.view)
    setFocus(step.focus)
  }

  return (
    <main className="relative h-svh overflow-hidden bg-[#0e1218] text-white">
      <div className="absolute inset-0 z-0">
        <AtomScene
          model={model}
          view={view}
          focus={focus}
          onFocus={showSubshell}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 md:inset-y-0 md:right-auto md:left-0">
        <Hud
          model={model}
          view={view}
          focus={focus}
          storyIndex={storyIndex}
          onZ={setZ}
          onView={setView}
          onFocus={(next) => {
            if (next?.n != null && next.letter == null && view === "catalog") {
              setView("floors")
            }
            setFocus(next)
          }}
          onStory={showStory}
        />
      </div>
    </main>
  )
}
