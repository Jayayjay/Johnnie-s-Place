import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Preload, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import styles from './Bottle3D.module.css'

const MODEL = '/models/wine_bottle.glb'

const SPIN_SPEED = 0.2            // rad/s — a slow turn (~31s per revolution)
const TILT = -42 * Math.PI / 180 // constant 42° lean, applied on all viewports

// The bottle is a persistent backdrop that pans horizontally as you scroll: it
// swaps sides every viewport height — screen 0 = right, 1 = left, 2 = right, …
// `pan` is the travel amplitude in world units; narrow screens pan less so the
// bottle never leaves frame.
const DESKTOP = { lookY: 0,    size: 7, camZ: 15, tilt: TILT, pan: 3.6 }
const MOBILE  = { lookY: -0.3, size: 6, camZ: 16, tilt: TILT, pan: 1.1 }

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
function Bottles({ pointerRef, targetSize, tilt, pan, progressRef }) {
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

  const outer = useRef()   // horizontal pan (scroll) + the constant lean + cursor lean
  const spinner = useRef() // pure spin about the model's own (long) axis
  const spinY = useRef(0)
  useFrame((_, dt) => {
    // Pure, slow rotation about the model's local Y — its own long axis. Because
    // this group sits inside the leaned `outer` group, that axis is the tilted
    // axis, so the bottle spins on its own axis no matter the lean.
    if (spinner.current) {
      spinY.current += dt * SPIN_SPEED
      spinner.current.rotation.y = spinY.current
    }

    if (outer.current) {
      // Base 42° lean + a gentle cursor-driven lean (kept off the spin group so it
      // never skews the spin axis). Damped.
      const { x, y } = pointerRef.current
      const kl = 1 - Math.pow(0.0001, dt)
      outer.current.rotation.z = THREE.MathUtils.lerp(outer.current.rotation.z, tilt + x * 0.12, kl)
      outer.current.rotation.x = THREE.MathUtils.lerp(outer.current.rotation.x, y * 0.16, kl)

      // Slide horizontally as you scroll: right → left → right, swapping sides each
      // viewport height (progress counts screens scrolled).
      const targetX = pan * Math.cos(Math.PI * progressRef.current)
      outer.current.position.x = THREE.MathUtils.lerp(
        outer.current.position.x, targetX, 1 - Math.pow(0.004, dt)
      )
    }
  })

  return (
    <group ref={outer} rotation={[0, 0, tilt]}>
      <group ref={spinner}>
        <primitive object={model} />
      </group>
    </group>
  )
}

// Static front-on camera. The bottle slides horizontally (translated in Bottles),
// so the camera stays put and the bottle never skews off-axis.
function CameraRig({ frame }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 2.0, frame.camZ)
    camera.lookAt(0, frame.lookY, 0)
  }, [camera, frame])
  return null
}

function Scene({ progressRef, pointerRef, frame }) {
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
        <Bottles
          pointerRef={pointerRef}
          targetSize={frame.size}
          tilt={frame.tilt}
          pan={frame.pan}
          progressRef={progressRef}
        />
        <Preload all />
      </Suspense>

      <CameraRig frame={frame} />
    </>
  )
}

export default function Bottle3D() {
  const { narrow } = useDisplayMode()
  // The bottle's spin + scroll-pan are a deliberate design feature the user asked
  // for, so they run regardless of prefers-reduced-motion. (`narrow` still switches
  // to the mobile framing/tilt.)
  const frame = narrow ? MOBILE : DESKTOP
  const progressRef = useRef(0)
  const layerRef = useRef(null)
  // Normalised cursor position (-1..1). Updated from window mousemove so the bottle
  // reacts to the cursor without the canvas intercepting clicks on the hero buttons.
  const pointerRef = useRef({ x: 0, y: 0 })

  // Track scroll position: drives the right → left → right pan. The layer stays
  // visible throughout, dipping only near the very bottom so it doesn't fight the footer.
  useEffect(() => {
    let raf = 0
    const update = () => {
      // Pan phase = screens scrolled (0, 1, 2, …) so the bottle swaps sides each
      // viewport height. Opacity fade uses whole-document progress near the bottom.
      const vh = window.innerHeight || 1
      progressRef.current = window.scrollY / vh
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const docP = max > 0 ? window.scrollY / max : 0
      if (layerRef.current) {
        const fade = docP > 0.92 ? 1 - (docP - 0.92) / 0.08 : 1
        layerRef.current.style.opacity = String(Math.max(0.25, fade))
      }
      raf = 0
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

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
        <Scene progressRef={progressRef} pointerRef={pointerRef} frame={frame} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL)
