import { useEffect, useRef } from 'react';
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import type { CapsuleEntity } from '../data/collectibles';

interface CapsuleItemProps {
  capsule: CapsuleEntity;
  registerBody: (uid: string, body: RapierRigidBody | null) => void;
}

export function CapsuleItem({ capsule, registerBody }: CapsuleItemProps) {
  const bodyRef = useRef<RapierRigidBody | null>(null);
  const isGolden = Boolean(capsule.isGolden);

  useEffect(() => {
    registerBody(capsule.uid, bodyRef.current);
    return () => {
      registerBody(capsule.uid, null);
    };
  }, [capsule.uid, registerBody]);

  return (
    <RigidBody
      ref={bodyRef}
      position={capsule.position}
      colliders={false}
      restitution={0.32}
      friction={0.65}
      linearDamping={0.35}
      angularDamping={0.45}
      userData={{ capsuleUid: capsule.uid }}
    >
      <BallCollider args={[0.24]} />

      <group>
        {/* Top colored dome */}
        <mesh castShadow receiveShadow position={[0, 0.01, 0]}>
          <sphereGeometry args={[0.235, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color={capsule.shellColor}
            roughness={isGolden ? 0.15 : 0.22}
            metalness={isGolden ? 0.55 : 0.1}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            emissive={isGolden ? capsule.shellColor : '#000000'}
            emissiveIntensity={isGolden ? 0.35 : 0}
          />
        </mesh>

        {/* Bottom frosted white/translucent dome */}
        <mesh castShadow receiveShadow position={[0, -0.01, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.235, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#f1f5f9"
            roughness={0.25}
            metalness={0.05}
            transmission={0.35}
            thickness={0.2}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Center seam band */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.234, 0.016, 10, 28]} />
          <meshStandardMaterial
            color={capsule.accentColor}
            roughness={0.25}
            metalness={0.5}
            emissive={isGolden ? '#fde047' : '#000000'}
            emissiveIntensity={isGolden ? 0.5 : 0}
          />
        </mesh>

        {/* Inner mystery core silhouette */}
        <mesh>
          <octahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial
            color={capsule.shellColor}
            emissive={capsule.shellColor}
            emissiveIntensity={0.4}
            roughness={0.3}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
