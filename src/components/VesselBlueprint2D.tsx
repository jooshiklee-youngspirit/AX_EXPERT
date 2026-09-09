import React, { useState, useRef } from 'react';
import { BlueprintModel, VesselPlantParams, SelectedComponentInfo } from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Layers,
  ShieldAlert,
  Flame,
  FileText,
  Sliders,
  CheckCircle2,
  Ruler,
  MousePointerClick,
  X,
  Cpu,
} from 'lucide-react';
import { exportSvgElement } from '../utils/dxfExporter';

interface VesselBlueprint2DProps {
  blueprint: BlueprintModel;
  vesselParams: VesselPlantParams;
  onOpenAuditModal?: () => void;
  onOpenSpec?: () => void;
  onOpenPresetSelector?: () => void;
  onOpenPlateMarking?: () => void;
  selectedComponent?: SelectedComponentInfo | null;
  onSelectComponent?: (comp: SelectedComponentInfo | null) => void;
}

export const VesselBlueprint2D: React.FC<VesselBlueprint2DProps> = ({
  blueprint,
  vesselParams,
  onOpenAuditModal,
  onOpenSpec,
  onOpenPresetSelector,
  onOpenPlateMarking,
  selectedComponent,
  onSelectComponent,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showWelds, setShowWelds] = useState(true);
  const [showInternals, setShowInternals] = useState(true);
  const [cadTheme, setCadTheme] = useState<'blueprint' | 'white' | 'dark'>('blueprint');
  const [rulerMode, setRulerMode] = useState<boolean>(false);
  const [rulerPoints, setRulerPoints] = useState<Array<{ x: number; y: number }>>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const {
    totalLengthM: L,
    outerDiameterM: D,
    shellThicknessMm: tShell,
    shellCanCount: canCount,
    projectName,
    client,
    equipmentTag,
    fabricator,
  } = vesselParams;

  // Drawing Canvas layout (SVG coordinate space: 1000 x 540)
  // Left: General Elevation View (Horizontal) at y=160
  // Right / Bottom: Section A-A Internals and Groove Detail at y=350
  const svgWidth = 1000;
  const svgHeight = 540;

  // Horizontal elevation drawing coordinates
  const elevStartX = 65;
  const elevEndX = 845;
  const elevTotalW = (elevEndX - elevStartX) * zoom;
  const elevY = 160;
  const elevDiaH = Math.min(80, Math.max(48, (D / L) * elevTotalW * 3.6)); // proportional diameter

  const headW = elevDiaH * 0.45; // 2:1 ellipsoidal head depth in pixels
  const shellBodyW = elevTotalW - headW * 2;
  const canW = shellBodyW / canCount;

  // Color theme styles
  const isBlue = cadTheme === 'blueprint';
  const isDark = cadTheme === 'dark';

  const themeClasses = isBlue
    ? 'bg-[#002b4d] text-cyan-200'
    : isDark
    ? 'bg-slate-950 text-slate-200'
    : 'bg-white text-slate-800';

  const strokePrimary = isBlue ? '#38bdf8' : isDark ? '#94a3b8' : '#0f172a';
  const strokeSecondary = isBlue ? '#0284c7' : isDark ? '#475569' : '#64748b';
  const strokeWeld = '#f59e0b'; // Amber glowing weld line
  const strokeDim = isBlue ? '#fbbf24' : isDark ? '#f59e0b' : '#d97706';
  const fillPlate = isBlue ? '#003766' : isDark ? '#1e293b' : '#f1f5f9';

  // Ruler measurement calculations
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!rulerMode || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;

    if (rulerPoints.length === 0 || rulerPoints.length >= 2) {
      setRulerPoints([{ x: Math.round(svgX), y: Math.round(svgY) }]);
    } else {
      setRulerPoints([...rulerPoints, { x: Math.round(svgX), y: Math.round(svgY) }]);
    }
  };

  let measuredMm = 0;
  let measuredM = '0.00';
  if (rulerPoints.length === 2) {
    const p1 = rulerPoints[0];
    const p2 = rulerPoints[1];
    const pxDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const mmPerPx = (L * 1000) / elevTotalW;
    measuredMm = Math.round(pxDist * mmPerPx);
    measuredM = (measuredMm / 1000).toFixed(2);
  }

  const isSelected = (tagOrId: string) => {
    if (!selectedComponent) return false;
    return (
      selectedComponent.id.toLowerCase() === tagOrId.toLowerCase() ||
      selectedComponent.tag.toLowerCase() === tagOrId.toLowerCase()
    );
  };

  return (
    <div className={`relative w-full h-full flex flex-col select-none overflow-hidden ${themeClasses}`}>
      {/* Floating Active Component Badge (Bi-directional Sync) */}
      {selectedComponent && (
        <div className="absolute top-11 right-4 z-20 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/80 shadow-xl text-xs flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-slate-400">선택 부재:</span>
          <span className="font-bold text-cyan-300 font-mono">[{selectedComponent.tag}]</span>
          <span className="text-slate-200 truncate max-w-[160px]">{selectedComponent.name}</span>
          <button
            onClick={() => onSelectComponent?.(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Ruler Measurement Tool Status Bar */}
      {rulerMode && (
        <div className="absolute top-11 left-4 z-20 px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/70 shadow-xl text-xs flex items-center gap-3 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Ruler className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>
              {rulerPoints.length === 0
                ? '도면에서 시작점(A)을 클릭하세요'
                : rulerPoints.length === 1
                ? '도면에서 끝점(B)을 클릭하세요'
                : `계측 결과: ${measuredMm.toLocaleString()} mm (${measuredM} m)`}
            </span>
          </div>
          {rulerPoints.length > 0 && (
            <button
              onClick={() => setRulerPoints([])}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              재측정
            </button>
          )}
          <button
            onClick={() => {
              setRulerMode(false);
              setRulerPoints([]);
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* 2D Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-slate-700/50 bg-slate-950/40 backdrop-blur-md z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-wide flex items-center gap-1.5 truncate">
              <span className="truncate">{equipmentTag} 도면 (DEMO-PV-101)</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono shrink-0">
                U2
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {client} • {projectName}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
          {/* Preset Selector */}
          {onOpenPresetSelector && (
            <button
              onClick={onOpenPresetSelector}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">기기 </span><span>프리셋</span>
            </button>
          )}

          {/* Audit Modal Trigger */}
          {onOpenAuditModal && (
            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>납기 감사</span>
              <span className="hidden md:inline">(Slack)</span>
            </button>
          )}

          {/* Plate Marking & NC G-Code Transmission Trigger */}
          {onOpenPlateMarking && (
            <button
              onClick={onOpenPlateMarking}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all cursor-pointer"
              title="부재 분할 전개도, 마킹선(용접/조립/롤링/트레이) & NC 철판 절단기 G-Code 전송 창 열기"
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>부재 마킹 &amp; NC</span>
            </button>
          )}

          <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

          {/* Weld seams toggle */}
          <button
            onClick={() => setShowWelds(!showWelds)}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              showWelds
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="C-Seam 및 L-Seam 용접선 표시"
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">용접 심</span>
          </button>

          {/* Interactive Ruler Measurement Tool */}
          <button
            onClick={() => {
              setRulerMode(!rulerMode);
              setRulerPoints([]);
            }}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              rulerMode
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="2D 실측 계측 도구 (두 지점 클릭하여 mm 측정)"
          >
            <Ruler className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">실측 자</span>
          </button>

          {/* Theme selector */}
          <button
            onClick={() => setCadTheme(cadTheme === 'blueprint' ? 'dark' : cadTheme === 'dark' ? 'white' : 'blueprint')}
            className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer font-mono"
            title="도면 테마 전환"
          >
            {cadTheme === 'blueprint' ? 'BLUE' : cadTheme.toUpperCase()}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="축소"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono w-7 text-center text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="확대"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="줌 리셋"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 w-full h-full relative overflow-auto flex items-center justify-center p-2">
        <svg
          ref={svgRef}
          onClick={handleSvgClick}
          id="cad-blueprint-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ cursor: rulerMode ? 'crosshair' : 'default' }}
          className="w-full h-full max-w-5xl max-h-[720px] drop-shadow-md select-none"
        >
          {/* Blueprint Grid Lines */}
          <defs>
            <pattern id="vessel-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke={isBlue ? '#003f6f' : isDark ? '#1e293b' : '#f1f5f9'}
                strokeWidth="0.5"
              />
            </pattern>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeDim} />
            </marker>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.85" />
            </filter>
          </defs>

          <rect width={svgWidth} height={svgHeight} fill="url(#vessel-grid)" />

          {/* OUTER BORDER & TITLE BLOCK (ASME CAD FORMAT) */}
          <rect
            x="15"
            y="15"
            width={svgWidth - 30}
            height={svgHeight - 30}
            fill="none"
            stroke={strokePrimary}
            strokeWidth="2"
          />

          {/* ============================================================ */}
          {/* VIEW 1: TOWER ELEVATION VIEW (측면도)                          */}
          {/* ============================================================ */}
          <g id="elevation-view">
            <text
              x={elevStartX}
              y={elevY - elevDiaH / 2 - 25}
              fill={strokePrimary}
              fontSize="12"
              fontWeight="bold"
              letterSpacing="1"
            >
              [VIEW 1] GENERAL ELEVATION VIEW (전체 측면도) • SCALE 1:120 • 2D-3D 동기화 인터랙티브
            </text>

            {/* Left 2:1 Ellipsoidal Head */}
            <path
              d={`M ${elevStartX + headW} ${elevY - elevDiaH / 2} 
                  C ${elevStartX} ${elevY - elevDiaH / 2}, ${elevStartX} ${elevY + elevDiaH / 2}, ${elevStartX + headW} ${elevY + elevDiaH / 2}`}
              fill={fillPlate}
              stroke={isSelected('head-01') ? '#06b6d4' : strokePrimary}
              strokeWidth={isSelected('head-01') ? '3.5' : '2'}
              filter={isSelected('head-01') ? 'url(#glow-cyan)' : undefined}
              className="cursor-pointer hover:opacity-85 transition-all"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'head-01',
                    tag: 'HEAD-01',
                    name: '2:1 타원체 경판 (Ellipsoidal Head)',
                    spec: `Ø${(D * 1000).toLocaleString()}mm x ${tShell}t SA516-70N`,
                    rating: 'Design 3.2 MPa',
                    weldType: 'Crown & Petal C-Seam (100% RT)',
                    type: 'head',
                  });
                }
              }}
            />

            {/* Right 2:1 Ellipsoidal Head */}
            <path
              d={`M ${elevStartX + headW + shellBodyW} ${elevY - elevDiaH / 2} 
                  C ${elevStartX + elevTotalW} ${elevY - elevDiaH / 2}, ${elevStartX + elevTotalW} ${elevY + elevDiaH / 2}, ${elevStartX + headW + shellBodyW} ${elevY + elevDiaH / 2}`}
              fill={fillPlate}
              stroke={isSelected('head-02') ? '#06b6d4' : strokePrimary}
              strokeWidth={isSelected('head-02') ? '3.5' : '2'}
              filter={isSelected('head-02') ? 'url(#glow-cyan)' : undefined}
              className="cursor-pointer hover:opacity-85 transition-all"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'head-02',
                    tag: 'HEAD-02',
                    name: '우측 2:1 타원체 경판 (Dished Head)',
                    spec: `Ø${(D * 1000).toLocaleString()}mm x ${tShell}t SA516-70N`,
                    rating: 'Design 3.2 MPa',
                    weldType: 'C-Seam 100% RT',
                    type: 'head',
                  });
                }
              }}
            />

            {/* Main Shell Cylinder Outline */}
            <rect
              x={elevStartX + headW}
              y={elevY - elevDiaH / 2}
              width={shellBodyW}
              height={elevDiaH}
              fill={fillPlate}
              stroke={strokePrimary}
              strokeWidth="2"
            />

            {/* Left Base Skirt (스커트 지지대) */}
            <rect
              x={elevStartX - 15}
              y={elevY - elevDiaH / 2 - 6}
              width="24"
              height={elevDiaH + 12}
              fill={isSelected('skirt') ? 'rgba(6, 182, 212, 0.15)' : 'none'}
              stroke={isSelected('skirt') ? '#06b6d4' : strokeSecondary}
              strokeWidth={isSelected('skirt') ? '2.5' : '1.8'}
              filter={isSelected('skirt') ? 'url(#glow-cyan)' : undefined}
              className="cursor-pointer hover:opacity-85 transition-all"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'skirt',
                    tag: 'SKIRT',
                    name: '기초 지지 스커트 (Support Skirt)',
                    spec: `H ${vesselParams.skirtHeightM}m x t 95mm SA516-70N`,
                    rating: 'Anchor Bolt 48-M90 Gr.B7',
                    weldType: 'Fillet + Full Pen T-Joint',
                    type: 'skirt',
                  });
                }
              }}
            />
            <line
              x1={elevStartX - 15}
              y1={elevY - elevDiaH / 2 - 12}
              x2={elevStartX - 15}
              y2={elevY + elevDiaH / 2 + 12}
              stroke={isSelected('skirt') ? '#06b6d4' : strokeSecondary}
              strokeWidth="2.5"
            />
            <text
              x={elevStartX - 12}
              y={elevY + elevDiaH / 2 + 28}
              fill={isSelected('skirt') ? '#06b6d4' : strokeSecondary}
              fontSize="9"
              textAnchor="middle"
              className="cursor-pointer font-bold"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'skirt',
                    tag: 'SKIRT',
                    name: '기초 지지 스커트 (Support Skirt)',
                    spec: `H ${vesselParams.skirtHeightM}m x t 95mm SA516-70N`,
                    rating: 'Anchor Bolt 48-M90 Gr.B7',
                    weldType: 'Fillet + Full Pen T-Joint',
                    type: 'skirt',
                  });
                }
              }}
            >
              SKIRT ({vesselParams.skirtHeightM}m)
            </text>

            {/* 28 Shell Cans & Circumferential Seams (C-Seams) */}
            {Array.from({ length: canCount + 1 }).map((_, i) => {
              const xPos = elevStartX + headW + i * canW;
              const seamId = `c-seam-${i + 1}`;
              const seamSelected = isSelected(seamId) || isSelected(`C-SEAM #${i + 1}`);

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (!rulerMode) {
                      e.stopPropagation();
                      onSelectComponent?.({
                        id: seamId,
                        tag: `C-SEAM #${i + 1}`,
                        name: `C-Seam 둘레 용접부 #${i + 1}`,
                        spec: `Shell Can #${i + 1} ↔ #${i + 2} (t=${tShell}mm)`,
                        rating: 'WPS-SAW-04 (Tandem 4극)',
                        weldType: 'Narrow Gap SAW (100% PAUT/TOFD)',
                        type: 'shell',
                      });
                    }
                  }}
                >
                  {/* Invisible broad hitbox for easy clicking */}
                  <line
                    x1={xPos}
                    y1={elevY - elevDiaH / 2 - 4}
                    x2={xPos}
                    y2={elevY + elevDiaH / 2 + 4}
                    stroke="transparent"
                    strokeWidth="10"
                  />

                  {/* C-Seam Weld Line */}
                  <line
                    x1={xPos}
                    y1={elevY - elevDiaH / 2}
                    x2={xPos}
                    y2={elevY + elevDiaH / 2}
                    stroke={seamSelected ? '#06b6d4' : showWelds ? strokeWeld : strokeSecondary}
                    strokeWidth={seamSelected ? '3.5' : showWelds ? '1.8' : '1'}
                    strokeDasharray={showWelds ? 'none' : '4,2'}
                    filter={seamSelected ? 'url(#glow-cyan)' : undefined}
                  />

                  {/* Staggered Longitudinal Seams (L-Seams) */}
                  {i < canCount && showWelds && (
                    <line
                      x1={xPos}
                      y1={elevY - elevDiaH / 4 + ((i % 3) * elevDiaH) / 4}
                      x2={xPos + canW}
                      y2={elevY - elevDiaH / 4 + ((i % 3) * elevDiaH) / 4}
                      stroke={strokeWeld}
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                    />
                  )}
                </g>
              );
            })}

            {/* Centerline (CL) */}
            <line
              x1={elevStartX - 25}
              y1={elevY}
              x2={elevStartX + elevTotalW + 25}
              y2={elevY}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="14,3,3,3"
            />

            {/* Banner Overlay outline matching photo */}
            <rect
              x={elevStartX + headW + shellBodyW * 0.32}
              y={elevY - elevDiaH / 2 + 6}
              width={shellBodyW * 0.42}
              height={elevDiaH - 12}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeDasharray="5,3"
            />
            <text
              x={elevStartX + headW + shellBodyW * 0.53}
              y={elevY + 4}
              fill="#60a5fa"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              [현수막 부착 구역: DEMO CHEMICAL PLANT • W Company]
            </text>

            {/* Process Nozzles & Manholes with bi-directional click and highlight */}
            {/* Top Nozzle N1 */}
            <g
              id="nozzle-n1"
              className="cursor-pointer"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'N1',
                    tag: 'N1',
                    name: '상부 가스 배출 노즐 (Vapor Outlet)',
                    spec: 'Ø1,200mm (48") x 32t SA-350 LF2',
                    rating: 'Class 300 RF',
                    weldType: 'Full Penetration Groove (100% RT)',
                    type: 'nozzle',
                  });
                }
              }}
            >
              <rect
                x={elevStartX + headW + shellBodyW * 0.12}
                y={elevY - elevDiaH / 2 - 16}
                width="14"
                height="16"
                fill={isSelected('N1') ? 'rgba(6, 182, 212, 0.25)' : fillPlate}
                stroke={isSelected('N1') ? '#06b6d4' : strokePrimary}
                strokeWidth={isSelected('N1') ? '3' : '1.5'}
                filter={isSelected('N1') ? 'url(#glow-cyan)' : undefined}
              />
              <line
                x1={elevStartX + headW + shellBodyW * 0.12 - 4}
                y1={elevY - elevDiaH / 2 - 16}
                x2={elevStartX + headW + shellBodyW * 0.12 + 18}
                y2={elevY - elevDiaH / 2 - 16}
                stroke={isSelected('N1') ? '#06b6d4' : strokePrimary}
                strokeWidth={isSelected('N1') ? '4' : '3'}
              />
              <text
                x={elevStartX + headW + shellBodyW * 0.12 + 7}
                y={elevY - elevDiaH / 2 - 20}
                fill={isSelected('N1') ? '#06b6d4' : strokePrimary}
                fontSize="9"
                fontWeight={isSelected('N1') ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                N1 (Ø1200)
              </text>
            </g>

            {/* Top Nozzle N2 */}
            <g
              id="nozzle-n2"
              className="cursor-pointer"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'N2',
                    tag: 'N2',
                    name: '환류액 주입 노즐 (Reflux Liquid Inlet)',
                    spec: 'Ø1,600mm (64") x 36t SA-350 LF2',
                    rating: 'Class 300 RF',
                    weldType: 'Full Penetration Groove (100% RT)',
                    type: 'nozzle',
                  });
                }
              }}
            >
              <rect
                x={elevStartX + headW + shellBodyW * 0.78}
                y={elevY - elevDiaH / 2 - 18}
                width="18"
                height="18"
                fill={isSelected('N2') ? 'rgba(6, 182, 212, 0.25)' : fillPlate}
                stroke={isSelected('N2') ? '#06b6d4' : strokePrimary}
                strokeWidth={isSelected('N2') ? '3' : '1.5'}
                filter={isSelected('N2') ? 'url(#glow-cyan)' : undefined}
              />
              <line
                x1={elevStartX + headW + shellBodyW * 0.78 - 4}
                y1={elevY - elevDiaH / 2 - 18}
                x2={elevStartX + headW + shellBodyW * 0.78 + 22}
                y2={elevY - elevDiaH / 2 - 18}
                stroke={isSelected('N2') ? '#06b6d4' : strokePrimary}
                strokeWidth={isSelected('N2') ? '4' : '3'}
              />
              <text
                x={elevStartX + headW + shellBodyW * 0.78 + 9}
                y={elevY - elevDiaH / 2 - 22}
                fill={isSelected('N2') ? '#06b6d4' : strokePrimary}
                fontSize="9"
                fontWeight={isSelected('N2') ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                N2 (Ø1600)
              </text>
            </g>

            {/* Bottom Nozzles & Manhole M1 */}
            <g
              id="manhole-m1"
              className="cursor-pointer"
              onClick={(e) => {
                if (!rulerMode) {
                  e.stopPropagation();
                  onSelectComponent?.({
                    id: 'M1',
                    tag: 'M1',
                    name: '검사 맨홀 (Manhole M1)',
                    spec: 'Ø900mm (36") H-Neck Flange',
                    rating: 'Class 300 Flange w/ Davit Hinge',
                    weldType: '100% PAUT + MT 검사',
                    type: 'manhole',
                  });
                }
              }}
            >
              <rect
                x={elevStartX + headW + shellBodyW * 0.25}
                y={elevY + elevDiaH / 2}
                width="15"
                height="15"
                fill={isSelected('M1') ? 'rgba(6, 182, 212, 0.25)' : fillPlate}
                stroke={isSelected('M1') ? '#06b6d4' : strokePrimary}
                strokeWidth={isSelected('M1') ? '3' : '1.5'}
                filter={isSelected('M1') ? 'url(#glow-cyan)' : undefined}
              />
              <text
                x={elevStartX + headW + shellBodyW * 0.25 + 7}
                y={elevY + elevDiaH / 2 + 25}
                fill={isSelected('M1') ? '#06b6d4' : strokePrimary}
                fontSize="9"
                fontWeight={isSelected('M1') ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                M1 (맨홀 Ø900)
              </text>
            </g>

            {/* DIMENSION LINES: Overall Length L = 101,100 mm */}
            <g id="dim-overall-length">
              <line
                x1={elevStartX}
                y1={elevY - elevDiaH / 2 - 40}
                x2={elevStartX + elevTotalW}
                y2={elevY - elevDiaH / 2 - 40}
                stroke={strokeDim}
                strokeWidth="1.2"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <line x1={elevStartX} y1={elevY - elevDiaH / 2 - 46} x2={elevStartX} y2={elevY - elevDiaH / 2} stroke={strokeDim} strokeWidth="0.8" />
              <line x1={elevStartX + elevTotalW} y1={elevY - elevDiaH / 2 - 46} x2={elevStartX + elevTotalW} y2={elevY - elevDiaH / 2} stroke={strokeDim} strokeWidth="0.8" />
              <text
                x={elevStartX + elevTotalW / 2}
                y={elevY - elevDiaH / 2 - 45}
                fill={strokeDim}
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                전장 L = 101,100 mm (96.0 m)
              </text>
            </g>

            {/* DIMENSION LINES: Outer Diameter OD = Ø10,800 mm */}
            <g id="dim-outer-diameter">
              <line
                x1={elevStartX + elevTotalW + 18}
                y1={elevY - elevDiaH / 2}
                x2={elevStartX + elevTotalW + 18}
                y2={elevY + elevDiaH / 2}
                stroke={strokeDim}
                strokeWidth="1.2"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <line x1={elevStartX + elevTotalW} y1={elevY - elevDiaH / 2} x2={elevStartX + elevTotalW + 24} y2={elevY - elevDiaH / 2} stroke={strokeDim} strokeWidth="0.8" />
              <line x1={elevStartX + elevTotalW} y1={elevY + elevDiaH / 2} x2={elevStartX + elevTotalW + 24} y2={elevY + elevDiaH / 2} stroke={strokeDim} strokeWidth="0.8" />
              {/* OD Dimension Label */}
              <text
                x={Math.min(svgWidth - 65, elevStartX + elevTotalW + 18)}
                y={elevY + 4}
                fill={strokeDim}
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                OD Ø10,800
              </text>
            </g>
          </g>

          {/* ============================================================ */}
          {/* VIEW 2: SECTION A-A & WELD GROOVE DETAIL                     */}
          {/* ============================================================ */}
          <g id="section-detail" transform="translate(30, 275)">
            {/* Section A-A: Internal Trays Representation */}
            <text x="40" y="20" fill={strokePrimary} fontSize="11" fontWeight="bold" letterSpacing="0.5">
              [SECTION A-A] 내부 84단 트레이 서포트 링 및 쉘 (t=85mm SA516-70N)
            </text>

            {/* Tray Cutaway Box */}
            <rect x="40" y="32" width="480" height="95" fill={fillPlate} stroke={strokePrimary} strokeWidth="1.5" />
            <line x1="40" y1="38" x2="520" y2="38" stroke={strokePrimary} strokeWidth="2.5" />
            <line x1="40" y1="121" x2="520" y2="121" stroke={strokePrimary} strokeWidth="2.5" />

            {/* 16 Sample Tray lines */}
            {Array.from({ length: 16 }).map((_, idx) => {
              const tx = 65 + idx * 28;
              return (
                <g key={idx}>
                  <line x1={tx} y1="42" x2={tx} y2="117" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,1" />
                  <rect x={tx - 3} y="40" width="6" height="4" fill="#38bdf8" />
                  <rect x={tx - 3} y="115" width="6" height="4" fill="#38bdf8" />
                </g>
              );
            })}
            <text x="280" y="85" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
              트레이 간격 850mm x 84단 (SUS316L 앵글 링 용접 취부)
            </text>

            {/* DETAIL B: Double-U Groove Welding Detail */}
            <g transform="translate(560, 10)">
              <text x="0" y="10" fill={strokeWeld} fontSize="11" fontWeight="bold">
                [DETAIL B] ASME Double-U 그루브 개선 형상
              </text>
              <rect x="0" y="22" width="260" height="95" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,2" />

              {/* U-Groove Drawing */}
              <path
                d="M 25 40 L 70 40 L 85 65 L 85 75 L 70 100 L 25 100 
                   M 235 40 L 190 40 L 175 65 L 175 75 L 190 100 L 235 100"
                fill="none"
                stroke={strokePrimary}
                strokeWidth="1.8"
              />
              {/* Weld Bead Hatching (Tandem SAW 32 Passes) */}
              <path
                d="M 85 65 L 175 65 L 175 75 L 85 75 Z"
                fill="#f59e0b"
                opacity="0.6"
              />
              <text x="130" y="58" fill="#f59e0b" fontSize="8" textAnchor="middle">
                탠덤 SAW 자동 용접
              </text>
              <text x="130" y="73" fill="#fef08a" fontSize="7" textAnchor="middle" fontWeight="bold">
                루트 간격 3mm
              </text>
              <text x="130" y="92" fill="#94a3b8" fontSize="8" textAnchor="middle">
                개선 각도 15° (Double-U)
              </text>
              <text x="130" y="110" fill="#22c55e" fontSize="8" textAnchor="middle" fontWeight="bold">
                100% RT 전수 합격 (UW-51)
              </text>
            </g>
          </g>

          {/* ============================================================ */}
          {/* ASME TITLE BLOCK (하단 정품 도면 명판)                         */}
          {/* ============================================================ */}
          <g id="title-block" transform={`translate(${svgWidth - 420}, ${svgHeight - 105})`}>
            <rect x="0" y="0" width="400" height="85" fill={isBlue ? '#001e38' : '#0f172a'} stroke={strokePrimary} strokeWidth="1.5" />
            <line x1="0" y1="28" x2="400" y2="28" stroke={strokePrimary} strokeWidth="1" />
            <line x1="0" y1="56" x2="400" y2="56" stroke={strokePrimary} strokeWidth="1" />
            <line x1="200" y1="28" x2="200" y2="85" stroke={strokePrimary} strokeWidth="1" />

            {/* Row 1: Project & Client */}
            <text x="10" y="18" fill="#94a3b8" fontSize="9">PROJECT / CLIENT:</text>
            <text x="115" y="18" fill="#f8fafc" fontSize="10" fontWeight="bold">
              {projectName} / {client}
            </text>

            {/* Row 2: Equipment Tag & Fabricator */}
            <text x="10" y="45" fill="#94a3b8" fontSize="9">EQUIPMENT:</text>
            <text x="75" y="45" fill="#38bdf8" fontSize="11" fontWeight="bold">
              {equipmentTag}
            </text>

            <text x="210" y="45" fill="#94a3b8" fontSize="9">FABRICATOR:</text>
            <text x="280" y="45" fill="#0284c7" fontSize="11" fontWeight="bold">
              {fabricator}
            </text>

            {/* Row 3: Design Code & Total Weight */}
            <text x="10" y="73" fill="#94a3b8" fontSize="9">DESIGN CODE:</text>
            <text x="80" y="73" fill="#22c55e" fontSize="9" fontWeight="bold">
              ASME VIII Div.1/2 (U2)
            </text>

            <text x="210" y="73" fill="#94a3b8" fontSize="9">TOTAL WEIGHT:</text>
            <text x="295" y="73" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">
              {vesselParams.totalWeightTon.toLocaleString()} TON
            </text>
          </g>

          {/* ============================================================ */}
          {/* INTERACTIVE RULER MEASUREMENT OVERLAY                        */}
          {/* ============================================================ */}
          {rulerPoints.map((pt, idx) => (
            <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
              <circle r="7" fill="#06b6d4" fillOpacity="0.3" stroke="#06b6d4" strokeWidth="2" />
              <circle r="2" fill="#22d3ee" />
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#06b6d4" strokeWidth="1.5" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke="#06b6d4" strokeWidth="1.5" />
              <rect x="10" y="-18" width="16" height="14" rx="2" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
              <text x="18" y="-8" fill="#67e8f9" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                {idx === 0 ? 'A' : 'B'}
              </text>
            </g>
          ))}

          {rulerPoints.length === 2 && (
            <g id="ruler-measurement-line">
              <line
                x1={rulerPoints[0].x}
                y1={rulerPoints[0].y}
                x2={rulerPoints[1].x}
                y2={rulerPoints[1].y}
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="5,3"
                filter="url(#glow-cyan)"
              />
              {/* Floating Caliper Dimension Badge in center */}
              <g transform={`translate(${(rulerPoints[0].x + rulerPoints[1].x) / 2}, ${(rulerPoints[0].y + rulerPoints[1].y) / 2})`}>
                <rect
                  x="-75"
                  y="-14"
                  width="150"
                  height="26"
                  rx="6"
                  fill="#083344"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  filter="url(#glow-cyan)"
                />
                <text
                  x="0"
                  y="3"
                  fill="#a5f3fc"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {measuredMm.toLocaleString()} mm ({measuredM}m)
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-700/50 bg-slate-950/60 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span>제작처: W Company 데모 제작공장</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">
            둘레 용접: C-Seam {canCount + 2}개소 (32-Pass 탠덤 SAW)
          </span>
          <span>•</span>
          <span className="text-emerald-400">품질: 100% RT / TOFD PAUT 전수 검사</span>
        </div>

        <div>
          <span>DWG NO: DEMO-ENG-EOEG-DEMO-V001-REV.0</span>
        </div>
      </div>
    </div>
  );
};
