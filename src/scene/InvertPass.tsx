import { useFrame } from "@react-three/fiber"
import { useEffect } from "react"
import {
  BufferGeometry,
  Float32BufferAttribute,
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three"

const MAX_FLASHES = 8

type Flash = { center: Vector3; radius: number; strength: number }

const pending: Flash[] = Array.from({ length: MAX_FLASHES }, () => ({
  center: new Vector3(),
  radius: 0,
  strength: 0,
}))
let pendingCount = 0

export function pushInvertFlash(
  worldCenter: Vector3,
  worldRadius: number,
  strength: number
) {
  if (pendingCount >= MAX_FLASHES || strength <= 0.01 || worldRadius <= 0) {
    return
  }
  const slot = pending[pendingCount]!
  slot.center.copy(worldCenter)
  slot.radius = worldRadius
  slot.strength = strength
  pendingCount += 1
}

const flashUniforms = Array.from({ length: MAX_FLASHES }, () => new Vector4())

const target = new WebGLRenderTarget(1, 1, {
  type: HalfFloatType,
  samples: 4,
})

const material = new ShaderMaterial({
  uniforms: {
    tScene: { value: target.texture },
    flashes: { value: flashUniforms },
    aspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tScene;
    uniform vec4 flashes[${MAX_FLASHES}];
    uniform float aspect;
    varying vec2 vUv;

    void main() {
      float mask = 0.0;
      for (int i = 0; i < ${MAX_FLASHES}; i++) {
        vec4 flash = flashes[i];
        if (flash.w <= 0.0) continue;
        float d = length((vUv - flash.xy) * vec2(aspect, 1.0));
        float edge = max(flash.z * 0.06, 0.0015);
        mask = max(mask, (1.0 - smoothstep(flash.z - edge, flash.z, d)) * flash.w);
      }
      if (mask <= 0.0) discard;

      gl_FragColor = vec4(texture2D(tScene, vUv).rgb, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      gl_FragColor = vec4(1.0 - gl_FragColor.rgb, clamp(mask, 0.0, 1.0));
    }
  `,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  toneMapped: true,
})

const triangle = new BufferGeometry()
triangle.setAttribute(
  "position",
  new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)
)
triangle.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2))

const quad = new Mesh(triangle, material)
quad.frustumCulled = false
const postScene = new Scene()
postScene.add(quad)
const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const bufferSize = new Vector2()
const projected = new Vector3()
const edge = new Vector3()
const right = new Vector3()

export function InvertPass() {
  useEffect(() => {
    return () => {
      pendingCount = 0
    }
  }, [])

  useFrame(({ gl, scene, camera }) => {
    const count = pendingCount
    pendingCount = 0

    let active = 0
    if (count > 0) {
      gl.getDrawingBufferSize(bufferSize)
      const aspect = bufferSize.x / Math.max(bufferSize.y, 1)
      right.setFromMatrixColumn(camera.matrixWorld, 0).normalize()

      for (let index = 0; index < count; index += 1) {
        const flash = pending[index]!
        projected.copy(flash.center).project(camera)
        if (projected.z < -1 || projected.z > 1) {
          continue
        }
        edge
          .copy(flash.center)
          .addScaledVector(right, flash.radius)
          .project(camera)
        const radius = Math.hypot(
          ((edge.x - projected.x) / 2) * aspect,
          (edge.y - projected.y) / 2
        )
        flashUniforms[active]!.set(
          (projected.x + 1) / 2,
          (projected.y + 1) / 2,
          radius,
          flash.strength
        )
        active += 1
      }
      material.uniforms.aspect.value = aspect
    }

    if (active === 0) {
      gl.render(scene, camera)
      return
    }

    for (let index = active; index < MAX_FLASHES; index += 1) {
      flashUniforms[index]!.set(0, 0, 0, 0)
    }

    if (target.width !== bufferSize.x || target.height !== bufferSize.y) {
      target.setSize(bufferSize.x, bufferSize.y)
    }

    gl.setRenderTarget(target)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.render(scene, camera)

    const autoClear = gl.autoClear
    gl.autoClear = false
    gl.render(postScene, postCamera)
    gl.autoClear = autoClear
  }, 1)

  return null
}
