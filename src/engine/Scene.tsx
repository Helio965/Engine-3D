import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, AdaptiveDpr } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, Outline, SMAA, Selection } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useApp } from '../state/appStore';
import type { EngineDefinition } from '../types/engine';
import { EngineRenderer } from './EngineRenderer';
import { SimulationDriver } from './SimulationDriver';
import { CameraRig } from './CameraRig';
import type { EngineModelContext } from './EngineContext';
import type { EngineModelModule } from './models/types';
import { TourDirector } from './TourDirector';

/**
 * Studio scene: dark graphite backdrop, discreet platform, key + rim lights,
 * a procedural studio environment (Lightformers — no external HDRI) and
 * quality-dependent post-processing.
 */
export function Scene({ def, onModel }: { def: EngineDefinition; onModel?: (ctx: EngineModelContext, mod: EngineModelModule) => void }) {
  const quality = useApp((s) => s.graphics);
  const [model, setModel] = useState<{ ctx: EngineModelContext; mod: EngineModelModule } | null>(null);
  const handleReady = useCallback(
    (ctx: EngineModelContext, mod: EngineModelModule) => {
      setModel({ ctx, mod });
      onModel?.(ctx, mod);
    },
    [onModel],
  );
  const dpr: [number, number] = quality === 'low' ? [0.75, 1] : quality === 'medium' ? [1, 1.5] : [1, 2];
  const shadows = quality === 'high' || quality === 'ultra';

  return (
    <Canvas
      dpr={dpr}
      shadows={shadows ? 'soft' : false}
      camera={{ position: [1.6, 1.0, 1.6], fov: 34, near: 0.01, far: 60 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.localClippingEnabled = true;
      }}
      aria-label={`Motor 3D interativo: ${def.manufacturer} ${def.vehicle} — ${def.engine.name}`}
    >
      <color attach="background" args={['#0d0e10']} />
      <fog attach="fog" args={['#0d0e10', 6, 16]} />
      <SimulationDriver />
      <Lights shadows={shadows} quality={quality} />
      <Selection>
        <EngineRenderer key={`${def.id}-${quality}`} def={def} onReady={handleReady} />
        <Platform />
        {quality !== 'low' && (
          <EffectComposer multisampling={quality === 'ultra' ? 4 : 0} autoClear={false}>
            <Outline blur visibleEdgeColor={0xff7a2e} hiddenEdgeColor={0x8a3a12} edgeStrength={4} width={900} />
            {quality === 'high' || quality === 'ultra' ? (
              <N8AO aoRadius={0.08} intensity={1.6} distanceFalloff={0.5} quality={quality === 'ultra' ? 'high' : 'medium'} halfRes={quality !== 'ultra'} />
            ) : (
              <></>
            )}
            {quality === 'high' || quality === 'ultra' ? <Bloom luminanceThreshold={1.0} intensity={0.5} mipmapBlur /> : <></>}
            <SMAA />
          </EffectComposer>
        )}
      </Selection>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.65} scale={4} blur={2.4} far={1.2} resolution={quality === 'low' ? 256 : 512} frames={quality === 'low' ? 1 : Infinity} />
      <CameraRig ctx={model?.ctx ?? null} mod={model?.mod ?? null} />
      <TourDirector ctx={model?.ctx ?? null} mod={model?.mod ?? null} />
      {quality !== 'ultra' && <AdaptiveDpr pixelated={false} />}
    </Canvas>
  );
}

function Lights({ shadows, quality }: { shadows: boolean; quality: string }) {
  const res = quality === 'ultra' ? 512 : quality === 'high' ? 256 : quality === 'medium' ? 128 : 64;
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight
        position={[2.2, 3.4, 1.8]}
        intensity={2.1}
        color="#fff3e6"
        castShadow={shadows}
        shadow-mapSize={[quality === 'ultra' ? 2048 : 1024, quality === 'ultra' ? 2048 : 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
        shadow-camera-left={-1.4}
        shadow-camera-right={1.4}
        shadow-camera-top={1.4}
        shadow-camera-bottom={-1.4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-2.6, 1.6, -2.2]} intensity={1.4} color="#a9c6ff" />
      <spotLight position={[0, 3.2, -2.8]} angle={0.5} penumbra={0.8} intensity={14} color="#ffd9b0" />
      <Environment resolution={res} frames={1}>
        {/* procedural studio: soft boxes and strip lights */}
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 2.2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe7cf" position={[4, 1.5, 2]} rotation={[0, -Math.PI / 2.4, 0]} scale={[3, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#cfe0ff" position={[-4, 1.2, -1.5]} rotation={[0, Math.PI / 2.2, 0]} scale={[3, 0.8, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 1.5, -4]} scale={2.2} />
        <Lightformer form="rect" intensity={0.5} color="#ff8a3d" position={[0, -1, 4]} rotation={[0, Math.PI, 0]} scale={[6, 0.4, 1]} />
      </Environment>
    </>
  );
}

function Platform() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[2.1, 96]} />
        <meshStandardMaterial color="#17181b" metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]}>
        <ringGeometry args={[2.06, 2.1, 128]} />
        <meshBasicMaterial color="#ff6a1f" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#0e0f11" metalness={0.1} roughness={0.9} />
      </mesh>
    </group>
  );
}
