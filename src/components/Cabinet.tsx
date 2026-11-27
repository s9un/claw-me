import { Text } from '@react-three/drei';
import { CuboidCollider, RigidBody, type IntersectionEnterPayload } from '@react-three/rapier';

interface CabinetProps {
  inputVector: { x: number; z: number };
  isDropping: boolean;
  onCapsuleEnteredChute: (uid: string) => void;
}

export function Cabinet({ inputVector, isDropping, onCapsuleEnteredChute }: CabinetProps) {
  const handleChuteEnter = (payload: IntersectionEnterPayload) => {
    const userData = payload.other.rigidBody?.userData as { capsuleUid?: string } | undefined;
    if (userData?.capsuleUid) {
      onCapsuleEnteredChute(userData.capsuleUid);
    }
  };

  return (
    <group>
      {/* ==================== PHYSICS COLLIDERS ==================== */}
      <RigidBody type="fixed" colliders={false}>
        {/* Back floor section: x in [-2.0, 2.0], z in [-1.6, 0.55] */}
        <CuboidCollider args={[2.0, 0.1, 1.075]} position={[0, -0.1, -0.525]} />
        {/* Front-right floor section: x in [-0.85, 2.0], z in [0.55, 1.6] */}
        <CuboidCollider args={[1.425, 0.1, 0.525]} position={[0.575, -0.1, 1.075]} />

        {/* Chute divider walls (prevent capsules from rolling into chute prematurely) */}
        <CuboidCollider args={[0.04, 0.28, 0.55]} position={[-0.85, 0.28, 1.075]} />
        <CuboidCollider args={[0.58, 0.28, 0.04]} position={[-1.42, 0.28, 0.55]} />

        {/* Outer playfield walls */}
        <CuboidCollider args={[0.1, 2.0, 1.7]} position={[-2.08, 1.8, 0]} />
        <CuboidCollider args={[0.1, 2.0, 1.7]} position={[2.08, 1.8, 0]} />
        <CuboidCollider args={[2.1, 2.0, 0.1]} position={[0, 1.8, -1.68]} />
        <CuboidCollider args={[2.1, 2.0, 0.1]} position={[0, 1.8, 1.68]} />
        {/* Chute lower catch walls */}
        <CuboidCollider args={[0.1, 0.6, 0.6]} position={[-2.05, -0.5, 1.08]} />
        <CuboidCollider args={[0.6, 0.6, 0.1]} position={[-1.42, -0.5, 1.65]} />
      </RigidBody>

      {/* Prize Chute Sensor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[0.52, 0.25, 0.48]}
          position={[-1.42, -0.45, 1.08]}
          sensor
          onIntersectionEnter={handleChuteEnter}
        />
      </RigidBody>

      {/* ==================== VISUAL CABINET ==================== */}
      {/* Playfield Floor */}
      <mesh receiveShadow position={[0, -0.05, -0.525]}>
        <boxGeometry args={[4.0, 0.1, 2.15]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh receiveShadow position={[0.575, -0.05, 1.075]}>
        <boxGeometry args={[2.85, 0.1, 1.05]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Subtle grid pattern on floor */}
      <gridHelper args={[3.9, 12, '#4338ca', '#312e81']} position={[0, 0.002, 0]} />

      {/* Chute glowing rim & dividers */}
      <mesh castShadow receiveShadow position={[-0.85, 0.28, 1.075]}>
        <boxGeometry args={[0.07, 0.56, 1.06]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.42, 0.28, 0.55]}>
        <boxGeometry args={[1.16, 0.56, 0.07]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      {/* Chute dark interior */}
      <mesh position={[-1.42, -0.45, 1.08]}>
        <boxGeometry args={[1.1, 0.85, 1.0]} />
        <meshStandardMaterial color="#090714" roughness={0.9} />
      </mesh>
      <Text
        position={[-1.42, 0.58, 0.55]}
        fontSize={0.14}
        color="#fbcfe8"
        anchorX="center"
        anchorY="bottom"
      >
        DROP ZONE
      </Text>

      {/* Lower Cabinet Base */}
      <mesh castShadow receiveShadow position={[0, -1.15, 0]}>
        <boxGeometry args={[4.3, 2.1, 3.5]} />
        <meshStandardMaterial color="#141129" roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Neon Base Accent Strips */}
      <mesh position={[0, -0.12, 1.76]}>
        <boxGeometry args={[4.32, 0.08, 0.05]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, -2.15, 1.76]}>
        <boxGeometry args={[4.32, 0.08, 0.05]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={1.2} />
      </mesh>

      {/* Front Control Console Deck */}
      <mesh castShadow receiveShadow position={[0.35, -0.35, 1.98]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[3.4, 0.32, 0.65]} />
        <meshStandardMaterial color="#251f47" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* 3D Animated Joystick on Console */}
      <group position={[-0.45, -0.15, 2.02]} rotation={[inputVector.z * 0.28, 0, -inputVector.x * 0.28]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.035, 0.24, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={0.4} roughness={0.2} />
        </mesh>
      </group>

      {/* 3D Arcade Drop Button on Console */}
      <group position={[0.55, -0.16, 2.02]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.18, 0.06, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0, isDropping ? 0.01 : 0.05, 0]}>
          <cylinderGeometry args={[0.12, 0.13, 0.08, 20]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#22d3ee"
            emissiveIntensity={isDropping ? 1.8 : 0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Prize Retrieval Flap on Front-Left */}
      <mesh position={[-1.42, -1.25, 1.76]}>
        <boxGeometry args={[0.95, 0.8, 0.06]} />
        <meshStandardMaterial color="#090714" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 4 Corner Pillars */}
      {[
        [-2.05, 1.8, -1.65],
        [2.05, 1.8, -1.65],
        [-2.05, 1.8, 1.65],
        [2.05, 1.8, 1.65],
      ].map(([px, py, pz], idx) => (
        <mesh key={idx} castShadow position={[px, py, pz]}>
          <boxGeometry args={[0.18, 3.7, 0.18]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* Back Wall (glossy dark arcade backdrop) */}
      <mesh receiveShadow position={[0, 1.8, -1.66]}>
        <boxGeometry args={[4.1, 3.6, 0.08]} />
        <meshStandardMaterial color="#130f2b" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Interior Neon Vertical Light Bars */}
      <mesh position={[-1.92, 1.8, -1.55]}>
        <boxGeometry args={[0.05, 3.3, 0.05]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[1.92, 1.8, -1.55]}>
        <boxGeometry args={[0.05, 3.3, 0.05]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={1.5} />
      </mesh>

      {/* Top Canopy & Marquee Header */}
      <mesh castShadow position={[0, 3.85, 0]}>
        <boxGeometry args={[4.35, 0.55, 3.55]} />
        <meshStandardMaterial color="#1a1438" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Glowing Marquee Sign */}
      <mesh position={[0, 3.88, 1.79]}>
        <boxGeometry args={[3.7, 0.42, 0.06]} />
        <meshStandardMaterial color="#3b0764" emissive="#9333ea" emissiveIntensity={0.65} />
      </mesh>
      <Text
        position={[0, 3.88, 1.84]}
        fontSize={0.28}
        color="#fef08a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        CAPIT
      </Text>

      {/* Transparent Glass Panels (Front, Left, Right) */}
      <mesh position={[0, 1.8, 1.65]}>
        <planeGeometry args={[3.92, 3.5]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.11}
          roughness={0.05}
          metalness={0.1}
          reflectivity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-2.04, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.15, 3.5]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.1}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[2.04, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.15, 3.5]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.1}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
