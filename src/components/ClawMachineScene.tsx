import { Suspense, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, Sparkles } from '@react-three/drei';
import { Physics, type RapierRigidBody } from '@react-three/rapier';
import type { CapsuleEntity } from '../data/collectibles';
import { Cabinet } from './Cabinet';
import { CapsuleItem } from './CapsuleItem';
import { ClawRig, type ClawPhase } from './ClawRig';

interface ClawMachineSceneProps {
  seriesId: string;
  capsules: CapsuleEntity[];
  inputVector: { x: number; z: number };
  dropSignal: number;
  canPlay: boolean;
  isDropping: boolean;
  catchChance: number;
  onPhaseChange: (phase: ClawPhase) => void;
  onCapsuleWon: (uid: string) => void;
  onAttemptFinished: (grabbedSomething: boolean) => void;
}

export function ClawMachineScene({
  seriesId,
  capsules,
  inputVector,
  dropSignal,
  canPlay,
  isDropping,
  catchChance,
  onPhaseChange,
  onCapsuleWon,
  onAttemptFinished,
}: ClawMachineSceneProps) {
  const capsuleBodies = useRef<Map<string, RapierRigidBody>>(new Map());

  const registerBody = useCallback((uid: string, body: RapierRigidBody | null) => {
    if (body) {
      capsuleBodies.current.set(uid, body);
    } else {
      capsuleBodies.current.delete(uid);
    }
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: isMobile ? [0, 3.2, 8.8] : [0, 3.1, 6.9],
        fov: isMobile ? 48 : 44,
        near: 0.1,
        far: 50,
      }}
      className="h-full w-full touch-none"
    >
      <color attach="background" args={['#090714']} />
      <fog attach="fog" args={['#090714', 11, 26]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
      />
      <pointLight position={[0, 3.1, 0]} intensity={2.2} distance={7} color="#e0e7ff" />
      <pointLight position={[-1.5, 1.5, 0.5]} intensity={1.4} distance={5} color="#22d3ee" />
      <pointLight position={[1.5, 1.5, 0.5]} intensity={1.4} distance={5} color="#ec4899" />

      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />

        <Physics gravity={[0, -9.81, 0]}>
          <Cabinet
            seriesId={seriesId}
            inputVector={inputVector}
            isDropping={isDropping}
            onCapsuleEnteredChute={onCapsuleWon}
          />

          <ClawRig
            inputVector={inputVector}
            dropSignal={dropSignal}
            canPlay={canPlay}
            catchChance={catchChance}
            capsuleBodies={capsuleBodies}
            onPhaseChange={onPhaseChange}
            onAttemptFinished={onAttemptFinished}
          />

          {capsules.map((cap) => (
            <CapsuleItem key={cap.uid} capsule={cap} registerBody={registerBody} />
          ))}
        </Physics>

        <ContactShadows position={[0, -2.2, 0]} opacity={0.6} scale={12} blur={2.4} far={4} />

        {/* Subtle Neon Arcade Floor & Ambient Particles */}
        <mesh position={[0, -2.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[6.5, 48]} />
          <meshStandardMaterial color="#0e0a24" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, -2.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.4, 3.55, 64]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.35} />
        </mesh>
        <Sparkles count={40} scale={[7, 5.5, 6]} size={2.2} speed={0.35} color="#a855f7" opacity={0.45} />
      </Suspense>

      <OrbitControls
        target={[0, 1.25, 0]}
        enablePan={false}
        minDistance={4.2}
        maxDistance={10.5}
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.54}
        minAzimuthAngle={-Math.PI * 0.42}
        maxAzimuthAngle={Math.PI * 0.42}
      />
    </Canvas>
  );
}
