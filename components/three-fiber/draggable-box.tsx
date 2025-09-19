import { useRef, useState } from 'react';
import { useFrame, Canvas} from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

function DraggableBox() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const velocity = useRef(new THREE.Vector3());
  const [isDragging, setIsDragging] = useState(false);

  // Apply rotation and velocity on each frame
  useFrame((_, delta) => {
    if (!isDragging) {
      // Apply velocity to position
      meshRef.current.position.addScaledVector(velocity.current, delta);
      // Apply damping to simulate friction
      velocity.current.multiplyScalar(0.95);
    }
    // Continuous rotation
    meshRef.current.rotation.x += delta;
    meshRef.current.rotation.y += delta;
  });

  // Bind drag gesture
  const bind = useDrag(({ active, movement: [mx, my], velocity: [vx, vy] }) => {
    setIsDragging(active);
    if (active) {
      // Update position based on mouse movement
      meshRef.current.position.x += mx * 0.01;
      meshRef.current.position.y += -my * 0.01;
    } else {
      // Set velocity based on gesture velocity
      velocity.current.set(vx * 5, -vy * 5, 0);
    }
  });

  return (
    <mesh ref={meshRef} scale={1.5} {...bind()}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#61dafb" />
    </mesh>
  );
}

export default function ThreeCanvas() {
  return (
    <div className="w-full h-full absolute">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <DraggableBox />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}