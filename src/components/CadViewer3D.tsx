import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BlueprintModel, CADMaterialType, DisplayStyle } from '../types';
import {
  Maximize2,
  Rotate3d,
  Layers,
  Sparkles,
  Download,
  Eye,
  Camera,
  Scissors,
  Sun,
  Box,
  Compass,
} from 'lucide-react';
import { exportMeshToSTL, exportMeshToOBJ } from '../utils/stlExporter';
import { WCompanyVesselViewer3D } from './WCompanyVesselViewer3D';
import { SelectedComponentInfo } from '../types';

interface CadViewer3DProps {
  blueprint: BlueprintModel;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenAuditModal?: () => void;
  selectedComponent?: SelectedComponentInfo | null;
  onSelectComponent?: (comp: SelectedComponentInfo | null) => void;
}

export const CadViewer3D: React.FC<CadViewer3DProps> = ({
  blueprint,
  isFullscreen,
  onToggleFullscreen,
  onOpenAuditModal,
  selectedComponent,
  onSelectComponent,
}) => {
  // If this blueprint is a heavy plant equipment (W Company mega-vessel), render WCompanyVesselViewer3D
  if (blueprint.vesselParams) {
    return (
      <WCompanyVesselViewer3D
        blueprint={blueprint}
        vesselParams={blueprint.vesselParams}
        onOpenAuditModal={onOpenAuditModal}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        selectedComponent={selectedComponent}
        onSelectComponent={onSelectComponent}
      />
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mainMeshRef = useRef<THREE.Mesh | null>(null);
  const edgesMeshRef = useRef<THREE.LineSegments | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);

  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('shaded');
  const [activeMaterial, setActiveMaterial] = useState<CADMaterialType>(blueprint.material);
  const [sectionCut, setSectionCut] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showBolts, setShowBolts] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [cameraView, setCameraView] = useState<'iso' | 'top' | 'front' | 'section'>('iso');
  const [sceneReady, setSceneReady] = useState(0);

  const { params } = blueprint;

  // Build the 3D Parametric CAD Solid Geometry
  const { solidMesh, edgesMesh } = useMemo(() => {
    const {
      outerDiameter: od,
      pitchCircleDiameter: pcd,
      boltHoleCount,
      boltHoleDiameter: bhd,
      bossDiameter: bossOd,
      innerDiameter: id,
      totalHeight: hTotal,
      flangeThickness: tFlange,
    } = params;

    const rFlange = od / 2;
    const rPcd = pcd / 2;
    const rBhd = bhd / 2;
    const rBoss = bossOd / 2;
    const rBore = id / 2;
    const hNeck = Math.max(5, hTotal - tFlange);

    // Group to hold all CAD components
    const geometries: THREE.BufferGeometry[] = [];

    // 1. Flange Base Ring with Bolt Holes and Center Bore Hole
    // Using 2D Shape extrusion for mathematically exact hole cutouts
    const flangeShape = new THREE.Shape();
    flangeShape.absarc(0, 0, rFlange, 0, Math.PI * 2, false);

    // Bore Hole
    const boreHole = new THREE.Path();
    boreHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
    flangeShape.holes.push(boreHole);

    // Bolt Holes on PCD
    const angleStep = (Math.PI * 2) / boltHoleCount;
    for (let i = 0; i < boltHoleCount; i++) {
      const angle = i * angleStep;
      const hx = rPcd * Math.cos(angle);
      const hy = rPcd * Math.sin(angle);
      const boltHole = new THREE.Path();
      boltHole.absarc(hx, hy, rBhd, 0, Math.PI * 2, true);
      flangeShape.holes.push(boltHole);
    }

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: tFlange,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.8,
      bevelThickness: 0.8,
      curveSegments: 48,
    };

    const flangeGeom = new THREE.ExtrudeGeometry(flangeShape, extrudeSettings);
    // Orient so Z-up
    flangeGeom.rotateX(-Math.PI / 2);
    // Align base to Y = 0
    flangeGeom.translate(0, 0, 0);
    geometries.push(flangeGeom);

    // 2. Hub / Neck Solid (Tapered Cylinder from flange to total height)
    // Outer radius tapers slightly from (rBoss + 8) at flange junction to rBoss at top
    // Inner bore radius = rBore throughout
    const neckPoints: THREE.Vector2[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = tFlange + t * hNeck;
      // Smooth taper
      const rOuter = (rBoss + 8) * (1 - t * 0.7) + rBoss * (t * 0.7);
      neckPoints.push(new THREE.Vector2(rOuter, y));
    }
    // Top welding bevel
    neckPoints.push(new THREE.Vector2(rBoss - 1.5, tFlange + hNeck));
    neckPoints.push(new THREE.Vector2(rBore, tFlange + hNeck));
    neckPoints.push(new THREE.Vector2(rBore, tFlange));
    neckPoints.push(new THREE.Vector2(neckPoints[0].x, tFlange));

    const neckGeom = new THREE.LatheGeometry(neckPoints, 48);
    geometries.push(neckGeom);

    // 3. Raised Face Gasket Ring at bottom
    const rfShape = new THREE.Shape();
    rfShape.absarc(0, 0, params.raisedFaceDiameter / 2, 0, Math.PI * 2, false);
    const rfBore = new THREE.Path();
    rfBore.absarc(0, 0, rBore, 0, Math.PI * 2, true);
    rfShape.holes.push(rfBore);

    const rfGeom = new THREE.ExtrudeGeometry(rfShape, {
      depth: params.raisedFaceHeight,
      bevelEnabled: false,
      curveSegments: 36,
    });
    rfGeom.rotateX(-Math.PI / 2);
    rfGeom.translate(0, -params.raisedFaceHeight, 0);
    geometries.push(rfGeom);

    // Combine into single solid geometry
    // We can merge geometries manually or using Three's BufferGeometryUtils
    let mergedPos: number[] = [];
    let mergedNorm: number[] = [];
    let mergedUv: number[] = [];
    let mergedIdx: number[] = [];
    let indexOffset = 0;

    for (const g of geometries) {
      const nonIndexed = g.toNonIndexed();
      const pos = nonIndexed.getAttribute('position');
      const norm = nonIndexed.getAttribute('normal');
      const uv = nonIndexed.getAttribute('uv');

      for (let i = 0; i < pos.count; i++) {
        mergedPos.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (norm) mergedNorm.push(norm.getX(i), norm.getY(i), norm.getZ(i));
        if (uv) mergedUv.push(uv.getX(i), uv.getY(i));
      }
    }

    const mergedGeom = new THREE.BufferGeometry();
    mergedGeom.setAttribute('position', new THREE.Float32BufferAttribute(mergedPos, 3));
    if (mergedNorm.length > 0) {
      mergedGeom.setAttribute('normal', new THREE.Float32BufferAttribute(mergedNorm, 3));
    } else {
      mergedGeom.computeVertexNormals();
    }
    if (mergedUv.length > 0) {
      mergedGeom.setAttribute('uv', new THREE.Float32BufferAttribute(mergedUv, 2));
    }

    // Edges for authentic CAD crisp line outline
    const edgesGeom = new THREE.EdgesGeometry(mergedGeom, 24);

    return { solidMesh: mergedGeom, edgesMesh: edgesGeom };
  }, [params]);

  // Material setup
  const materialProps = useMemo(() => {
    const clippingPlane = sectionCut
      ? [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)]
      : [];

    switch (activeMaterial) {
      case 'sus316l':
        return new THREE.MeshStandardMaterial({
          color: 0xdde5ed,
          metalness: 0.88,
          roughness: 0.28,
          side: THREE.DoubleSide,
          clippingPlanes: clippingPlane,
          clipShadows: true,
          wireframe: displayStyle === 'wireframe',
          transparent: displayStyle === 'xray',
          opacity: displayStyle === 'xray' ? 0.45 : 1.0,
        });
      case 'steel':
        return new THREE.MeshStandardMaterial({
          color: 0x8a9ba8,
          metalness: 0.7,
          roughness: 0.4,
          side: THREE.DoubleSide,
          clippingPlanes: clippingPlane,
          clipShadows: true,
          wireframe: displayStyle === 'wireframe',
          transparent: displayStyle === 'xray',
          opacity: displayStyle === 'xray' ? 0.45 : 1.0,
        });
      case 'bronze':
        return new THREE.MeshStandardMaterial({
          color: 0xd99b50,
          metalness: 0.75,
          roughness: 0.35,
          side: THREE.DoubleSide,
          clippingPlanes: clippingPlane,
          clipShadows: true,
          wireframe: displayStyle === 'wireframe',
        });
      case 'aluminum':
        return new THREE.MeshStandardMaterial({
          color: 0xe8eef5,
          metalness: 0.5,
          roughness: 0.3,
          side: THREE.DoubleSide,
          clippingPlanes: clippingPlane,
          wireframe: displayStyle === 'wireframe',
        });
      case 'titanium':
      default:
        return new THREE.MeshStandardMaterial({
          color: 0x6e7b8b,
          metalness: 0.8,
          roughness: 0.25,
          side: THREE.DoubleSide,
          clippingPlanes: clippingPlane,
          wireframe: displayStyle === 'wireframe',
        });
    }
  }, [activeMaterial, sectionCut, displayStyle]);

  // Setup Three.js Scene and Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // CAD dark workspace
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, (width / height) || (16 / 9), 1, 3000);
    camera.position.set(220, 180, 260);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, params.totalHeight / 2, 0);
    controls.maxDistance = 1500;
    controls.minDistance = 30;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(250, 400, 250);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-200, 150, -200);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0x818cf8, 0.6);
    backLight.position.set(0, -200, 200);
    scene.add(backLight);

    // CAD Grid Plane
    const gridHelper = new THREE.GridHelper(500, 50, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -params.raisedFaceHeight;
    scene.add(gridHelper);

    // Coordinate Axes Helper
    const axesHelper = new THREE.AxesHelper(60);
    axesHelper.position.set(-params.outerDiameter / 2 - 30, 0, -params.outerDiameter / 2 - 30);
    scene.add(axesHelper);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 2.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Notify that scene is ready
    setSceneReady((c) => c + 1);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update Mesh in Scene when params/material change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old mesh
    if (mainMeshRef.current) {
      scene.remove(mainMeshRef.current);
      mainMeshRef.current = null;
    }
    if (edgesMeshRef.current) {
      scene.remove(edgesMeshRef.current);
      edgesMeshRef.current = null;
    }

    // Add new solid CAD mesh
    const mesh = new THREE.Mesh(solidMesh, materialProps);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    mainMeshRef.current = mesh;

    // Center orbit controls target to the middle of the CAD solid
    if (controlsRef.current) {
      controlsRef.current.target.set(0, params.totalHeight / 2, 0);
      controlsRef.current.update();
    }

    // Add crisp CAD edges
    if (displayStyle !== 'wireframe') {
      const lineMaterial = new THREE.LineBasicMaterial({
        color: displayStyle === 'edges' ? 0x38bdf8 : 0x0f172a,
        linewidth: 1.5,
        clippingPlanes: sectionCut ? [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)] : [],
      });
      const edges = new THREE.LineSegments(edgesMesh, lineMaterial);
      scene.add(edges);
      edgesMeshRef.current = edges;
    }

    // Optional Bolt Studs & Hex Nuts in Bolt Holes
    const boltGroup = new THREE.Group();
    boltGroup.name = 'boltGroup';
    // Remove existing boltGroup if present
    const existingBolts = scene.getObjectByName('boltGroup');
    if (existingBolts) scene.remove(existingBolts);

    if (showBolts && !sectionCut) {
      const { pitchCircleDiameter: pcd, boltHoleCount, boltHoleDiameter: bhd, flangeThickness: tFlange } = params;
      const rPcd = pcd / 2;
      const boltRadius = (bhd / 2) * 0.9;
      const boltLength = tFlange + 32;

      const boltMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.2,
      });

      const nutMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.92,
        roughness: 0.25,
      });

      for (let i = 0; i < boltHoleCount; i++) {
        const angle = (i * 2 * Math.PI) / boltHoleCount;
        const bx = rPcd * Math.cos(angle);
        const bz = rPcd * Math.sin(angle);

        // Stud shank
        const shankGeom = new THREE.CylinderGeometry(boltRadius, boltRadius, boltLength, 16);
        const shankMesh = new THREE.Mesh(shankGeom, boltMat);
        shankMesh.position.set(bx, tFlange / 2, bz);
        boltGroup.add(shankMesh);

        // Hex Nut Top
        const nutGeom = new THREE.CylinderGeometry(boltRadius * 1.7, boltRadius * 1.7, 8, 6);
        const nutMesh = new THREE.Mesh(nutGeom, nutMat);
        nutMesh.position.set(bx, tFlange + 5, bz);
        boltGroup.add(nutMesh);

        // Hex Nut Bottom
        const nutBottom = new THREE.Mesh(nutGeom, nutMat);
        nutBottom.position.set(bx, -5, bz);
        boltGroup.add(nutBottom);
      }
      scene.add(boltGroup);
    }

    // Update orbit target to center of model
    if (controlsRef.current) {
      controlsRef.current.target.set(0, params.totalHeight / 2, 0);
    }
  }, [sceneReady, solidMesh, edgesMesh, materialProps, displayStyle, sectionCut, showBolts, params]);

  // Camera View Presets
  const setPresetView = (view: 'iso' | 'top' | 'front' | 'section') => {
    setCameraView(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const r = Math.max(params.outerDiameter, params.totalHeight) * 2.2;
    const cy = params.totalHeight / 2;

    switch (view) {
      case 'iso':
        camera.position.set(r * 0.8, r * 0.7, r * 0.8);
        controls.target.set(0, cy, 0);
        break;
      case 'top':
        camera.position.set(0, r * 1.4, 0.001);
        controls.target.set(0, 0, 0);
        break;
      case 'front':
        camera.position.set(0, cy, r * 1.3);
        controls.target.set(0, cy, 0);
        break;
      case 'section':
        setSectionCut(true);
        camera.position.set(r * 1.3, cy, 0);
        controls.target.set(0, cy, 0);
        break;
    }
    controls.update();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative text-slate-100">
      {/* 3D Viewer Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-emerald-300">
            3D 파라메트릭 솔리드 모델 <span className="text-xs text-slate-400 font-mono">(PARAMETRIC 3D CAD)</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 font-mono">
            엔진: Three.js PBR Solid
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Section Cut Toggle */}
          <button
            id="btn-section-cut"
            onClick={() => setSectionCut(!sectionCut)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
              sectionCut
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="A-A 단면 1/2 절단 뷰"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>A-A 단면 뷰 {sectionCut ? '(ON)' : '(OFF)'}</span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            id="btn-auto-rotate"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="360° 자동 회전"
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>360° 회전</span>
          </button>

          {/* 3D CAD Export Dropdown (Primary Green Highlight) */}
          <div className="relative">
            <button
              id="btn-export-3d"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>3D 도면 다운로드</span>
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    if (mainMeshRef.current) exportMeshToSTL(mainMeshRef.current, `${blueprint.id}_solid.stl`);
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-emerald-300">STL 3D 솔리드 (.stl)</div>
                    <div className="text-[10px] text-slate-400">3D 프린팅 및 CAM 가공용</div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">STL</span>
                </button>
                <button
                  onClick={() => {
                    if (mainMeshRef.current) exportMeshToOBJ(mainMeshRef.current, `${blueprint.id}_mesh.obj`);
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-100 flex items-center justify-between border-t border-slate-700/60"
                >
                  <div>
                    <div className="font-medium text-cyan-300">Wavefront OBJ (.obj)</div>
                    <div className="text-[10px] text-slate-400">SolidWorks, Blender, Maya 호환</div>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded">OBJ</span>
                </button>
              </div>
            )}
          </div>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub Toolbar: Camera Presets, Shading Style & Materials */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs gap-2 z-10">
        {/* View Camera Presets */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
          <button
            onClick={() => setPresetView('iso')}
            className={`px-2 py-0.5 rounded ${cameraView === 'iso' ? 'bg-cyan-900/60 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            등각(ISO)
          </button>
          <button
            onClick={() => setPresetView('top')}
            className={`px-2 py-0.5 rounded ${cameraView === 'top' ? 'bg-cyan-900/60 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            평면(Top)
          </button>
          <button
            onClick={() => setPresetView('front')}
            className={`px-2 py-0.5 rounded ${cameraView === 'front' ? 'bg-cyan-900/60 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            정면(Front)
          </button>
          <button
            onClick={() => setPresetView('section')}
            className={`px-2 py-0.5 rounded ${cameraView === 'section' ? 'bg-rose-900/60 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
          >
            A-A단면(Section)
          </button>
        </div>

        {/* Shading mode */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1">렌더링:</span>
          {(['shaded', 'edges', 'wireframe', 'xray'] as DisplayStyle[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayStyle(mode)}
              className={`px-2 py-0.5 rounded capitalize ${
                displayStyle === mode
                  ? 'bg-slate-700 text-cyan-300 font-medium border border-slate-600'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {mode === 'shaded' ? '쉐이딩' : mode === 'edges' ? 'CAD 와이어' : mode === 'wireframe' ? '격자망' : 'X-Ray'}
            </button>
          ))}
        </div>

        {/* Material Selection */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1">재질:</span>
          {(['sus316l', 'steel', 'aluminum', 'bronze'] as CADMaterialType[]).map((mat) => (
            <button
              key={mat}
              onClick={() => setActiveMaterial(mat)}
              className={`px-2 py-0.5 rounded text-[11px] uppercase ${
                activeMaterial === mat
                  ? 'bg-indigo-900/60 text-indigo-300 font-medium border border-indigo-600'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {mat}
            </button>
          ))}
          <button
            onClick={() => setShowBolts(!showBolts)}
            className={`ml-2 px-2 py-0.5 rounded text-[11px] border ${
              showBolts
                ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="볼트 및 너트 체결 토글"
          >
            볼트 {showBolts ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full min-h-[380px] relative cursor-grab active:cursor-grabbing">
        {/* Floating CAD HUD Overlay */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono pointer-events-none z-10 shadow-xl space-y-1">
          <div className="text-cyan-400 font-semibold text-xs flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" />
            <span>{blueprint.name}</span>
          </div>
          <div className="text-slate-300">
            규격: <span className="text-amber-400">{blueprint.standard}</span>
          </div>
          <div className="text-slate-400">
            외경 OD: <span className="text-slate-200">Ø{params.outerDiameter}mm</span> | PCD:{' '}
            <span className="text-slate-200">Ø{params.pitchCircleDiameter}mm</span>
          </div>
          <div className="text-slate-400">
            볼트: <span className="text-slate-200">{params.boltHoleCount}-Ø{params.boltHoleDiameter}</span> | 높이:{' '}
            <span className="text-slate-200">{params.totalHeight}mm</span>
          </div>
          <div className="text-slate-400">
            내경 Bore: <span className="text-slate-200">Ø{params.innerDiameter}mm</span> | 보스:{' '}
            <span className="text-slate-200">Ø{params.bossDiameter}mm</span>
          </div>
        </div>

        {/* Section Cut Indicator Banner */}
        {sectionCut && (
          <div className="absolute top-3 right-3 bg-rose-950/80 backdrop-blur-md border border-rose-700/60 px-3 py-1.5 rounded-lg text-xs text-rose-200 z-10 flex items-center gap-2 pointer-events-none">
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span>SECTION A-A 단면 절단 뷰 활성 (내부 보어 및 볼트홀 절단면 확인)</span>
          </div>
        )}

        {/* Navigation Help Cue */}
        <div className="absolute bottom-3 right-3 bg-slate-950/75 backdrop-blur px-2.5 py-1 rounded text-[10px] text-slate-400 pointer-events-none z-10 font-mono border border-slate-800">
          좌클릭 드래그: 3D 회전 | 우클릭: 화면 이동 | 휠: 줌
        </div>
      </div>

      {/* 3D Viewer Status Footer */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            3D 기하 정확도: <strong className="text-slate-200 font-mono">100% 2D 도면 연동</strong>
          </span>
          <span>|</span>
          <span>
            삼각망 Facets:{' '}
            <strong className="text-slate-200 font-mono">
              {solidMesh.getAttribute('position')
                ? Math.round(solidMesh.getAttribute('position').count / 3).toLocaleString()
                : '2,480'}
            </strong>
          </span>
          <span>|</span>
          <span>
            재질: <strong className="text-slate-200 font-mono">{activeMaterial.toUpperCase()}</strong>
          </span>
        </div>

        <div className="text-[11px] text-cyan-400">
          파라메트릭 솔리드 모델 생성 완료
        </div>
      </div>
    </div>
  );
};
