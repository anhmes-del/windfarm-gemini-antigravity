'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Text, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { turbines, Turbine } from '@/data/turbines';

// ─── Animated water plane ─────────────────────────────────────────────────────
const WaterPlane = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.08;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
      <planeGeometry args={[120, 120, 1, 1]} />
      <meshStandardMaterial
        color="#0a3060"
        transparent
        opacity={0.55}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
};

// ─── Seabed plane ─────────────────────────────────────────────────────────────
const Seabed = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
    <planeGeometry args={[120, 120]} />
    <meshStandardMaterial color="#1a1208" roughness={1} metalness={0} />
  </mesh>
);

// ─── Pile group (below pile cap) ──────────────────────────────────────────────
const PileGroup = ({ pileCount, pileSpacing, pileLength }: { pileCount: number; pileSpacing: number; pileLength: number; }) => {
  const positions: [number, number, number][] = [];
  const nRow = Math.ceil(Math.sqrt(pileCount));
  let n = 0;
  for (let r = 0; r < nRow && n < pileCount; r++) {
    for (let c = 0; c < nRow && n < pileCount; c++) {
      const x = (c - (nRow - 1) / 2) * pileSpacing * 0.3;
      const z = (r - (nRow - 1) / 2) * pileSpacing * 0.3;
      positions.push([x, -pileLength * 0.15, z]);
      n++;
    }
  }
  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.06, 0.06, pileLength * 0.3, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// ─── Individual turbine model ─────────────────────────────────────────────────
const RotatingBlades = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.z += delta * 0.8; });
  return (
    <group ref={ref}>
      {[0, 120, 240].map(angle => (
        <mesh key={angle} rotation={[0, 0, (angle * Math.PI) / 180]}>
          <boxGeometry args={[0.07, 2.2, 0.04]} />
          <meshStandardMaterial color="#f0f4f8" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

const TurbineModel = ({
  turbine, isSelected, onSelect,
}: {
  turbine: Turbine; isSelected: boolean; onSelect: (id: string) => void;
}) => {
  const statusColor = {
    verified:    '#22c55e',
    error:       '#ef4444',
    pending:     '#eab308',
    calculating: '#3b82f6',
  }[turbine.status];

  const accentColor = isSelected ? '#00c3ff' : statusColor;
  const towerH = 3.5;
  const pileLen = turbine.geometry.pileLength * 0.08;

  return (
    <group
      position={new THREE.Vector3(...turbine.location)}
      onClick={e => { e.stopPropagation(); onSelect(turbine.id); }}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]}>
          <ringGeometry args={[1.0, 1.3, 32]} />
          <meshBasicMaterial color="#00c3ff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Pile cap */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.35, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Piles */}
      <PileGroup pileCount={turbine.geometry.pileCount} pileSpacing={turbine.geometry.pileSpacing} pileLength={pileLen} />

      {/* Tower */}
      <mesh position={[0, towerH / 2, 0]}>
        <cylinderGeometry args={[0.15, 0.28, towerH, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#1e3a5f' : '#1e293b'}
          metalness={0.85}
          roughness={0.18}
          emissive={isSelected ? '#001830' : '#000000'}
        />
      </mesh>

      {/* Nacelle */}
      <mesh position={[0, towerH + 0.25, 0.18]}>
        <boxGeometry args={[0.5, 0.45, 0.85]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Rotating blades */}
      <group position={[0, towerH + 0.25, 0.62]}>
        {turbine.status !== 'error' ? <RotatingBlades /> : (
          <group>
            {[0, 120, 240].map(angle => (
              <mesh key={angle} rotation={[0, 0, (angle * Math.PI) / 180]}>
                <boxGeometry args={[0.07, 2.2, 0.04]} />
                <meshStandardMaterial color="#6b7280" />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* Status indicator ring at tower base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.32, 0.48, 24]} />
        <meshBasicMaterial color={accentColor} transparent opacity={isSelected ? 0.9 : 0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical light beam when selected */}
      {isSelected && (
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[0.02, 0.3, 12, 8, 1, true]} />
          <meshBasicMaterial color="#00c3ff" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, towerH + 2.2, 0]}
        fontSize={0.35}
        color={isSelected ? '#00c3ff' : 'rgba(255,255,255,0.7)'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {turbine.name}
      </Text>
    </group>
  );
};

// ─── Scene root ───────────────────────────────────────────────────────────────
interface SceneProps {
  onSelectTurbine: (id: string) => void;
  selectedTurbineId: string | null;
}

const Scene = ({ onSelectTurbine, selectedTurbineId }: SceneProps) => {
  return (
    <div className="w-full h-full" style={{ background: '#020d1a' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={45} />
        <OrbitControls
          makeDefault
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 1.9}
          minDistance={5}
          maxDistance={80}
          dampingFactor={0.05}
          enableDamping
        />

        {/* Lighting */}
        <ambientLight intensity={0.35} color="#b0cce8" />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          color="#ffe8c0"
        />
        <pointLight position={[-10, 8, -10]} intensity={0.4} color="#00c3ff" />
        <pointLight position={[10, 5, 10]} intensity={0.25} color="#60a5fa" />
        <hemisphereLight args={['#0d2040', '#0a1520', 0.5]} />

        {/* Environment */}
        <fog attach="fog" args={['#020d1a', 20, 80]} />

        <WaterPlane />
        <Seabed />

        {/* Ocean floor grid */}
        <Grid
          position={[0, -2.45, 0]}
          infiniteGrid
          fadeDistance={40}
          fadeStrength={4}
          cellSize={2}
          sectionSize={8}
          sectionThickness={1.2}
          sectionColor="#0e3060"
          cellColor="#071828"
        />

        {/* Surface grid */}
        <Grid
          position={[0, -0.28, 0]}
          args={[60, 60]}
          cellSize={2}
          sectionSize={8}
          sectionThickness={0.8}
          sectionColor="#00c3ff"
          cellColor="#0a2040"
          fadeDistance={30}
          fadeStrength={3}
        />

        {turbines.map(tb => (
          <TurbineModel
            key={tb.id}
            turbine={tb}
            isSelected={selectedTurbineId === tb.id}
            onSelect={onSelectTurbine}
          />
        ))}

        <ContactShadows position={[0, -0.27, 0]} opacity={0.3} scale={30} blur={2.5} far={3} />
      </Canvas>
    </div>
  );
};

export default Scene;
