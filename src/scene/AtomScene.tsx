import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { Vector3 } from "three"
import type { AtomModel, Letter } from "@/data/filling"
import type { Focus, ViewMode } from "@/data/story"
import { CAMERA_FOV, cameraGoal } from "@/scene/layout"
import { InvertPass } from "@/scene/InvertPass"
import { Catalog, Floors, Nested } from "@/scene/views"

const BACKGROUND = "#f5f6f8"

type ControlsLike = {
  target: Vector3
  update: () => void
}

function CameraRig({
  view,
  focus,
  topShell,
}: {
  view: ViewMode
  focus: Focus | null
  topShell: number
}) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const controls = useThree((state) => state.controls) as ControlsLike | null
  const aspect = useThree((state) => state.size.width / state.size.height)
  const goal = useMemo(
    () => cameraGoal(view, focus, topShell, aspect),
    [view, focus, topShell, aspect]
  )
  const desiredPosition = useRef(new Vector3())
  const desiredTarget = useRef(new Vector3())
  const flying = useRef(true)

  useLayoutEffect(() => {
    desiredPosition.current.set(...goal.position)
    desiredTarget.current.set(...goal.target)
    flying.current = true
  }, [goal])

  useEffect(() => {
    const canvas = gl.domElement
    const stop = () => {
      flying.current = false
    }

    canvas.addEventListener("pointerdown", stop)
    canvas.addEventListener("wheel", stop, { passive: true })
    return () => {
      canvas.removeEventListener("pointerdown", stop)
      canvas.removeEventListener("wheel", stop)
    }
  }, [gl])

  useFrame((_, delta) => {
    if (!flying.current || !controls) {
      return
    }

    const t = 1 - Math.exp(-delta * 4.5)
    camera.position.lerp(desiredPosition.current, t)
    controls.target.lerp(desiredTarget.current, t)
    controls.update()

    if (
      camera.position.distanceTo(desiredPosition.current) < 0.01 &&
      controls.target.distanceTo(desiredTarget.current) < 0.01
    ) {
      flying.current = false
    }
  })

  return null
}

export function AtomScene({
  model,
  view,
  focus,
  onSelect,
}: {
  model: AtomModel
  view: ViewMode
  focus: Focus | null
  onSelect: (n: number, letter: Letter) => void
}) {
  const topShell = Math.max(
    1,
    ...model.shells.filter((shell) => shell.electrons > 0).map((s) => s.n)
  )
  const opening = cameraGoal("floors", null, topShell, 1)

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: opening.position, fov: CAMERA_FOV }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 22, 40]} />
      <hemisphereLight args={["#ffffff", "#c9d1de", 1.1]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 10, 8]} intensity={1.6} />
      <directionalLight position={[-7, 3, -5]} intensity={0.4} />
      {view === "floors" ? (
        <Floors
          model={model}
          focus={focus}
          topShell={topShell}
          onSelect={onSelect}
        />
      ) : null}
      {view === "nested" ? <Nested model={model} focus={focus} /> : null}
      {view === "catalog" ? (
        <Catalog model={model} focus={focus} onSelect={onSelect} />
      ) : null}
      <OrbitControls
        makeDefault
        target={opening.target}
        enablePan={false}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.92}
      />
      <CameraRig view={view} focus={focus} topShell={topShell} />
      <InvertPass />
    </Canvas>
  )
}
