import React, { useState } from 'react';
import { BlueprintModel, FlangeParams, SelectedComponentInfo } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Download, FileText, RefreshCw, Eye, EyeOff, Layers, Dices, ShieldCheck } from 'lucide-react';
import { exportParamsToDXF, exportSvgElement } from '../utils/dxfExporter';
import { VesselBlueprint2D } from './VesselBlueprint2D';

interface Blueprint2DProps {
  blueprint: BlueprintModel;
  onUpdateParams: (newParams: Partial<FlangeParams>) => void;
  onOpenImport: () => void;
  onOpenSpec: () => void;
  onOpenPresetSelector: () => void;
  onGenerateArbitrary?: () => void;
  onOpenVerification?: () => void;
  onOpenAuditModal?: () => void;
  onOpenPlateMarking?: () => void;
  selectedComponent?: SelectedComponentInfo | null;
  onSelectComponent?: (comp: SelectedComponentInfo | null) => void;
}

export const Blueprint2D: React.FC<Blueprint2DProps> = ({
  blueprint,
  onUpdateParams,
  onOpenImport,
  onOpenSpec,
  onOpenPresetSelector,
  onGenerateArbitrary,
  onOpenVerification,
  onOpenAuditModal,
  onOpenPlateMarking,
  selectedComponent,
  onSelectComponent,
}) => {
  // If this blueprint is a heavy plant equipment (WC mega-vessel), render VesselBlueprint2D
  if (blueprint.vesselParams) {
    return (
      <VesselBlueprint2D
        blueprint={blueprint}
        vesselParams={blueprint.vesselParams}
        onOpenAuditModal={onOpenAuditModal}
        onOpenSpec={onOpenSpec}
        onOpenPresetSelector={onOpenPresetSelector}
        onOpenPlateMarking={onOpenPlateMarking}
        selectedComponent={selectedComponent}
        onSelectComponent={onSelectComponent}
      />
    );
  }

  const [showDims, setShowDims] = useState(true);
  const [showSection, setShowSection] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [cadTheme, setCadTheme] = useState<'blueprint' | 'white' | 'cyan'>('blueprint');
  const [zoom, setZoom] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { params } = blueprint;
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

  // Visual scaling factors to fit SVG cleanly
  // Let the canvas width be 880, height 460
  // Left: Top view centered at (220, 230)
  // Right: Section A-A view centered at (620, 230)
  const maxDim = Math.max(od, hTotal * 1.6);
  const scale = (170 / maxDim) * zoom;

  const topCx = 230;
  const topCy = 230;

  const secCx = 650;
  const secBaseY = 320; // Bottom of flange

  // Bolt hole coordinates
  const boltHoles = Array.from({ length: boltHoleCount }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / boltHoleCount - Math.PI / 2;
    const r = (pcd / 2) * scale;
    return {
      x: topCx + r * Math.cos(angle),
      y: topCy + r * Math.sin(angle),
      angle,
    };
  });

  // Section view geometry
  // Widths in scale
  const rFlangeSec = (od / 2) * scale;
  const rBossSec = (bossOd / 2) * scale;
  const rBoreSec = (id / 2) * scale;
  const rPcdSec = (pcd / 2) * scale;
  const rBhdSec = (bhd / 2) * scale;

  const hFlangeSec = tFlange * scale;
  const hTotalSec = hTotal * scale;
  const secTopY = secBaseY - hTotalSec;
  const secStepY = secBaseY - hFlangeSec;

  // Styling by theme
  const themeColors = {
    blueprint: {
      bg: '#111827', // dark slate
      grid: '#1f2937',
      primaryLine: '#38bdf8', // bright cyan
      secondaryLine: '#818cf8', // indigo
      axisLine: '#f43f5e', // red center
      dimLine: '#f59e0b', // amber / orange dimensions
      hatch: '#38bdf8',
      text: '#e2e8f0',
      labelBg: 'rgba(15, 23, 42, 0.85)',
    },
    white: {
      bg: '#f8fafc',
      grid: '#e2e8f0',
      primaryLine: '#0f172a',
      secondaryLine: '#334155',
      axisLine: '#dc2626',
      dimLine: '#d97706',
      hatch: '#475569',
      text: '#1e293b',
      labelBg: 'rgba(255, 255, 255, 0.9)',
    },
    cyan: {
      bg: '#041d24',
      grid: '#083344',
      primaryLine: '#22d3ee',
      secondaryLine: '#67e8f9',
      axisLine: '#fb7185',
      dimLine: '#34d399',
      hatch: '#0e7490',
      text: '#ecfeff',
      labelBg: 'rgba(4, 29, 36, 0.85)',
    },
  }[cadTheme];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-100">
      {/* Blueprint Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-cyan-300">
            2D 입력 도면 및 P&amp;ID <span className="text-xs text-slate-400 font-mono">(BLUEPRINT SOURCE)</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
            {blueprint.standard}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            id="btn-open-spec"
            onClick={onOpenSpec}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 transition-colors cursor-pointer"
            title="제안서 사양서 확인"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>제안서 사양</span>
          </button>

          {onGenerateArbitrary && (
            <button
              id="btn-generate-arbitrary-blueprint"
              onClick={onGenerateArbitrary}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
              title="임의의 2D 도면을 자동 생성하고 3D 모델로 실시간 변환"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>임의 도면 생성</span>
            </button>
          )}

          {onOpenVerification && (
            <button
              id="btn-verify-conversion"
              onClick={onOpenVerification}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors cursor-pointer"
              title="2D ➔ 3D 변환 정합성 검증 리포트"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>3D 변환 검증</span>
            </button>
          )}

          <button
            id="btn-change-blueprint"
            onClick={onOpenPresetSelector}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="도면 라이브러리에서 변경"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>도면 변경</span>
          </button>

          <div className="relative">
            <button
              id="btn-export-2d"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-600/60 text-cyan-200 transition-colors cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>2D 도면 다운로드</span>
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    exportParamsToDXF(params, `${blueprint.id}_2D.dxf`);
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span>AutoCAD DXF (.dxf)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">CAD</span>
                </button>
                <button
                  onClick={() => {
                    exportSvgElement('cad-blueprint-svg', `${blueprint.id}_vector.svg`);
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span>Vector SVG (.svg)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">SVG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blueprint Sub-Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          {/* Dimension Toggle */}
          <button
            id="toggle-dims"
            onClick={() => setShowDims(!showDims)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
              showDims
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showDims ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>치수선 (Dims)</span>
          </button>

          {/* Section Toggle */}
          <button
            id="toggle-section"
            onClick={() => setShowSection(!showSection)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
              showSection
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>A-A 단면도 (Section)</span>
          </button>

          {/* Axes Toggle */}
          <button
            id="toggle-axes"
            onClick={() => setShowAxes(!showAxes)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
              showAxes
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span>중심선 (Axes)</span>
          </button>
        </div>

        {/* Color Theme Selector & Zoom */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            <button
              onClick={() => setCadTheme('blueprint')}
              className={`w-4 h-4 rounded-full bg-slate-900 border transition-all ${
                cadTheme === 'blueprint' ? 'ring-2 ring-cyan-400 border-transparent scale-110' : 'border-slate-600'
              }`}
              title="다크 블루프린트"
            />
            <button
              onClick={() => setCadTheme('white')}
              className={`w-4 h-4 rounded-full bg-slate-100 border transition-all ${
                cadTheme === 'white' ? 'ring-2 ring-cyan-500 border-transparent scale-110' : 'border-slate-400'
              }`}
              title="화이트 CAD 도면"
            />
            <button
              onClick={() => setCadTheme('cyan')}
              className={`w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500 transition-all ${
                cadTheme === 'cyan' ? 'ring-2 ring-cyan-400 border-transparent scale-110' : 'border-cyan-800'
              }`}
              title="클래식 사이언 도면"
            />
          </div>

          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 overflow-hidden">
            <button
              id="zoom-out-btn"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 hover:bg-slate-700 text-slate-300 transition-colors"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              id="zoom-in-btn"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
              className="p-1 hover:bg-slate-700 text-slate-300 transition-colors"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="zoom-reset-btn"
              onClick={() => setZoom(1)}
              className="p-1 border-l border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
              title="원래 배율"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Blueprint Canvas */}
      <div className="relative flex-1 min-h-[360px] overflow-auto flex items-center justify-center p-2 select-none" style={{ backgroundColor: themeColors.bg }}>
        <svg
          id="cad-blueprint-svg"
          viewBox="0 0 900 460"
          className="w-full h-full max-h-[500px]"
          style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
        >
          <defs>
            {/* CAD Diagonal Hatch Pattern */}
            <pattern id="cad-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke={themeColors.hatch} strokeWidth="1" strokeOpacity="0.6" />
            </pattern>
            {/* Arrow Markers for Dimension Lines */}
            <marker id="arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 10 0 L 0 5 L 10 10 z" fill={themeColors.dimLine} />
            </marker>
            <marker id="arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={themeColors.dimLine} />
            </marker>
            {/* Section Arrow Markers */}
            <marker id="sec-arrow" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M 2 2 L 10 6 L 2 10 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Background CAD Grid */}
          <g stroke={themeColors.grid} strokeWidth="0.5" strokeDasharray="3 3">
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="460" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 50} x2="900" y2={i * 50} />
            ))}
          </g>

          {/* ==================== LEFT: TOP VIEW (PLAN VIEW) ==================== */}
          <g id="top-view">
            <text x={topCx} y="35" textAnchor="middle" fill={themeColors.text} fontSize="13" fontWeight="bold" letterSpacing="1">
              TOP VIEW (평면도)
            </text>

            {/* Center Axes */}
            {showAxes && (
              <g stroke={themeColors.axisLine} strokeWidth="1" strokeDasharray="12 3 3 3" opacity="0.85">
                {/* Horizontal Center Axis */}
                <line x1={topCx - (od / 2) * scale - 25} y1={topCy} x2={topCx + (od / 2) * scale + 25} y2={topCy} />
                {/* Vertical Center Axis */}
                <line x1={topCx} y1={topCy - (od / 2) * scale - 25} x2={topCx} y2={topCy + (od / 2) * scale + 25} />
                {/* Pitch Circle Diameter (PCD) circle - Dash Dot */}
                <circle
                  cx={topCx}
                  cy={topCy}
                  r={(pcd / 2) * scale}
                  fill="none"
                  stroke={themeColors.axisLine}
                  strokeWidth="1.2"
                  strokeDasharray="8 4 2 4"
                />
              </g>
            )}

            {/* Outer Diameter (OD) Circle */}
            <circle
              cx={topCx}
              cy={topCy}
              r={(od / 2) * scale}
              fill="none"
              stroke={themeColors.primaryLine}
              strokeWidth="2.5"
            />

            {/* Raised Face Circle */}
            <circle
              cx={topCx}
              cy={topCy}
              r={(params.raisedFaceDiameter / 2) * scale}
              fill="none"
              stroke={themeColors.secondaryLine}
              strokeWidth="1.2"
              strokeDasharray="4 2"
              opacity="0.6"
            />

            {/* Boss Circle */}
            <circle
              cx={topCx}
              cy={topCy}
              r={(bossOd / 2) * scale}
              fill="none"
              stroke={themeColors.primaryLine}
              strokeWidth="1.8"
            />

            {/* Inner Diameter (Bore ID) Circle */}
            <circle
              cx={topCx}
              cy={topCy}
              r={(id / 2) * scale}
              fill="none"
              stroke={themeColors.primaryLine}
              strokeWidth="2"
            />

            {/* Bolt Holes on PCD */}
            {boltHoles.map((hole, idx) => (
              <g key={`hole-${idx}`}>
                <circle
                  cx={hole.x}
                  cy={hole.y}
                  r={(bhd / 2) * scale}
                  fill={cadTheme === 'blueprint' ? '#0f172a' : '#e2e8f0'}
                  stroke={themeColors.primaryLine}
                  strokeWidth="1.5"
                />
                {showAxes && (
                  <g stroke={themeColors.axisLine} strokeWidth="0.8" opacity="0.7">
                    <line x1={hole.x - 5} y1={hole.y} x2={hole.x + 5} y2={hole.y} />
                    <line x1={hole.x} y1={hole.y - 5} x2={hole.x} y2={hole.y + 5} />
                  </g>
                )}
              </g>
            ))}

            {/* SECTION A-A Cut Line on Top View */}
            {showSection && (
              <g id="section-cutting-line">
                <line
                  x1={topCx - (od / 2) * scale - 20}
                  y1={topCy}
                  x2={topCx + (od / 2) * scale + 20}
                  y2={topCy}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="16 5 4 5"
                />
                {/* Left Section indicator A */}
                <path
                  d={`M ${topCx - (od / 2) * scale - 20} ${topCy} L ${topCx - (od / 2) * scale - 20} ${topCy - 20}`}
                  stroke="#38bdf8"
                  strokeWidth="3"
                  markerEnd="url(#sec-arrow)"
                />
                <text
                  x={topCx - (od / 2) * scale - 32}
                  y={topCy - 24}
                  fill="#38bdf8"
                  fontSize="13"
                  fontWeight="bold"
                >
                  A
                </text>
                {/* Right Section indicator A */}
                <path
                  d={`M ${topCx + (od / 2) * scale + 20} ${topCy} L ${topCx + (od / 2) * scale + 20} ${topCy - 20}`}
                  stroke="#38bdf8"
                  strokeWidth="3"
                  markerEnd="url(#sec-arrow)"
                />
                <text
                  x={topCx + (od / 2) * scale + 26}
                  y={topCy - 24}
                  fill="#38bdf8"
                  fontSize="13"
                  fontWeight="bold"
                >
                  A
                </text>
              </g>
            )}

            {/* Top View Dimension Annotations */}
            {showDims && (
              <g id="top-view-dims">
                {/* OD Dimension (Top Horizontal) */}
                <g>
                  <line
                    x1={topCx - (od / 2) * scale}
                    y1={topCy - (od / 2) * scale - 12}
                    x2={topCx + (od / 2) * scale}
                    y2={topCy - (od / 2) * scale - 12}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                    markerStart="url(#arrow-start)"
                    markerEnd="url(#arrow-end)"
                  />
                  {/* Extension lines */}
                  <line
                    x1={topCx - (od / 2) * scale}
                    y1={topCy - (od / 2) * scale}
                    x2={topCx - (od / 2) * scale}
                    y2={topCy - (od / 2) * scale - 16}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={topCx + (od / 2) * scale}
                    y1={topCy - (od / 2) * scale}
                    x2={topCx + (od / 2) * scale}
                    y2={topCy - (od / 2) * scale - 16}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x={topCx - 40}
                    y={topCy - (od / 2) * scale - 24}
                    width="80"
                    height="16"
                    fill={themeColors.labelBg}
                    rx="2"
                  />
                  <text
                    x={topCx}
                    y={topCy - (od / 2) * scale - 12}
                    textAnchor="middle"
                    fill={themeColors.dimLine}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    Ø{od} (OD)
                  </text>
                </g>

                {/* PCD Annotation Leader Line */}
                <g>
                  {/* Pointing to first hole */}
                  <line
                    x1={boltHoles[1]?.x || topCx + (pcd / 2) * scale * 0.7}
                    y1={boltHoles[1]?.y || topCy - (pcd / 2) * scale * 0.7}
                    x2={topCx + (od / 2) * scale + 15}
                    y2={topCy - (od / 2) * scale + 25}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                  />
                  <line
                    x1={topCx + (od / 2) * scale + 15}
                    y1={topCy - (od / 2) * scale + 25}
                    x2={topCx + (od / 2) * scale + 85}
                    y2={topCy - (od / 2) * scale + 25}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                  />
                  <text
                    x={topCx + (od / 2) * scale + 18}
                    y={topCy - (od / 2) * scale + 20}
                    fill={themeColors.dimLine}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    PCD Ø{pcd} ({boltHoleCount}x Ø{bhd})
                  </text>
                </g>

                {/* Bore Diameter Leader Line */}
                <g>
                  <line
                    x1={topCx - (id / 2) * scale * 0.7}
                    y1={topCy + (id / 2) * scale * 0.7}
                    x2={topCx - (od / 2) * scale - 25}
                    y2={topCy + (od / 2) * scale + 15}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                  />
                  <line
                    x1={topCx - (od / 2) * scale - 25}
                    y1={topCy + (od / 2) * scale + 15}
                    x2={topCx - (od / 2) * scale - 80}
                    y2={topCy + (od / 2) * scale + 15}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                  />
                  <text
                    x={topCx - (od / 2) * scale - 78}
                    y={topCy + (od / 2) * scale + 11}
                    fill={themeColors.dimLine}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    내경 Ø{id} (Bore)
                  </text>
                </g>
              </g>
            )}
          </g>

          {/* ==================== RIGHT: SECTION A-A (단면도) ==================== */}
          <g id="section-view">
            <text x={secCx} y="35" textAnchor="middle" fill={themeColors.text} fontSize="13" fontWeight="bold" letterSpacing="1">
              SECTION A-A (단면도)
            </text>

            {/* Symmetry Centerline */}
            {showAxes && (
              <g stroke={themeColors.axisLine} strokeWidth="1" strokeDasharray="14 3 3 3">
                <line x1={secCx} y1={secTopY - 25} x2={secCx} y2={secBaseY + 25} />
                {/* Bolt Hole Centerlines in section */}
                <line
                  x1={secCx - rPcdSec}
                  y1={secStepY - 10}
                  x2={secCx - rPcdSec}
                  y2={secBaseY + 10}
                  strokeWidth="0.8"
                  strokeDasharray="6 2"
                />
                <line
                  x1={secCx + rPcdSec}
                  y1={secStepY - 10}
                  x2={secCx + rPcdSec}
                  y2={secBaseY + 10}
                  strokeWidth="0.8"
                  strokeDasharray="6 2"
                />
              </g>
            )}

            {/* Cross Section Profiles with Hatch Fill */}
            {/* Left Solid Wall: from -rFlangeSec to -rBoreSec, with bolt hole void at -rPcdSec */}
            {/* Outer Flange polygon Left */}
            <polygon
              points={`
                ${secCx - rFlangeSec},${secBaseY}
                ${secCx - rBoreSec},${secBaseY}
                ${secCx - rBoreSec},${secTopY}
                ${secCx - rBossSec},${secTopY}
                ${secCx - rBossSec},${secStepY}
                ${secCx - rFlangeSec},${secStepY}
              `}
              fill="url(#cad-hatch)"
              stroke={themeColors.primaryLine}
              strokeWidth="2"
            />

            {/* Right Solid Wall: from +rBoreSec to +rFlangeSec */}
            <polygon
              points={`
                ${secCx + rFlangeSec},${secBaseY}
                ${secCx + rBoreSec},${secBaseY}
                ${secCx + rBoreSec},${secTopY}
                ${secCx + rBossSec},${secTopY}
                ${secCx + rBossSec},${secStepY}
                ${secCx + rFlangeSec},${secStepY}
              `}
              fill="url(#cad-hatch)"
              stroke={themeColors.primaryLine}
              strokeWidth="2"
            />

            {/* Bolt Hole Through Voids in Section A-A */}
            {/* Left bolt hole cut */}
            <rect
              x={secCx - rPcdSec - rBhdSec}
              y={secStepY}
              width={rBhdSec * 2}
              height={hFlangeSec}
              fill={themeColors.bg}
              stroke={themeColors.primaryLine}
              strokeWidth="1.6"
            />
            {/* Right bolt hole cut */}
            <rect
              x={secCx + rPcdSec - rBhdSec}
              y={secStepY}
              width={rBhdSec * 2}
              height={hFlangeSec}
              fill={themeColors.bg}
              stroke={themeColors.primaryLine}
              strokeWidth="1.6"
            />

            {/* Through Bore Center Void */}
            <rect
              x={secCx - rBoreSec}
              y={secTopY}
              width={rBoreSec * 2}
              height={hTotalSec}
              fill="none"
              stroke={themeColors.primaryLine}
              strokeWidth="1.8"
              strokeDasharray="none"
            />

            {/* SECTION A-A Dimension Annotations */}
            {showDims && (
              <g id="section-dims">
                {/* Total Height 74mm (Right side dimension) */}
                <g>
                  <line
                    x1={secCx + rFlangeSec + 25}
                    y1={secTopY}
                    x2={secCx + rFlangeSec + 25}
                    y2={secBaseY}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                    markerStart="url(#arrow-start)"
                    markerEnd="url(#arrow-end)"
                  />
                  {/* Extension lines */}
                  <line
                    x1={secCx + rBossSec}
                    y1={secTopY}
                    x2={secCx + rFlangeSec + 32}
                    y2={secTopY}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={secCx + rFlangeSec}
                    y1={secBaseY}
                    x2={secCx + rFlangeSec + 32}
                    y2={secBaseY}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x={secCx + rFlangeSec + 30}
                    y={(secTopY + secBaseY) / 2 - 10}
                    width="75"
                    height="18"
                    fill={themeColors.labelBg}
                    rx="2"
                  />
                  <text
                    x={secCx + rFlangeSec + 32}
                    y={(secTopY + secBaseY) / 2 + 3}
                    fill={themeColors.dimLine}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {hTotal}mm (전체)
                  </text>
                </g>

                {/* Flange Thickness Dimension */}
                <g>
                  <line
                    x1={secCx - rFlangeSec - 20}
                    y1={secStepY}
                    x2={secCx - rFlangeSec - 20}
                    y2={secBaseY}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                    markerStart="url(#arrow-start)"
                    markerEnd="url(#arrow-end)"
                  />
                  {/* Extension lines */}
                  <line
                    x1={secCx - rFlangeSec}
                    y1={secStepY}
                    x2={secCx - rFlangeSec - 25}
                    y2={secStepY}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={secCx - rFlangeSec}
                    y1={secBaseY}
                    x2={secCx - rFlangeSec - 25}
                    y2={secBaseY}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x={secCx - rFlangeSec - 65}
                    y={(secStepY + secBaseY) / 2 - 9}
                    width="42"
                    height="16"
                    fill={themeColors.labelBg}
                    rx="2"
                  />
                  <text
                    x={secCx - rFlangeSec - 44}
                    y={(secStepY + secBaseY) / 2 + 3}
                    textAnchor="middle"
                    fill={themeColors.dimLine}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {tFlange}mm
                  </text>
                </g>

                {/* Boss Diameter (Top horizontal) */}
                <g>
                  <line
                    x1={secCx - rBossSec}
                    y1={secTopY - 14}
                    x2={secCx + rBossSec}
                    y2={secTopY - 14}
                    stroke={themeColors.dimLine}
                    strokeWidth="1.2"
                    markerStart="url(#arrow-start)"
                    markerEnd="url(#arrow-end)"
                  />
                  <line
                    x1={secCx - rBossSec}
                    y1={secTopY}
                    x2={secCx - rBossSec}
                    y2={secTopY - 18}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={secCx + rBossSec}
                    y1={secTopY}
                    x2={secCx + rBossSec}
                    y2={secTopY - 18}
                    stroke={themeColors.dimLine}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x={secCx - 36}
                    y={secTopY - 25}
                    width="72"
                    height="16"
                    fill={themeColors.labelBg}
                    rx="2"
                  />
                  <text
                    x={secCx}
                    y={secTopY - 13}
                    textAnchor="middle"
                    fill={themeColors.dimLine}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    보스 Ø{bossOd}
                  </text>
                </g>
              </g>
            )}
          </g>

          {/* Title / Watermark Bar */}
          <g transform="translate(20, 435)">
            <text fill="#64748b" fontSize="10">
              SCALE 1:1 METRIC | PROJECTION: THIRD ANGLE (제3각법) | MATERIAL: {blueprint.material.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>

      {/* Quick Parameter Sliders Footer */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">외경 OD:</span>
            <input
              type="number"
              value={od}
              onChange={(e) => onUpdateParams({ outerDiameter: Math.max(80, Number(e.target.value)) })}
              className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-center focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">mm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">PCD:</span>
            <input
              type="number"
              value={pcd}
              onChange={(e) => onUpdateParams({ pitchCircleDiameter: Math.max(60, Number(e.target.value)) })}
              className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-center focus:outline-none focus:border-amber-500"
            />
            <span className="text-slate-500">mm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">볼트 홀:</span>
            <select
              value={boltHoleCount}
              onChange={(e) => onUpdateParams({ boltHoleCount: Number(e.target.value) })}
              className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none"
            >
              {[4, 6, 8, 12, 16, 20, 24].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">전체 높이:</span>
            <input
              type="number"
              value={hTotal}
              onChange={(e) => onUpdateParams({ totalHeight: Math.max(30, Number(e.target.value)) })}
              className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-center focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">mm</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>치수 변경 시 3D 파라메트릭 솔리드 즉시 실시간 동기화</span>
        </div>
      </div>
    </div>
  );
};
