import { Text } from '@react-three/drei';
import { CuboidCollider, RigidBody, type IntersectionEnterPayload } from '@react-three/rapier';

interface CabinetProps {
  seriesId: string;
  inputVector: { x: number; z: number };
  isDropping: boolean;
  onCapsuleEnteredChute: (uid: string) => void;
}

function PawPrint({
  position,
  color = '#fb7185',
  scale = 1,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Main pad */}
      <mesh>
        <sphereGeometry args={[0.14, 14, 14]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      {/* 3 toe beans */}
      <mesh position={[-0.13, 0.14, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0.13, 0.14, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  );
}

export function Cabinet({
  seriesId,
  inputVector,
  isDropping,
  onCapsuleEnteredChute,
}: CabinetProps) {
  const isAnimalTheme = seriesId === 'first-edition';

  const theme = isAnimalTheme
    ? {
        body: '#fef3c7', // warm cream
        deck: '#fb7185', // coral pink
        pillar: '#fdba74', // soft peach/orange
        floor: '#4ade80', // meadow grass green
        backWall: '#bae6fd', // sky blue
        chuteWall: '#f43f5e',
        marqueeBg: '#fb7185',
        marqueeText: '#fffbeb',
        trimA: '#f59e0b',
        trimB: '#38bdf8',
        subtitle: 'FIRST EDITION',
      }
    : {
        body: '#110d26',
        deck: '#231c47',
        pillar: '#181238',
        floor: '#1a1442',
        backWall: '#110c28',
        chuteWall: '#ec4899',
        marqueeBg: '#3b0764',
        marqueeText: '#fef08a',
        trimA: '#22d3ee',
        trimB: '#ec4899',
        subtitle: 'NEON CYBER',
      };

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
        <CuboidCollider args={[2.0, 0.1, 1.075]} position={[0, -0.1, -0.525]} />
        <CuboidCollider args={[1.425, 0.1, 0.525]} position={[0.575, -0.1, 1.075]} />

        <CuboidCollider args={[0.04, 0.28, 0.55]} position={[-0.85, 0.28, 1.075]} />
        <CuboidCollider args={[0.58, 0.28, 0.04]} position={[-1.42, 0.28, 0.55]} />

        <CuboidCollider args={[0.1, 2.0, 1.7]} position={[-2.08, 1.8, 0]} />
        <CuboidCollider args={[0.1, 2.0, 1.7]} position={[2.08, 1.8, 0]} />
        <CuboidCollider args={[2.1, 2.0, 0.1]} position={[0, 1.8, -1.68]} />
        <CuboidCollider args={[2.1, 2.0, 0.1]} position={[0, 1.8, 1.68]} />

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
      {/* Playfield Floor (Meadow Grass for Animal Edition) */}
      <mesh receiveShadow position={[0, -0.05, -0.525]}>
        <boxGeometry args={[4.0, 0.1, 2.15]} />
        <meshStandardMaterial color={theme.floor} roughness={0.75} />
      </mesh>
      <mesh receiveShadow position={[0.575, -0.05, 1.075]}>
        <boxGeometry args={[2.85, 0.1, 1.05]} />
        <meshStandardMaterial color={theme.floor} roughness={0.75} />
      </mesh>

      {/* Chute Dividers */}
      <mesh castShadow receiveShadow position={[-0.85, 0.28, 1.075]}>
        <boxGeometry args={[0.08, 0.56, 1.08]} />
        <meshStandardMaterial color={theme.chuteWall} roughness={0.35} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.42, 0.28, 0.55]}>
        <boxGeometry args={[1.18, 0.56, 0.08]} />
        <meshStandardMaterial color={theme.chuteWall} roughness={0.35} />
      </mesh>
      <mesh position={[-1.42, -0.45, 1.08]}>
        <boxGeometry args={[1.1, 0.85, 1.0]} />
        <meshStandardMaterial color="#1e1b2e" roughness={0.9} />
      </mesh>
      <Text
        position={[-1.42, 0.61, 0.55]}
        fontSize={0.14}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        DROP ZONE
      </Text>

      {/* Lower Cabinet Base */}
      <mesh castShadow receiveShadow position={[0, -1.15, 0]}>
        <boxGeometry args={[4.3, 2.1, 3.5]} />
        <meshStandardMaterial color={theme.body} roughness={0.45} />
      </mesh>

      {/* Trim Strips */}
      <mesh position={[0, -0.11, 1.76]}>
        <boxGeometry args={[4.34, 0.1, 0.06]} />
        <meshStandardMaterial color={theme.trimA} roughness={0.3} />
      </mesh>
      <mesh position={[0, -2.14, 1.76]}>
        <boxGeometry args={[4.34, 0.1, 0.06]} />
        <meshStandardMaterial color={theme.trimB} roughness={0.3} />
      </mesh>

      {/* Front Control Console Deck */}
      <mesh castShadow receiveShadow position={[0.35, -0.35, 1.98]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[3.4, 0.32, 0.68]} />
        <meshStandardMaterial color={theme.deck} roughness={0.35} />
      </mesh>

      {/* 3D Animated Joystick */}
      <group
        position={[-0.45, -0.15, 2.02]}
        rotation={[inputVector.z * 0.28, 0, -inputVector.x * 0.28]}
      >
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.14, 0.16, 0.04, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.035, 0.24, 12]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <sphereGeometry args={[0.095, 18, 18]} />
          <meshStandardMaterial color="#facc15" roughness={0.2} />
        </mesh>
      </group>

      {/* 3D Arcade Drop Button */}
      <group position={[0.55, -0.16, 2.02]}>
        <mesh>
          <cylinderGeometry args={[0.17, 0.19, 0.06, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.35} />
        </mesh>
        <mesh position={[0, isDropping ? 0.01 : 0.055, 0]}>
          <cylinderGeometry args={[0.13, 0.14, 0.08, 24]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={isDropping ? 1.2 : 0.4}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Coin Slot Plate */}
      <group position={[1.45, -0.95, 1.77]}>
        <mesh>
          <boxGeometry args={[0.42, 0.56, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.08, 0.025]}>
          <boxGeometry args={[0.06, 0.18, 0.02]} />
          <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.7} />
        </mesh>
        <Text position={[0, -0.14, 0.03]} fontSize={0.075} color="#fde047" anchorX="center">
          CCOIN
        </Text>
      </group>

      {/* Prize Retrieval Flap */}
      <group position={[-1.42, -1.25, 1.76]}>
        <mesh>
          <boxGeometry args={[1.0, 0.85, 0.06]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
        <Text position={[0, 0, 0.04]} fontSize={0.13} color="#fef08a" anchorX="center">
          PRIZE
        </Text>
      </group>

      {/* Paw Print Emblems on Front Lower Cabinet for Animal Theme */}
      {isAnimalTheme && (
        <>
          <PawPrint position={[0.3, -1.25, 1.78]} color="#fb7185" scale={1.35} />
          <PawPrint position={[0.3, 1.8, -1.58]} color="#ffffff" scale={1.9} />
          <PawPrint position={[-1.1, 2.5, -1.58]} color="#fef08a" scale={1.2} />
          <PawPrint position={[1.3, 1.1, -1.58]} color="#fbcfe8" scale={1.1} />
        </>
      )}

      {/* 4 Corner Pillars */}
      {[
        [-2.05, 1.8, -1.65],
        [2.05, 1.8, -1.65],
        [-2.05, 1.8, 1.65],
        [2.05, 1.8, 1.65],
      ].map(([px, py, pz], idx) => (
        <mesh key={idx} castShadow position={[px, py, pz]}>
          <boxGeometry args={[0.19, 3.7, 0.19]} />
          <meshStandardMaterial color={theme.pillar} roughness={0.35} />
        </mesh>
      ))}

      {/* Back Wall */}
      <mesh receiveShadow position={[0, 1.8, -1.66]}>
        <boxGeometry args={[4.1, 3.6, 0.08]} />
        <meshStandardMaterial color={theme.backWall} roughness={0.55} />
      </mesh>

      {/* Interior Light Bars */}
      <mesh position={[-1.92, 1.8, -1.55]}>
        <boxGeometry args={[0.055, 3.35, 0.055]} />
        <meshStandardMaterial color="#fffbeb" emissive="#fde68a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[1.92, 1.8, -1.55]}>
        <boxGeometry args={[0.055, 3.35, 0.055]} />
        <meshStandardMaterial color="#fffbeb" emissive="#fde68a" emissiveIntensity={1.2} />
      </mesh>

      {/* Top Canopy & Animal Ears */}
      <mesh castShadow position={[0, 3.85, 0]}>
        <boxGeometry args={[4.38, 0.58, 3.58]} />
        <meshStandardMaterial color={theme.body} roughness={0.35} />
      </mesh>

      {isAnimalTheme && (
        <group>
          {/* Left Cute Bear/Cat Ear */}
          <group position={[-1.35, 4.35, 1.2]} rotation={[0, 0, 0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.22, 24]} />
              <meshStandardMaterial color="#fdba74" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.22, 20]} />
              <meshStandardMaterial color="#fb7185" roughness={0.4} />
            </mesh>
          </group>
          {/* Right Cute Bear/Cat Ear */}
          <group position={[1.35, 4.35, 1.2]} rotation={[0, 0, -0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.22, 24]} />
              <meshStandardMaterial color="#fdba74" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.22, 20]} />
              <meshStandardMaterial color="#fb7185" roughness={0.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* Marquee Sign */}
      <mesh position={[0, 3.86, 1.8]}>
        <boxGeometry args={[3.75, 0.44, 0.06]} />
        <meshStandardMaterial color={theme.marqueeBg} roughness={0.3} />
      </mesh>
      <Text
        position={[0, 3.92, 1.85]}
        fontSize={0.24}
        color={theme.marqueeText}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        CAPIT
      </Text>
      <Text
        position={[0, 3.72, 1.85]}
        fontSize={0.095}
        color="#fef08a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        {theme.subtitle}
      </Text>

      {/* Transparent Glass Panels */}
      <mesh position={[0, 1.8, 1.65]}>
        <planeGeometry args={[3.92, 3.5]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          roughness={0.05}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-2.04, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.15, 3.5]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[2.04, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.15, 3.5]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
