import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Preload, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import styles from './Bottle3D.module.css'

const MODEL = '/models/wine_bottle.glb'

// The camera looks at this point, so it lands at screen centre. Putting it down-left
// of the (origin-centred) shelf parks the shelf in the upper-right of the hero,
// up near the headline. Tune these to move the cluster around the screen.
const SPIN_SPEED = 0.5  // rad/s

// Framing differs by viewport: on desktop the bottle sits to the right of the
// headline; on narrow screens it's centred and a touch smaller so it's fully
// visible behind the hero text.
const DESKTOP = { lookX: -2.8, lookY: 0,    size: 7, camZ: 15, tilt: 0 }
const MOBILE  = { lookX: 0,    lookY: -0.3, size: 6, camZ: 16, tilt: -0.5 } // ~29° lean

// Decide how to present the 3D:
//  - still:   render a static scene (no animation) for reduced-motion users
//  - narrow:  use the mobile framing
// WebGL itself is attempted on every device (an ErrorBoundary covers failures).
function useDisplayMode() {
  const read = () => {
    if (typeof window === 'undefined') return { still: false, narrow: false }
    return {
      still: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      narrow: window.matchMedia('(max-width: 760px)').matches,
    }
  }
  const [mode, setMode] = useState(read)
  useEffect(() => {
    const onChange = () => setMode(read())
    const mqls = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(max-width: 760px)'),
    ]
    mqls.forEach((m) => m.addEventListener('change', onChange))
    return () => mqls.forEach((m) => m.removeEventListener('change', onChange))
  }, [])
  return mode
}

// Center the bottle at the origin and scale it to a consistent on-screen size.
function Bottles({ spin, pointerRef, targetSize, tilt }) {
  const { scene } = useGLTF(MODEL)
  const model = useMemo(() => {
    const root = scene.clone(true)
    const box = new THREE.Box3().setFromObject(root)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = targetSize / Math.max(size.x, size.y, size.z)
    // Fully centre the model (x, y, z) so it spins in place around its own axis.
    root.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    root.scale.setScalar(scale)
    return root
  }, [scene, targetSize])

  const group = useRef()
  const spinY = useRef(0)
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    // Continuous auto-spin…
    if (spin) spinY.current += dt * SPIN_SPEED
    // …plus a cursor-driven lean: the bottle tips toward the pointer and gets an
    // extra yaw nudge from the horizontal cursor position. Damped for smoothness.
    const { x, y } = pointerRef.current
    const targetYaw = spinY.current + x * 0.6
    const targetPitch = y * 0.35
    const k = 1 - Math.pow(0.0001, dt)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetYaw, k)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetPitch, k)
  })

  // Outer group applies a constant lean (used on mobile); inner group spins,
  // so the bottle rotates cleanly about its own tilted axis.
  return (
    <group rotation={[0, 0, tilt]}>
      <group ref={group}>
        <primitive object={model} />
      </group>
    </group>
  )
}

// Drive the camera along a short orbit as the page scrolls — the r3f analogue of
// the jewelry reference's cam-view scroll stages. When `animate` is false it just
// parks the camera at a flattering static framing (reduced-motion).
function CameraRig({ progressRef, animate, frame }) {
  const { camera } = useThree()
  const look = useMemo(() => new THREE.Vector3(frame.lookX, frame.lookY, 0), [frame])
  useFrame((_, dt) => {
    const p = animate ? progressRef.current : 0
    // Mostly front-on; a slight dolly-in as you scroll. The bottle itself spins,
    // so the whole label comes around over the rotation.
    const z = THREE.MathUtils.lerp(frame.camZ, frame.camZ - 3, p)
    const y = THREE.MathUtils.lerp(2.2, 1.4, p)
    const desired = new THREE.Vector3(-0.5, y, z)
    if (animate) camera.position.lerp(desired, 1 - Math.pow(0.0025, dt))
    else camera.position.copy(desired)
    camera.lookAt(look)
  })
  return null
}

function Scene({ progressRef, animate, pointerRef, frame }) {
  return (
    <>
      <color attach="background" args={['#0b0906']} />
      <fog attach="fog" args={['#0b0906', 22, 46]} />

      <ambientLight intensity={0.9} color="#f3ddb0" />
      <directionalLight position={[6, 12, 8]} intensity={3} color="#ffe9bd" castShadow={false} />
      <directionalLight position={[-9, 7, -5]} intensity={1.4} color="#6f8ad0" />
      <spotLight position={[0, 10, 10]} angle={0.6} penumbra={1} intensity={120} color="#ffd98a" distance={40} />
      <pointLight position={[3, 3, 6]} intensity={40} color="#d99a3a" distance={26} />
      <pointLight position={[-5, 2, 4]} intensity={18} color="#b9643c" distance={22} />

      <Suspense fallback={null}>
        {/* Local studio environment so the glass bottles catch highlights — no CDN. */}
        <Environment resolution={256} frames={1} background={false}>
          <Lightformer intensity={2.6} position={[0, 4, 6]} scale={[10, 8, 1]} color="#ffe6b8" />
          <Lightformer intensity={1.4} position={[-6, 2, 2]} scale={[6, 10, 1]} color="#ffcf8f" />
          <Lightformer intensity={1.0} position={[6, 1, -3]} scale={[6, 10, 1]} color="#7f93c8" />
          <Lightformer intensity={1.8} position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} color="#fff2d6" />
        </Environment>
        <Bottles spin={animate} pointerRef={pointerRef} targetSize={frame.size} tilt={frame.tilt} />
        <Preload all />
      </Suspense>

      <CameraRig progressRef={progressRef} animate={animate} frame={frame} />
    </>
  )
}

export default function Bottle3D() {
  const { still, narrow } = useDisplayMode()
  const animate = !still
  const frame = narrow ? MOBILE : DESKTOP
  const progressRef = useRef(0)
  const layerRef = useRef(null)
  // Normalised cursor position (-1..1). Updated from window mousemove so the bottle
  // reacts to the cursor without the canvas intercepting clicks on the hero buttons.
  const pointerRef = useRef({ x: 0, y: 0 })

  // Track scroll over the first ~1.6 screens: drives the camera + fades the layer.
  useEffect(() => {
    if (!animate) return
    let frame = 0
    const update = () => {
      const span = window.innerHeight * 1.6
      const p = Math.min(1, Math.max(0, window.scrollY / span))
      progressRef.current = p
      if (layerRef.current) layerRef.current.style.opacity = String(Math.max(0, 1 - p * 1.15))
      frame = 0
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [animate])

  // Cursor tracking for the bottle's lean/parallax (desktop pointers only).
  useEffect(() => {
    const onMove = (e) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className={styles.layer} ref={layerRef} aria-hidden="true">
      <Canvas
        className={styles.canvas}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [-0.5, 2.2, frame.camZ], fov: 44, near: 0.1, far: 100 }}
      >
        <Scene progressRef={progressRef} animate={animate} pointerRef={pointerRef} frame={frame} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL)
