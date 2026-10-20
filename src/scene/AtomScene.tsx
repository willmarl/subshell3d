import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { Vector3 } from "three"
import type { AtomModel } from "@/data/filling"
import type { Focus, ViewMode } from "@/data/story"
import { cameraGoal } from "@/scene/layout"
import { Catalog, Floors, Nested } from "@/scene/views"

type ControlsLike = {
  target: Vector3
  update: () => void
}

function CameraRig({ view, focus }: { view: ViewMode; focus: Focus | null }) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const controls = useThree((state) => state.controls) as ControlsLike | null
  const goal = useMemo(() => cameraGoal(view, focus), [view, focus])
  const desiredPosition = useRef(new Vector3())
  const desiredTarget = useRef(new Vector3())
  const flying = useRef(true)

  useLayoutEffect(() => {
    desiredPosition.current.set(...goal.position)
    desiredTarget.current.set(...goal.target)
    camera.position.copy(desiredPosition.current)
    camera.lookAt(desiredTarget.current)
    if (controls?.target) {
      controls.target.copy(desiredTarget.current)
      controls.update()
    }
    flying.current = true
    invalidate()
  }, [camera, controls, desiredPosition, desiredTarget, goal, invalidate])

  useEffect(() => {
    const canvas = document.querySelector("canvas")
    if (!canvas) {
      return
    }

    const stop = () => {
      flying.current = false
    }

    canvas.addEventListener("pointerdown", stop)
    canvas.addEventListener("wheel", stop, { passive: true })
    return () => {
      canvas.removeEventListener("pointerdown", stop)
      canvas.removeEventListener("wheel", stop)
    }
  }, [])

  useFrame(() => {
    if (!flying.current || !controls) {
      return
    }

    camera.position.lerp(desiredPosition.current, 0.085)
    controls.target.lerp(desiredTarget.current, 0.085)
    controls.update()

    if (
      camera.position.distanceTo(desiredPosition.current) < 0.05 &&
      controls.target.distanceTo(desiredTarget.current) < 0.05
    ) {
      flying.current = false
      return
    }

    invalidate()
  })

  return null
}

const OPENING = cameraGoal("floors", null)

export function AtomScene({
  model,
  view,
  focus,
  onFocus,
}: {
  model: AtomModel
  view: ViewMode
  focus: Focus | null
  onFocus: (focus: Focus | null) => void
}) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: OPENING.position, fov: 42 }}
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#0e1218"]} />
      <fog attach="fog" args={["#0e1218", 24, 46]} />
      <hemisphereLight args={["#f7f4ee", "#1c2433", 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 12, 6]} intensity={1.55} />
      <directionalLight
        position={[-7, 3, -5]}
        intensity={0.45}
        color="#9eb6e0"
      />
      {view === "floors" ? (
        <Floors model={model} focus={focus} onFocus={(next) => onFocus(next)} />
      ) : null}
      {view === "nested" ? <Nested model={model} focus={focus} /> : null}
      {view === "catalog" ? (
        <Catalog focus={focus} onFocus={(next) => onFocus(next)} />
      ) : null}
      <OrbitControls
        makeDefault
        target={OPENING.target}
        enablePan={false}
        minDistance={2.2}
        maxDistance={32}
        maxPolarAngle={Math.PI * 0.92}
      />
      <CameraRig view={view} focus={focus} />
    </Canvas>
  )
}
