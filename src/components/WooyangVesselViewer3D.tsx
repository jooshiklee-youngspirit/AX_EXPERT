import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BlueprintModel,
  VesselPlantParams,
  PlantViewOrientation,
  DisplayStyle,
  ThermalHeatmapMode,
  SelectedComponentInfo,
} from '../types';
import {
  Truck,
  Building2,
  Scissors,
  Flame,
  Rotate3d,
  Layers,
  Sparkles,
  Download,
  Info,
  ShieldCheck,
  Maximize2,
  Camera,
  ChevronDown,
  ChevronUp,
  Users,
  Thermometer,
  RefreshCw,
  Target,
  X,
  Compass,
} from 'lucide-react';
import { exportMeshToOBJ } from '../utils/stlExporter';

// 3D Scale Reference Figurines (1.8m human worker with safety helmet & vest)
function createHumanFigurine(x: number, y: number, z: number, rotationY = 0, helmetColor = 0xfacc15): THREE.Group {
  const group = new THREE.Group();
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
  const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 8);
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.position.set(-0.12, 0.425, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.position.set(0.12, 0.425, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // High-vis neon orange torso
  const torsoMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
  const torsoGeom = new THREE.BoxGeometry(0.44, 0.65, 0.26);
  const torso = new THREE.Mesh(torsoGeom, torsoMat);
  torso.position.set(0, 0.85 + 0.325, 0);
  torso.castShadow = true;
  group.add(torso);

  // Safety reflective stripe
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.28), stripeMat);
  stripe.position.set(0, 1.15, 0);
  group.add(stripe);

  // Head
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.8 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), headMat);
  head.position.set(0, 1.62, 0);
  group.add(head);

  // Safety Hard Hat
  const helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.4 });
  const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.1, 12), helmetMat);
  helmet.position.set(0, 1.74, 0);
  group.add(helmet);

  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  return group;
}

// 100-Ton All-Terrain Mobile Crane Silhouette Model
function createMobileCrane(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const craneYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.6 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.7 });

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(14, 1.8, 3.2), craneYellow);
  chassis.position.set(0, 1.4, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // 10 Heavy Axle Wheels
  const tireGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16);
  tireGeom.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const wx = -5 + i * 2.5;
    const wL = new THREE.Mesh(tireGeom, tireMat);
    wL.position.set(wx, 0.65, 1.7);
    group.add(wL);
    const wR = new THREE.Mesh(tireGeom, tireMat);
    wR.position.set(wx, 0.65, -1.7);
    group.add(wR);
  }

  // Driver cabin
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.8), craneYellow);
  cab.position.set(5.5, 2.5, 0);
  group.add(cab);

  const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 2.6), glassMat);
  cabGlass.position.set(6.1, 2.6, 0);
  group.add(cabGlass);

  // Crane Turret & Slewing platform
  const turret = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 2.8), darkSteel);
  turret.position.set(-2, 3.2, 0);
  group.add(turret);

  // Telescopic Boom angled upwards
  const boomGroup = new THREE.Group();
  boomGroup.position.set(-1, 3.6, 0);
  boomGroup.rotation.z = Math.PI * 0.32;
  const boom = new THREE.Mesh(new THREE.BoxGeometry(26, 0.9, 0.9), craneYellow);
  boom.position.set(13, 0, 0);
  boom.castShadow = true;
  boomGroup.add(boom);
  group.add(boomGroup);

  group.position.set(x, y, z);
  return group;
}

// Plant Transport Utility & Escort Vehicle
function createEscortTruck(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, 2.0), bodyMat);
  body.position.set(0, 1.0, 0);
  body.castShadow = true;
  group.add(body);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.9), bodyMat);
  cab.position.set(0.4, 2.1, 0);
  group.add(cab);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.18, 12), beaconMat);
  beacon.position.set(0.4, 2.75, 0);
  group.add(beacon);

  const tireGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
  tireGeom.rotateX(Math.PI / 2);
  [-1.6, 1.6].forEach((wx) => {
    [-1.05, 1.05].forEach((wz) => {
      const tire = new THREE.Mesh(tireGeom, darkMat);
      tire.position.set(wx, 0.45, wz);
      group.add(tire);
    });
  });

  group.position.set(x, y, z);
  return group;
}

// 4 Heavy Motorized Turn-roll Bed Assemblies
function createTurnrollAssemblies(shellLength: number, radius: number, elevatedY: number): THREE.Group {
  const group = new THREE.Group();
  const bedPositions = [-shellLength * 0.34, -shellLength * 0.12, shellLength * 0.12, shellLength * 0.34];

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.6 });
  const rollerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
  const motorMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });

  bedPositions.forEach((xPos) => {
    const bed = new THREE.Group();
    bed.position.set(xPos, 0, 0);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.9, radius * 2.2), frameMat);
    frame.position.set(0, 0.45, 0);
    frame.castShadow = true;
    bed.add(frame);

    const motor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), motorMat);
    motor.position.set(0, 0.9, radius * 1.15);
    bed.add(motor);

    const rollerGeom = new THREE.CylinderGeometry(0.85, 0.85, 1.4, 24);
    rollerGeom.rotateZ(Math.PI / 2);

    const rollL = new THREE.Mesh(rollerGeom, rollerMat);
    rollL.position.set(0, elevatedY - radius * 0.75, radius * 0.62);
    rollL.castShadow = true;
    bed.add(rollL);

    const rollR = new THREE.Mesh(rollerGeom, rollerMat);
    rollR.position.set(0, elevatedY - radius * 0.75, -radius * 0.62);
    rollR.castShadow = true;
    bed.add(rollR);

    group.add(bed);
  });

  return group;
}

// Overhead SAW Welding Column & Boom with Arc Light
function createSawWeldingGantry(
  radius: number,
  elevatedY: number,
  arcLightRef: React.MutableRefObject<THREE.PointLight | null>
): THREE.Group {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
  const bluePaint = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5 });
  const torchMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 });

  const mastHeight = radius * 2 + 5.5;
  const mast = new THREE.Mesh(new THREE.BoxGeometry(1.6, mastHeight, 1.6), bluePaint);
  mast.position.set(0, mastHeight / 2, -radius - 3.5);
  mast.castShadow = true;
  group.add(mast);

  const boom = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, radius + 4.5), bluePaint);
  boom.position.set(0, elevatedY + radius + 1.8, -radius / 2 - 1.2);
  boom.castShadow = true;
  group.add(boom);

  const hopperGeom = new THREE.ConeGeometry(0.7, 1.4, 16);
  hopperGeom.rotateX(Math.PI);
  const hopper = new THREE.Mesh(hopperGeom, steelMat);
  hopper.position.set(0, elevatedY + radius + 1.4, 0);
  group.add(hopper);

  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.9, 12), torchMat);
  torch.position.set(0, elevatedY + radius + 0.45, 0);
  group.add(torch);

  const arcLight = new THREE.PointLight(0x93c5fd, 2.5, 20);
  arcLight.position.set(0, elevatedY + radius + 0.1, 0);
  group.add(arcLight);
  arcLightRef.current = arcLight;

  const sparkGeom = new THREE.SphereGeometry(0.22, 12, 12);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const spark = new THREE.Mesh(sparkGeom, sparkMat);
  spark.position.set(0, elevatedY + radius + 0.08, 0);
  group.add(spark);

  return group;
}

interface WooyangVesselViewer3DProps {
  blueprint: BlueprintModel;
  vesselParams: VesselPlantParams;
  onOpenAuditModal?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  selectedComponent?: SelectedComponentInfo | null;
  onSelectComponent?: (comp: SelectedComponentInfo | null) => void;
}

export const WooyangVesselViewer3D: React.FC<WooyangVesselViewer3DProps> = ({
  blueprint,
  vesselParams,
  onOpenAuditModal,
  isFullscreen,
  onToggleFullscreen,
  selectedComponent,
  onSelectComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vesselGroupRef = useRef<THREE.Group | null>(null);
  const weldSeamsGroupRef = useRef<THREE.Group | null>(null);
  const scaleFiguresGroupRef = useRef<THREE.Group | null>(null);
  const rotatingSubgroupRef = useRef<THREE.Group | null>(null);
  const weldingArcLightRef = useRef<THREE.PointLight | null>(null);
  const orientationRef = useRef<PlantViewOrientation>('transport-spmt');

  const [orientation, setOrientation] = useState<PlantViewOrientation>('transport-spmt');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('shaded');
  const [highlightWelds, setHighlightWelds] = useState(true);
  const [showInternals, setShowInternals] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showScaleFigures, setShowScaleFigures] = useState(true);
  const [thermalMode, setThermalMode] = useState<ThermalHeatmapMode>('none');
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [sceneReady, setSceneReady] = useState(0);

  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  // Scaled dimensions for optimal 3D viewport (scale: 1 meter = 1 unit)
  const length = vesselParams.totalLengthM; // e.g. 101.1
  const radius = vesselParams.outerDiameterM / 2; // e.g. 5.4
  const canCount = vesselParams.shellCanCount || 28;

  // Setup Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // Soft architectural gradient fog
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0035);

    // Perspective Camera suited for a 100m vessel
    const camera = new THREE.PerspectiveCamera(42, (width / height) || (16 / 9), 0.5, 1000);
    camera.position.set(75, 45, 110);
    cameraRef.current = camera;

    // WebGL Renderer with High Dynamic Range Lighting & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 15;
    controls.maxDistance = 350;
    controls.target.set(0, radius + 2, 0);
    controlsRef.current = controls;

    // Lighting (Sunlight + Sky Ambient + Rim Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(80, 120, 90);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    dirLight.shadow.camera.left = -90;
    dirLight.shadow.camera.right = 90;
    dirLight.shadow.camera.top = 90;
    dirLight.shadow.camera.bottom = -90;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.85);
    fillLight.position.set(-90, 60, -80);
    scene.add(fillLight);

    // Industrial Yard Ground Grid (Paved Concrete Pier / Assembly Yard)
    const groundGeom = new THREE.PlaneGeometry(350, 350);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x161d2f,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(300, 60, 0x3b82f6, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Build the Mega Vessel Structure
    const vesselGroup = new THREE.Group();
    scene.add(vesselGroup);
    vesselGroupRef.current = vesselGroup;

    const weldSeamsGroup = new THREE.Group();
    scene.add(weldSeamsGroup);
    weldSeamsGroupRef.current = weldSeamsGroup;

    // Animate Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (autoRotate && vesselGroupRef.current) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;
      } else {
        controls.autoRotate = false;
      }

      // Continuous axial rotation during Turn-roll fabrication mode
      if (orientationRef.current === 'turnroll-fabrication' && rotatingSubgroupRef.current) {
        rotatingSubgroupRef.current.rotation.y += 0.006;
        if (weldingArcLightRef.current) {
          weldingArcLightRef.current.intensity = 1.2 + Math.random() * 2.5;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Notify that scene is constructed and ready for vessel mesh generation
    setSceneReady((prev) => prev + 1);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Smoothly focus camera on selected 2D/3D component
  useEffect(() => {
    if (!selectedComponent || !controlsRef.current || !cameraRef.current) return;
    const shellLength = length * 0.86;
    let targetX = 0;
    let targetY = radius + 5.2;
    let targetZ = 0;

    if (selectedComponent.position3D) {
      [targetX, targetY, targetZ] = selectedComponent.position3D;
    } else if (selectedComponent.tag === 'N1') {
      targetX = -shellLength * 0.38;
      targetY = radius + 5.2 + radius;
    } else if (selectedComponent.tag === 'N2') {
      targetX = shellLength * 0.28;
      targetY = radius + 5.2 + radius;
    } else if (selectedComponent.tag === 'N3') {
      targetX = -shellLength * 0.22;
      targetY = radius + 5.2 - radius;
    } else if (selectedComponent.tag === 'M1') {
      targetX = shellLength * 0.35;
      targetY = radius + 5.2 - radius;
    } else if (selectedComponent.type === 'head') {
      targetX = shellLength / 2;
      targetY = radius + 5.2;
    } else if (selectedComponent.type === 'skirt') {
      targetX = -shellLength / 2 - 4;
      targetY = radius + 5.2;
    }

    if (orientation === 'vertical-erected') {
      targetY = targetX + shellLength / 2 + 7.5;
      targetX = 0;
    }

    controlsRef.current.target.set(targetX, targetY, targetZ);
    controlsRef.current.update();
  }, [selectedComponent, orientation, length, radius]);

  // Reconstruct Vessel Mesh whenever orientation, params, or display styles change
  useEffect(() => {
    const vesselGroup = vesselGroupRef.current;
    const weldGroup = weldSeamsGroupRef.current;
    const scene = sceneRef.current;
    if (!vesselGroup || !weldGroup || !scene) return;

    // Clear previous models
    while (vesselGroup.children.length > 0) {
      const obj = vesselGroup.children[0];
      vesselGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }
    while (weldGroup.children.length > 0) {
      const obj = weldGroup.children[0];
      weldGroup.remove(obj);
    }

    // Reset rotating reference
    rotatingSubgroupRef.current = null;

    // Material for Vessel (Heavy SA516-70N / Marine Primer Epoxied Steel)
    const clippingPlane =
      orientation === 'section-cut'
        ? [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)]
        : [];

    // Thermal Heatmap coloring logic (HAZ vs PWHT vs Normal)
    let shellMatColor = 0x8a99a8;
    let shellEmissive = 0x000000;
    let shellEmissiveIntensity = 0;
    let beadMatColor = 0xf59e0b;
    let beadEmissive = 0xd97706;
    let beadEmissiveIntensity = 0.45;

    if (thermalMode === 'haz-welding') {
      shellMatColor = 0x334155; // Cool base steel plate
      beadMatColor = 0xffffff;  // 1,450℃ molten weld puddle
      beadEmissive = 0xff3300;
      beadEmissiveIntensity = 2.4;
    } else if (thermalMode === 'pwht-furnace') {
      shellMatColor = 0x991b1b; // 620℃ soaking heat stress-relief
      shellEmissive = 0x7f1d1d;
      shellEmissiveIntensity = 0.85;
      beadMatColor = 0xef4444;
      beadEmissive = 0xdc2626;
      beadEmissiveIntensity = 0.9;
    }

    const shellMaterial = new THREE.MeshStandardMaterial({
      color: shellMatColor,
      emissive: shellEmissive,
      emissiveIntensity: shellEmissiveIntensity,
      metalness: 0.65,
      roughness: 0.35,
      side: THREE.DoubleSide,
      clippingPlanes: clippingPlane,
      clipShadows: true,
      wireframe: displayStyle === 'wireframe',
      transparent: displayStyle === 'xray',
      opacity: displayStyle === 'xray' ? 0.4 : 1.0,
    });

    const skirtMaterial = new THREE.MeshStandardMaterial({
      color: thermalMode === 'pwht-furnace' ? 0x7f1d1d : 0x334155,
      metalness: 0.7,
      roughness: 0.4,
      side: THREE.DoubleSide,
      clippingPlanes: clippingPlane,
    });

    const flangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d6e5,
      metalness: 0.85,
      roughness: 0.25,
      clippingPlanes: clippingPlane,
    });

    const weldBeadMaterial = new THREE.MeshStandardMaterial({
      color: beadMatColor,
      emissive: beadEmissive,
      emissiveIntensity: beadEmissiveIntensity,
      roughness: 0.3,
      metalness: 0.8,
      clippingPlanes: clippingPlane,
    });

    // 1. MAIN CYLINDRICAL SHELL (Horizontally laid along X or Vertically along Y)
    const shellLength = length * 0.86; // main cylinder without ellipsoidal heads
    const canLength = shellLength / canCount;

    // Shell cylinder geometry
    const shellGeom = new THREE.CylinderGeometry(radius, radius, shellLength, 48, canCount, true);
    const shellMesh = new THREE.Mesh(shellGeom, shellMaterial);
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;

    // 2. 2:1 ELLIPSOIDAL HEADS (Dished Heads at both ends)
    const headDepth = radius * 0.5; // 2:1 Ellipsoidal Head geometry
    const headGeom = new THREE.SphereGeometry(
      radius,
      48,
      24,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    headGeom.scale(1, 0.5, 1); // squish into 2:1 ellipse

    // Top / Right Head
    const topHeadMesh = new THREE.Mesh(headGeom, shellMaterial);
    topHeadMesh.position.y = shellLength / 2;
    topHeadMesh.castShadow = true;

    // Bottom / Left Head
    const bottomHeadMesh = new THREE.Mesh(headGeom, shellMaterial);
    bottomHeadMesh.position.y = -shellLength / 2;
    bottomHeadMesh.rotation.x = Math.PI;
    bottomHeadMesh.castShadow = true;

    // 3. BASE SUPPORT SKIRT
    const skirtH = vesselParams.skirtHeightM || 7.5;
    const skirtGeom = new THREE.CylinderGeometry(radius, radius * 1.03, skirtH, 48, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeom, skirtMaterial);
    skirtMesh.position.y = -shellLength / 2 - skirtH / 2;
    skirtMesh.castShadow = true;

    // 4. CIRCUMFERENTIAL & LONGITUDINAL WELD SEAMS (C-Seams and L-Seams)
    for (let i = 0; i <= canCount; i++) {
      const yPos = -shellLength / 2 + i * canLength;
      // C-Seam toroidal ring
      const cSeamGeom = new THREE.TorusGeometry(radius * 1.006, 0.09, 8, 48);
      cSeamGeom.rotateX(Math.PI / 2);
      const cSeamMesh = new THREE.Mesh(cSeamGeom, weldBeadMaterial);
      cSeamMesh.position.y = yPos;
      weldGroup.add(cSeamMesh);

      // Thermal Heatmap HAZ (Heat Affected Zone) gradient rings
      if (thermalMode === 'haz-welding') {
        const hazMat1 = new THREE.MeshBasicMaterial({ color: 0xdc2626 }); // 850℃ HAZ
        const hazMat2 = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // 350℃ Preheat
        [-0.32, 0.32].forEach((offset) => {
          const hazGeom = new THREE.TorusGeometry(radius * 1.003, 0.07, 6, 48);
          hazGeom.rotateX(Math.PI / 2);
          const hazMesh = new THREE.Mesh(hazGeom, hazMat1);
          hazMesh.position.y = yPos + offset;
          weldGroup.add(hazMesh);
        });
        [-0.65, 0.65].forEach((offset) => {
          const preheatGeom = new THREE.TorusGeometry(radius * 1.002, 0.06, 6, 48);
          preheatGeom.rotateX(Math.PI / 2);
          const preheatMesh = new THREE.Mesh(preheatGeom, hazMat2);
          preheatMesh.position.y = yPos + offset;
          weldGroup.add(preheatMesh);
        });
      }

      // Staggered L-Seams (Longitudinal seams rotated per can)
      if (i < canCount) {
        const angle = ((i * 45) % 360) * (Math.PI / 180);
        const lSeamGeom = new THREE.CylinderGeometry(0.08, 0.08, canLength, 6);
        const lSeamMesh = new THREE.Mesh(lSeamGeom, weldBeadMaterial);
        lSeamMesh.position.set(
          radius * Math.cos(angle),
          yPos + canLength / 2,
          radius * Math.sin(angle)
        );
        weldGroup.add(lSeamMesh);
      }
    }

    // 5. PROCESS NOZZLES & MANHOLES (Planted around the vessel)
    const nozzleGroup = new THREE.Group();
    const nozzlePositions = [
      { y: shellLength * 0.42, r: radius, ang: 0, dia: 1.2, len: 1.8, label: 'N1 (Vapor Out)' },
      { y: shellLength * 0.35, r: radius, ang: Math.PI / 2, dia: 0.8, len: 1.5, label: 'N2 (Reflux)' },
      { y: shellLength * 0.22, r: radius, ang: Math.PI, dia: 0.9, len: 1.6, label: 'M1 (Manhole)' },
      { y: shellLength * 0.08, r: radius, ang: -Math.PI / 2, dia: 1.4, len: 2.0, label: 'N3 (Feed Inlet)' },
      { y: -shellLength * 0.12, r: radius, ang: 0, dia: 0.9, len: 1.6, label: 'M2 (Manhole)' },
      { y: -shellLength * 0.25, r: radius, ang: Math.PI * 0.75, dia: 1.6, len: 2.2, label: 'N4 (Reboiler Vapor)' },
      { y: -shellLength * 0.38, r: radius, ang: -Math.PI * 0.75, dia: 1.1, len: 1.8, label: 'N5 (Bottom Liquid)' },
    ];

    nozzlePositions.forEach((noz) => {
      const nPipeGeom = new THREE.CylinderGeometry(noz.dia / 2, noz.dia / 2, noz.len, 24);
      const nFlangeGeom = new THREE.CylinderGeometry(noz.dia * 0.8, noz.dia * 0.8, 0.25, 24);

      const nPipe = new THREE.Mesh(nPipeGeom, shellMaterial);
      const nFlange = new THREE.Mesh(nFlangeGeom, flangeMaterial);
      nFlange.position.y = noz.len / 2;

      const singleNozzle = new THREE.Group();
      singleNozzle.add(nPipe);
      singleNozzle.add(nFlange);

      // Position radially outwards
      singleNozzle.position.set(
        (noz.r + noz.len / 2) * Math.cos(noz.ang),
        noz.y,
        (noz.r + noz.len / 2) * Math.sin(noz.ang)
      );
      singleNozzle.rotation.z = -Math.PI / 2;
      singleNozzle.rotation.y = noz.ang;
      nozzleGroup.add(singleNozzle);
    });

    // 6. INTERNAL TRAYS & SUPPORTS (Visible during Section Cut)
    const internalsGroup = new THREE.Group();
    const trayStep = shellLength / 24; // 24 representative trays
    for (let k = 1; k < 24; k++) {
      const trayY = -shellLength / 2 + k * trayStep;
      const trayRingGeom = new THREE.RingGeometry(radius * 0.25, radius * 0.98, 36);
      trayRingGeom.rotateX(Math.PI / 2);
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide,
        clippingPlanes: clippingPlane,
      });
      const trayMesh = new THREE.Mesh(trayRingGeom, trayMat);
      trayMesh.position.y = trayY;
      internalsGroup.add(trayMesh);
    }

    // 7. BANNER ON SHELL (Matching banner: "UNITED EO/EG III PROJECT / SAMSUNG ENGINEERING / WASH TOWER / WC")
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 2048;
    bannerCanvas.height = 256;
    const ctx = bannerCanvas.getContext('2d');
    if (ctx) {
      // White glossy banner background with blue gradients
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, bannerCanvas.width, bannerCanvas.height);

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, bannerCanvas.width, 14);
      ctx.fillRect(0, bannerCanvas.height - 14, bannerCanvas.width, 14);

      // Curved blue swoop
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(0, bannerCanvas.height);
      ctx.bezierCurveTo(400, 180, 800, 220, 1400, bannerCanvas.height);
      ctx.fill();

      // Text lines matching photo
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${vesselParams.projectName || 'UNITED EO/EG III PROJECT'}`,
        bannerCanvas.width / 2,
        78
      );

      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(
        `${vesselParams.client || 'SAMSUNG ENGINEERING'}`,
        bannerCanvas.width / 2,
        138
      );

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(
        `${vesselParams.equipmentTag || 'WASH TOWER'}  ${vesselParams.totalLengthM}m(L) x ${vesselParams.outerDiameterM}m(OD) x ${vesselParams.totalHeightM}m(H)  ${vesselParams.totalWeightTon.toLocaleString()} Ton`,
        bannerCanvas.width / 2,
        192
      );

      // WC Logo Right
      ctx.fillStyle = '#0284c7';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('WC', bannerCanvas.width - 60, 145);
    }

    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    bannerTexture.anisotropy = 8;
    const bannerMat = new THREE.MeshBasicMaterial({
      map: bannerTexture,
      side: THREE.DoubleSide,
      transparent: true,
      clippingPlanes: clippingPlane,
    });
    // Curved banner wrapping the cylindrical shell
    const bannerGeom = new THREE.CylinderGeometry(
      radius * 1.015,
      radius * 1.015,
      radius * 0.95,
      32,
      1,
      true,
      -Math.PI * 0.35,
      Math.PI * 0.7
    );
    const bannerMesh = new THREE.Mesh(bannerGeom, bannerMat);
    bannerMesh.position.y = 0;

    // Group the Vessel Assembly
    const vesselSubGroup = new THREE.Group();
    vesselSubGroup.add(shellMesh);
    vesselSubGroup.add(topHeadMesh);
    vesselSubGroup.add(bottomHeadMesh);
    vesselSubGroup.add(skirtMesh);
    vesselSubGroup.add(nozzleGroup);
    vesselSubGroup.add(internalsGroup);
    vesselSubGroup.add(bannerMesh);

    // 8. MULTI-AXLE SPMT TRANSPORTER (GOLDHOFER 48-AXLE MODULE) + CRADLE SADDLES
    const spmtGroup = new THREE.Group();
    const transporterLength = shellLength * 0.9;
    const axleLines = 24; // 24 dual-axle lines = 48 axles
    const axleSpacing = transporterLength / axleLines;

    // Two massive steel transport saddles holding the heavy tower
    const saddleGeom = new THREE.BoxGeometry(radius * 2.4, 3.2, 5.5);
    const saddleMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Red Goldhofer heavy haulage saddle
      metalness: 0.6,
      roughness: 0.4,
    });

    const saddle1 = new THREE.Mesh(saddleGeom, saddleMat);
    saddle1.position.set(-shellLength * 0.28, -radius - 1.6, 0);
    saddle1.castShadow = true;
    spmtGroup.add(saddle1);

    const saddle2 = new THREE.Mesh(saddleGeom, saddleMat);
    saddle2.position.set(shellLength * 0.28, -radius - 1.6, 0);
    saddle2.castShadow = true;
    spmtGroup.add(saddle2);

    // Red/Orange SPMT Chassis Flatbed Trailer
    const chassisGeom = new THREE.BoxGeometry(transporterLength, 1.4, radius * 2.1);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Orange heavy industrial transporter
      metalness: 0.5,
      roughness: 0.4,
    });
    const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
    chassisMesh.position.set(0, -radius - 3.8, 0);
    chassisMesh.castShadow = true;
    spmtGroup.add(chassisMesh);

    // Tires & suspension along both sides
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const tireGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
    tireGeom.rotateX(Math.PI / 2);

    for (let a = 0; a < axleLines; a++) {
      const xPos = -transporterLength / 2 + a * axleSpacing + axleSpacing / 2;
      // Left tires
      const tL = new THREE.Mesh(tireGeom, tireMat);
      tL.position.set(xPos, -radius - 4.6, radius * 1.05);
      spmtGroup.add(tL);

      // Right tires
      const tR = new THREE.Mesh(tireGeom, tireMat);
      tR.position.set(xPos, -radius - 4.6, -radius * 1.05);
      spmtGroup.add(tR);
    }

    // APPLY ORIENTATION (SPMT Transport Horizontal vs Turn-roll vs Vertical Erected)
    if (orientation === 'transport-spmt' || orientation === 'section-cut') {
      // Rotate 90 deg so vessel lies horizontally along X axis on top of the SPMT
      vesselSubGroup.rotation.z = -Math.PI / 2;
      weldGroup.rotation.z = -Math.PI / 2;

      // Position vessel elevated above the ground on the transporter
      const elevatedY = radius + 5.2;
      vesselSubGroup.position.y = elevatedY;
      weldGroup.position.y = elevatedY;
      spmtGroup.position.y = elevatedY;

      vesselGroup.add(vesselSubGroup);
      vesselGroup.add(spmtGroup);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, elevatedY, 0);
        controlsRef.current.update();
      }
    } else if (orientation === 'turnroll-fabrication') {
      // TURN-ROLL FABRICATION ROTATING WELDING MODE
      vesselSubGroup.rotation.z = -Math.PI / 2;
      weldGroup.rotation.z = -Math.PI / 2;

      const elevatedY = radius + 3.2;
      vesselSubGroup.position.y = elevatedY;
      weldGroup.position.y = elevatedY;

      // 4 Heavy motorized turn-roll roller beds
      const turnrollGroup = createTurnrollAssemblies(shellLength, radius, elevatedY);
      vesselGroup.add(turnrollGroup);

      // Overhead Submerged Arc Welding (SAW) Column & Boom Gantry
      const gantryGroup = createSawWeldingGantry(radius, elevatedY, weldingArcLightRef);
      vesselGroup.add(gantryGroup);

      vesselGroup.add(vesselSubGroup);
      rotatingSubgroupRef.current = vesselSubGroup;

      if (controlsRef.current) {
        controlsRef.current.target.set(0, elevatedY, 0);
        controlsRef.current.update();
      }
    } else {
      // VERTICAL ERECTED PLANT MODE (Standing 101m tall!)
      vesselSubGroup.rotation.z = 0;
      weldGroup.rotation.z = 0;

      const baseElevation = shellLength / 2 + skirtH;
      vesselSubGroup.position.y = baseElevation;
      weldGroup.position.y = baseElevation;

      vesselGroup.add(vesselSubGroup);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, shellLength / 2, 0);
        controlsRef.current.update();
      }
    }

    // Toggle weld seam visibility
    weldGroup.visible = highlightWelds;

    // Scale Reference Objects (1.8m Workers, Mobile Crane, Escort Truck)
    if (scaleFiguresGroupRef.current) {
      scene.remove(scaleFiguresGroupRef.current);
      scaleFiguresGroupRef.current = null;
    }
    if (showScaleFigures) {
      const scaleGroup = new THREE.Group();
      // 3 Workers in safety attire
      scaleGroup.add(createHumanFigurine(0, 0, radius + 3.2, 0, 0xfacc15));
      scaleGroup.add(createHumanFigurine(-shellLength * 0.35, 0, radius + 4.2, Math.PI * 0.2, 0xf8fafc));
      scaleGroup.add(createHumanFigurine(shellLength * 0.32, 0, radius + 3.6, -Math.PI * 0.3, 0xef4444));

      // 100-ton Mobile Crane
      scaleGroup.add(createMobileCrane(shellLength * 0.42, 0, radius + 14));

      // Heavy escort truck
      scaleGroup.add(createEscortTruck(-shellLength * 0.44, 0, radius + 9));

      scene.add(scaleGroup);
      scaleFiguresGroupRef.current = scaleGroup;
    }
  }, [sceneReady, orientation, vesselParams, displayStyle, highlightWelds, showScaleFigures, thermalMode]);

  // Handle STL / OBJ Export
  const handleExportOBJ = () => {
    if (vesselGroupRef.current) {
      exportMeshToOBJ(vesselGroupRef.current as any, `${vesselParams.equipmentTag || 'WASH_TOWER'}_3D`);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 3D Canvas Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Overlay: Unified Header with Model Info Badge & Tool Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        {/* Left: Collapsible Model Info Badge */}
        <div className="flex flex-col gap-1 pointer-events-auto max-w-[320px] sm:max-w-xs transition-all">
          <button
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg shadow-lg text-left cursor-pointer transition-colors"
            title="기기 사양 정보 펼치기/접기"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-slate-100 tracking-wide truncate">
              {vesselParams.equipmentTag}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 font-mono">
              {vesselParams.totalWeightTon.toLocaleString()}t
            </span>
            <div className="text-slate-400 hover:text-slate-200 ml-auto p-0.5">
              {isInfoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Detailed Info Card (Collapsible) */}
          {isInfoExpanded && (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg text-[11px] text-slate-300 space-y-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">제작처:</span>
                <span className="font-semibold text-cyan-300 text-right">{vesselParams.fabricator}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">프로젝트:</span>
                <span className="font-semibold text-slate-200 text-right truncate">{vesselParams.projectName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">외형 제원:</span>
                <span className="font-mono text-emerald-400 text-right">
                  {vesselParams.totalLengthM}m(L) x Ø{vesselParams.outerDiameterM}m
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">쉘 / 캔:</span>
                <span className="font-mono text-slate-200 text-right">
                  {vesselParams.shellThicknessMm}t / {vesselParams.shellCanCount}캔
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-slate-800">
                <span className="text-slate-400 shrink-0">용접 심:</span>
                <span className="font-mono text-amber-400 font-semibold text-right">
                  C-Seam {vesselParams.shellCanCount + 2}개소 (100% RT)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: View Tabs & Quick Controls Toolbar */}
        <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1 rounded-lg shadow-lg pointer-events-auto">
          {/* Orientation Selector Tabs */}
          <button
            onClick={() => setOrientation('transport-spmt')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              orientation === 'transport-spmt'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="사진과 동일한 SPMT 48축 운반차 안착 조감도"
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">SPMT 출하</span>
            <span className="sm:hidden">SPMT</span>
          </button>

          <button
            onClick={() => setOrientation('vertical-erected')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              orientation === 'vertical-erected'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="101m 타워 수직 직립 플랜트 조감도"
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">직립 완성</span>
            <span className="sm:hidden">직립</span>
          </button>

          <button
            onClick={() => setOrientation('section-cut')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              orientation === 'section-cut'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="쉘 85mm 두께 및 84단 트레이 내부 단면도"
          >
            <Scissors className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">단면 뷰</span>
            <span className="sm:hidden">단면</span>
          </button>

          <button
            onClick={() => setOrientation('turnroll-fabrication')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              orientation === 'turnroll-fabrication'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="턴롤(Turn-roll) 4개소 자동 회전 및 상부 SAW 서브머지드 아크 용접 시뮬레이션"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">턴롤 용접</span>
            <span className="sm:hidden">턴롤</span>
          </button>

          <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5" />

          {/* Thermal Heatmap Mode Selector */}
          <button
            onClick={() => {
              if (thermalMode === 'none') setThermalMode('haz-welding');
              else if (thermalMode === 'haz-welding') setThermalMode('pwht-furnace');
              else setThermalMode('none');
            }}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              thermalMode !== 'none'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title={`열화상 모드: ${thermalMode === 'none' ? 'OFF' : thermalMode === 'haz-welding' ? '용접부 HAZ (1,450℃)' : 'PWHT 열처리 로 (620℃)'}`}
          >
            <Thermometer className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="hidden md:inline">
              {thermalMode === 'none' ? '열화상' : thermalMode === 'haz-welding' ? 'HAZ' : 'PWHT'}
            </span>
          </button>

          {/* Scale Reference (1.8m Human Workers & Crane) Toggle */}
          <button
            onClick={() => setShowScaleFigures(!showScaleFigures)}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              showScaleFigures
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="1.8m 작업자 및 100t 크레인 스케일 피규어 표시/숨김"
          >
            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden md:inline">스케일</span>
          </button>

          {/* Weld Seam Highlight Toggle */}
          <button
            onClick={() => setHighlightWelds(!highlightWelds)}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              highlightWelds
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="C-Seam 둘레 용접 & L-Seam 길이 용접선 하이라이트"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden md:inline">용접선</span>
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
              autoRotate ? 'text-blue-400 bg-blue-500/20' : ''
            }`}
            title="360도 자동 회전"
          >
            <Rotate3d className="w-3.5 h-3.5" />
          </button>

          {/* Export 3D */}
          <button
            onClick={handleExportOBJ}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="3D OBJ 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="전체화면"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2D-3D Bi-directional Synchronized Component Focus HUD Card */}
      {selectedComponent && (
        <div className="absolute top-14 left-2.5 z-30 bg-slate-900/95 border border-cyan-500/60 backdrop-blur-md rounded-xl p-3 shadow-2xl max-w-xs animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-xs font-bold text-cyan-300 font-mono">
                {selectedComponent.tag}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                2D↔3D 동기화
              </span>
            </div>
            {onSelectComponent && (
              <button
                onClick={() => onSelectComponent(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                title="포커스 해제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs font-semibold text-white mt-1">
            {selectedComponent.name}
          </div>
          {selectedComponent.spec && (
            <div className="text-[10px] text-slate-300 mt-1.5 font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">규격:</span>
                <span className="text-cyan-200 text-right font-medium">{selectedComponent.spec}</span>
              </div>
              {selectedComponent.rating && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">플랜지/내압:</span>
                  <span className="text-amber-300 text-right">{selectedComponent.rating}</span>
                </div>
              )}
              {selectedComponent.weldType && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">용접 및 검사:</span>
                  <span className="text-emerald-300 text-right">{selectedComponent.weldType}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Bar: Welding Lead Time & Engineer Slack Alert Quick CTA */}
      {onOpenAuditModal && (
        <div className="absolute bottom-6 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col sm:flex-row items-center gap-2 bg-slate-900/95 border border-amber-500/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-2xl max-w-[calc(100%-20px)] sm:max-w-xl text-center sm:text-left">
          <div className="flex items-center gap-1.5 truncate">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              엔지니어 요구: <strong className="text-red-400 font-mono">420일</strong> vs 표준:{' '}
              <strong className="text-emerald-400 font-mono">215일</strong>
            </span>
          </div>

          <button
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md hover:shadow-amber-500/25 transition-all cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>납기 부풀림(205일) 감사</span>
          </button>
        </div>
      )}

      {/* Bottom Status Ticker (Positioned cleanly at bottom-1, with no overlap) */}
      <div className="absolute bottom-1 left-0 right-0 z-10 text-[10px] text-slate-500 hidden sm:flex items-center justify-center gap-2 pointer-events-none font-mono px-4 truncate">
        <span>ASME Sec.VIII Div.1/2 U2</span>
        <span>•</span>
        <span>SAW TANDEM + GTAW</span>
        <span>•</span>
        <span>NDT: 100% RT / PAUT</span>
        <span>•</span>
        <span>PWHT: 620℃</span>
      </div>
    </div>
  );
};
