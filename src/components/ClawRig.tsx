import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { soundEngine } from '../utils/sound';

export type ClawPhase =
  | 'idle'
  | 'dropping'
  | 'closing'
  | 'lifting'
  | 'returning'
  | 'releasing'
  | 'cooldown';

interface ClawRigProps {
  inputVector: { x: number; z: number };
  dropSignal: number;
  canPlay: boolean;
  capsuleBodies: React.MutableRefObject<Map<string, RapierRigidBody>>;
  onPhaseChange: (phase: ClawPhase) => void;
  onAttemptFinished: (grabbedSomething: boolean) => void;
}

const BOUNDS = {
  minX: -1.55,
  maxX: 1.55,
  minZ: -1.2,
  maxZ: 1.2,
  topY: 2.55,
  bottomY: 0.56,
  chuteX: -1.42,
  chuteZ: 1.08,
};

export function ClawRig({
  inputVector,
  dropSignal,
  canPlay,
  capsuleBodies,
  onPhaseChange,
  onAttemptFinished,
}: ClawRigProps) {
  const { rapier } = useRapier();

  const phaseRef = useRef<ClawPhase>('idle');
  const posRef = useRef(new THREE.Vector3(0, BOUNDS.topY, 0));
  const prongAngleRef = useRef(0.55); // 0.55 = open, 0.08 = closed
  const timerRef = useRef(0);
  const lastDropSignalRef = useRef(dropSignal);
  const moveSoundCooldownRef = useRef(0);

  const grabbedUidRef = useRef<string | null>(null);
  const grabOffsetRef = useRef(new THREE.Vector3(0, -0.34, 0));
  const attemptedGrabRef = useRef(false);

  // Visual refs for smooth 60fps animation without React re-renders
  const bridgeRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Mesh>(null);
  const clawHeadRef = useRef<THREE.Group>(null);
  const targetRingRef = useRef<THREE.Mesh>(null);
  const prongRefs = useRef<(THREE.Group | null)[]>([null, null, null]);
  const clawBodyRef = useRef<RapierRigidBody | null>(null);

  const [isGrabbingLight, setIsGrabbingLight] = useState(false);

  const setPhase = (next: ClawPhase) => {
    phaseRef.current = next;
    onPhaseChange(next);
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pos = posRef.current;
    const phase = phaseRef.current;

    // Detect new drop button press
    if (dropSignal !== lastDropSignalRef.current) {
      lastDropSignalRef.current = dropSignal;
      if (phase === 'idle' && canPlay) {
        attemptedGrabRef.current = false;
        setPhase('dropping');
        soundEngine.playDrop();
      }
    }

    if (phase === 'idle') {
      const speed = 1.65;
      const moving = Math.abs(inputVector.x) > 0.05 || Math.abs(inputVector.z) > 0.05;
      if (moving && canPlay) {
        pos.x = THREE.MathUtils.clamp(pos.x + inputVector.x * speed * dt, BOUNDS.minX, BOUNDS.maxX);
        pos.z = THREE.MathUtils.clamp(pos.z + inputVector.z * speed * dt, BOUNDS.minZ, BOUNDS.maxZ);

        moveSoundCooldownRef.current -= dt;
        if (moveSoundCooldownRef.current <= 0) {
          soundEngine.playMoveTick();
          moveSoundCooldownRef.current = 0.14;
        }
      }
      prongAngleRef.current = THREE.MathUtils.lerp(prongAngleRef.current, 0.55, dt * 8);
    } else if (phase === 'dropping') {
      pos.y -= 1.65 * dt;

      // Check if claw is right above a capsule so it stops at capsule height instead of crushing through
      let hitCapsuleY = BOUNDS.bottomY;
      capsuleBodies.current.forEach((body) => {
        const t = body.translation();
        const dx = t.x - pos.x;
        const dz = t.z - pos.z;
        const horizDist = Math.hypot(dx, dz);
        if (horizDist < 0.36 && t.y + 0.36 > hitCapsuleY && t.y < pos.y) {
          hitCapsuleY = Math.max(hitCapsuleY, t.y + 0.34);
        }
      });

      if (pos.y <= hitCapsuleY) {
        pos.y = hitCapsuleY;
        timerRef.current = 0;
        setPhase('closing');
        soundEngine.playGrab();
      }
    } else if (phase === 'closing') {
      timerRef.current += dt;
      prongAngleRef.current = THREE.MathUtils.lerp(prongAngleRef.current, 0.1, dt * 10);

      if (timerRef.current >= 0.45) {
        // Attempt to grab nearest capsule within claw pocket
        let bestUid: string | null = null;
        let bestDist = 0.44; // grab radius

        capsuleBodies.current.forEach((body, uid) => {
          const t = body.translation();
          const horiz = Math.hypot(t.x - pos.x, t.z - pos.z);
          const vert = Math.abs(t.y - (pos.y - 0.32));
          const total = Math.hypot(horiz, vert * 0.7);
          if (total < bestDist && t.y > -0.1) {
            bestDist = total;
            bestUid = uid;
          }
        });

        if (bestUid) {
          const body = capsuleBodies.current.get(bestUid);
          if (body) {
            // Switch capsule to kinematic so it travels smoothly inside the closed prongs
            body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
            const t = body.translation();
            grabOffsetRef.current.set(
              THREE.MathUtils.clamp(t.x - pos.x, -0.08, 0.08),
              -0.32,
              THREE.MathUtils.clamp(t.z - pos.z, -0.08, 0.08)
            );
            grabbedUidRef.current = bestUid;
            attemptedGrabRef.current = true;
            setIsGrabbingLight(true);
          }
        }
        setPhase('lifting');
      }
    } else if (phase === 'lifting') {
      pos.y += 1.45 * dt;
      if (pos.y >= BOUNDS.topY) {
        pos.y = BOUNDS.topY;
        setPhase('returning');
      }
    } else if (phase === 'returning') {
      const targetX = BOUNDS.chuteX;
      const targetZ = BOUNDS.chuteZ;
      const dx = targetX - pos.x;
      const dz = targetZ - pos.z;
      const dist = Math.hypot(dx, dz);
      const returnSpeed = 1.9;

      if (dist <= returnSpeed * dt) {
        pos.x = targetX;
        pos.z = targetZ;
        timerRef.current = 0;
        setPhase('releasing');
      } else {
        pos.x += (dx / dist) * returnSpeed * dt;
        pos.z += (dz / dist) * returnSpeed * dt;
      }
    } else if (phase === 'releasing') {
      timerRef.current += dt;
      prongAngleRef.current = THREE.MathUtils.lerp(prongAngleRef.current, 0.58, dt * 10);

      if (grabbedUidRef.current) {
        const body = capsuleBodies.current.get(grabbedUidRef.current);
        if (body) {
          body.setBodyType(rapier.RigidBodyType.Dynamic, true);
          body.setLinvel({ x: 0, y: -0.8, z: 0 }, true);
          body.wakeUp();
        }
        grabbedUidRef.current = null;
        setIsGrabbingLight(false);
      }

      if (timerRef.current >= 0.45) {
        timerRef.current = 0;
        setPhase('cooldown');
        if (!attemptedGrabRef.current) {
          soundEngine.playEmpty();
        }
        onAttemptFinished(attemptedGrabRef.current);
      }
    } else if (phase === 'cooldown') {
      timerRef.current += dt;
      if (timerRef.current >= 0.35) {
        setPhase('idle');
      }
    }

    // Carry grabbed capsule smoothly
    if (grabbedUidRef.current) {
      const body = capsuleBodies.current.get(grabbedUidRef.current);
      if (body) {
        body.setNextKinematicTranslation({
          x: pos.x + grabOffsetRef.current.x,
          y: pos.y + grabOffsetRef.current.y,
          z: pos.z + grabOffsetRef.current.z,
        });
      }
    }

    // Update kinematic collider for claw head
    if (clawBodyRef.current) {
      clawBodyRef.current.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z });
    }

    // Update 3D gantry & claw visuals
    if (bridgeRef.current) {
      bridgeRef.current.position.z = pos.z;
    }
    if (trolleyRef.current) {
      trolleyRef.current.position.x = pos.x;
    }
    if (clawHeadRef.current) {
      clawHeadRef.current.position.set(pos.x, pos.y, pos.z);
    }
    if (cableRef.current) {
      const railY = 3.45;
      const cableLen = Math.max(0.1, railY - pos.y);
      cableRef.current.position.set(pos.x, pos.y + cableLen / 2, pos.z);
      cableRef.current.scale.set(1, cableLen, 1);
    }
    if (targetRingRef.current) {
      targetRingRef.current.position.set(pos.x, 0.015, pos.z);
      targetRingRef.current.visible = phase === 'idle';
    }

    // Animate 3 articulated prongs
    prongRefs.current.forEach((prong) => {
      if (prong) {
        prong.rotation.z = prongAngleRef.current;
      }
    });
  });

  return (
    <group>
      {/* Overhead Gantry Side Rails */}
      <mesh position={[-1.85, 3.45, 0]}>
        <boxGeometry args={[0.08, 0.08, 3.1]} />
        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[1.85, 3.45, 0]}>
        <boxGeometry args={[0.08, 0.08, 3.1]} />
        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Moving Z-Bridge */}
      <group ref={bridgeRef} position={[0, 3.45, 0]}>
        <mesh>
          <boxGeometry args={[3.75, 0.09, 0.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Moving X-Trolley */}
        <group ref={trolleyRef} position={[0, -0.05, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.16, 0.24]} />
            <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.4} metalness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Telescoping Cable */}
      <mesh ref={cableRef} position={[0, 3.0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Floor Target Aim Ring */}
      <mesh ref={targetRingRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 28]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.65} />
      </mesh>

      {/* Kinematic Physics Body for Claw Head */}
      <RigidBody ref={clawBodyRef} type="kinematicPosition" colliders="ball" position={[0, BOUNDS.topY, 0]}>
        <mesh visible={false}>
          <sphereGeometry args={[0.14]} />
        </mesh>
      </RigidBody>

      {/* Visual 3-Prong Claw Head */}
      <group ref={clawHeadRef} position={[0, BOUNDS.topY, 0]}>
        {/* Hub */}
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.18, 0.2, 16]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.8}
            roughness={0.2}
            emissive={isGrabbingLight ? '#22d3ee' : '#000000'}
            emissiveIntensity={isGrabbingLight ? 0.6 : 0}
          />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.7} />
        </mesh>

        {/* 3 Articulated Prongs */}
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((yaw, i) => (
          <group key={i} rotation={[0, yaw, 0]}>
            <group
              ref={(el) => {
                prongRefs.current[i] = el;
              }}
              position={[0.13, -0.06, 0]}
              rotation={[0, 0, 0.55]}
            >
              {/* Upper arm */}
              <mesh castShadow position={[0.08, -0.14, 0]} rotation={[0, 0, 0.45]}>
                <boxGeometry args={[0.045, 0.3, 0.05]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Lower curved tip */}
              <mesh castShadow position={[0.05, -0.34, 0]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[0.04, 0.24, 0.045]} />
                <meshStandardMaterial color="#22d3ee" metalness={0.6} roughness={0.25} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
