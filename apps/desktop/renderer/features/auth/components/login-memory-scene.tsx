import { useEffect, useRef } from "react";
import * as THREE from "three";

type loginMemorySceneProps = {
  className?: string;
};

export const LoginMemoryScene = ({ className }: loginMemorySceneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.18, 8.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    container.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.position.set(0.14, 0.02, 0);
    root.rotation.set(-0.08, -0.28, -0.1);
    scene.add(root);

    const nodeGeometry = new THREE.IcosahedronGeometry(0.048, 1);
    const primaryMaterial = new THREE.MeshStandardMaterial({
      color: 0xeef4ff,
      emissive: 0x223044,
      emissiveIntensity: 0.34,
      roughness: 0.45,
      metalness: 0.18
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x8ef2b1,
      emissive: 0x235a36,
      emissiveIntensity: 0.68,
      roughness: 0.35,
      metalness: 0.08
    });
    const mutedMaterial = new THREE.MeshStandardMaterial({
      color: 0x7890b8,
      emissive: 0x121c30,
      emissiveIntensity: 0.38,
      roughness: 0.65,
      metalness: 0.1
    });

    const nodes: THREE.Mesh[] = [];
    const nodePositions = createMemoryPositions();

    for (const [index, position] of nodePositions.entries()) {
      const node = new THREE.Mesh(
        nodeGeometry,
        index % 5 === 0
          ? accentMaterial
          : index % 3 === 0
            ? primaryMaterial
            : mutedMaterial
      );
      node.position.copy(position);
      node.scale.setScalar(index % 5 === 0 ? 1.45 : 0.9);
      nodes.push(node);
      root.add(node);
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8ba7d8,
      transparent: true,
      opacity: 0.16
    });
    const highlightLineMaterial = new THREE.LineBasicMaterial({
      color: 0x9df6b8,
      transparent: true,
      opacity: 0.34
    });
    const connections = createConnections(nodePositions);
    const lineGeometries: THREE.BufferGeometry[] = [];

    for (const [index, connection] of connections.entries()) {
      const geometry = new THREE.BufferGeometry().setFromPoints(connection);
      lineGeometries.push(geometry);
      root.add(
        new THREE.Line(
          geometry,
          index % 4 === 0 ? highlightLineMaterial : lineMaterial
        )
      );
    }

    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d2a41,
      emissive: 0x0c1526,
      emissiveIntensity: 0.5,
      roughness: 0.82,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.44
    });
    const ribbon = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.62, 0.009, 156, 6, 2, 5),
      ribbonMaterial
    );
    ribbon.rotation.set(0.42, 0.12, -0.32);
    root.add(ribbon);

    const ambientLight = new THREE.AmbientLight(0xbdd0ee, 1.1);
    const keyLight = new THREE.PointLight(0xa8fac3, 8, 18);
    keyLight.position.set(2.6, 2.1, 3.4);
    const rimLight = new THREE.PointLight(0x7ea5ff, 5, 20);
    rimLight.position.set(-3.4, -1.7, 4.2);
    scene.add(ambientLight, keyLight, rimLight);

    let frameId = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const { height, width } = container.getBoundingClientRect();
      const nextWidth = Math.max(width, 1);
      const nextHeight = Math.max(height, 1);

      renderer.setSize(nextWidth, nextHeight, false);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      root.rotation.y = -0.28 + elapsed * 0.035;
      root.rotation.x = -0.08 + Math.sin(elapsed * 0.2) * 0.04;
      ribbon.rotation.z = -0.32 + elapsed * 0.025;
      ribbon.rotation.y = 0.12 + Math.sin(elapsed * 0.2) * 0.09;

      for (const [index, node] of nodes.entries()) {
        const pulse = 1 + Math.sin(elapsed * 0.9 + index) * 0.07;
        node.scale.setScalar((index % 5 === 0 ? 1.45 : 0.9) * pulse);
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      nodeGeometry.dispose();
      primaryMaterial.dispose();
      accentMaterial.dispose();
      mutedMaterial.dispose();
      lineMaterial.dispose();
      highlightLineMaterial.dispose();
      for (const geometry of lineGeometries) {
        geometry.dispose();
      }
      ribbon.geometry.dispose();
      ribbonMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
};

const createMemoryPositions = () => {
  return Array.from({ length: 18 }, (_, index) => {
    const lane = index % 3;
    const step = Math.floor(index / 3);
    const angle = step * 0.78 + lane * 0.34;
    const radius = 0.78 + lane * 0.44;
    const x = -1.12 + step * 0.38 + Math.cos(angle) * radius * 0.32;
    const y = (lane - 1) * 0.58 + Math.sin(angle) * 0.42;
    const z = Math.sin(angle * 0.86) * 0.74 + (lane - 1) * 0.18;

    return new THREE.Vector3(x, y, z);
  });
};

const createConnections = (positions: THREE.Vector3[]) => {
  const connections: THREE.Vector3[][] = [];

  for (let index = 0; index < positions.length; index += 1) {
    if (index + 3 < positions.length) {
      connections.push([positions[index], positions[index + 3]]);
    }

    if (index % 6 === 0 && index + 4 < positions.length) {
      connections.push([positions[index], positions[index + 4]]);
    }
  }

  return connections;
};
