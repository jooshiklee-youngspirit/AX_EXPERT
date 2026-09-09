import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { PlateSegmentData, NcProgramResult } from '../types';
import { PLATE_SEGMENT_PRESETS } from '../data/plateMarkingData';
import { generateIsoGCode, generateEssiCode, generateNestingDxf, downloadNcFile } from '../utils/ncProgramGenerator';
import {
  X,
  Layers,
  Cpu,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RotateCw,
  Eye,
  Camera,
  Compass,
  FileCode,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Maximize2,
  Minimize2,
  Crosshair,
  Printer,
  Sparkles,
} from 'lucide-react';

interface PlateMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlateMarkingModal: React.FC<PlateMarkingModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlate, setSelectedPlate] = useState<PlateSegmentData>(PLATE_SEGMENT_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'marking' | 'nc_code' | 'qr_qc' | '3d_context' | 'sop'>('marking');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Layer Visibility for Tab 1
  const [showWeldingBevel, setShowWeldingBevel] = useState(true);
  const [showMatingGuides, setShowMatingGuides] = useState(true);
  const [showRollingArrow, setShowRollingArrow] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showPokaYoke, setShowPokaYoke] = useState(true);

  // NC Code Tab state
  const [ncFormat, setNcFormat] = useState<'ISO_GCODE' | 'ESSI_CODE'>('ISO_GCODE');
  const [ncProgram, setNcProgram] = useState<NcProgramResult | null>(null);
  const [copiedNc, setCopiedNc] = useState(false);

  // QR Code Image Data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // QC / Inspection Interactive Inputs
  const [measLength, setMeasLength] = useState<number>(selectedPlate.inspectionTolerances.unfoldedLengthNominalMm);
  const [measWidth, setMeasWidth] = useState<number>(selectedPlate.inspectionTolerances.widthNominalMm);
  const [measThick, setMeasThick] = useState<number>(selectedPlate.inspectionTolerances.thicknessNominalMm);
  const [measDiagonal, setMeasDiagonal] = useState<number>(selectedPlate.inspectionTolerances.diagonalNominalMm);
  const [measOor, setMeasOor] = useState<number>(2.2);
  const [isQrScanned, setIsQrScanned] = useState(false);
  const [inspectorName, setInspectorName] = useState('김검사 책임연구원 (ASME Level III)');

  // Regenerate NC code & QR when selected plate or format changes
  useEffect(() => {
    if (ncFormat === 'ISO_GCODE') {
      setNcProgram(generateIsoGCode(selectedPlate));
    } else {
      setNcProgram(generateEssiCode(selectedPlate));
    }

    // Reset QC measurements to nominal
    setMeasLength(selectedPlate.inspectionTolerances.unfoldedLengthNominalMm);
    setMeasWidth(selectedPlate.inspectionTolerances.widthNominalMm);
    setMeasThick(selectedPlate.inspectionTolerances.thicknessNominalMm);
    setMeasDiagonal(selectedPlate.inspectionTolerances.diagonalNominalMm);
    setMeasOor(2.4);

    // Generate real QR code image
    const qrPayload = JSON.stringify({
      id: selectedPlate.qrCodeData.qrId,
      serial: selectedPlate.qrCodeData.serialNo,
      dwg: selectedPlate.qrCodeData.drawingNo,
      mat: selectedPlate.material,
      heat: selectedPlate.heatNumber,
      thick: selectedPlate.thicknessMm,
      el: selectedPlate.qrCodeData.targetElevationM,
      url: selectedPlate.qrCodeData.verificationUrl,
    });

    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [selectedPlate, ncFormat]);

  if (!isOpen) return null;

  // Copy NC Code
  const handleCopyNc = () => {
    if (ncProgram) {
      navigator.clipboard.writeText(ncProgram.codeText);
      setCopiedNc(true);
      setTimeout(() => setCopiedNc(false), 2500);
    }
  };

  // Download NC File (.nc or .esi)
  const handleDownloadNc = () => {
    if (ncProgram) {
      downloadNcFile(ncProgram.programName, ncProgram.codeText);
    }
  };

  // Download DXF for Nesting
  const handleDownloadDxf = () => {
    const dxfContent = generateNestingDxf(selectedPlate);
    downloadNcFile(`${selectedPlate.partNumber}_NESTING.dxf`, dxfContent);
  };

  // QC Calculations
  const tol = selectedPlate.inspectionTolerances;
  const diffLength = Math.round((measLength - tol.unfoldedLengthNominalMm) * 10) / 10;
  const isLengthOk = Math.abs(diffLength) <= tol.unfoldedLengthToleranceMm;

  const diffWidth = Math.round((measWidth - tol.widthNominalMm) * 10) / 10;
  const isWidthOk = Math.abs(diffWidth) <= tol.widthToleranceMm;

  const diffThick = Math.round((measThick - tol.thicknessNominalMm) * 100) / 100;
  const isThickOk = diffThick >= tol.thicknessToleranceMinMm && diffThick <= tol.thicknessToleranceMaxMm;

  const diffDiag = Math.round((measDiagonal - tol.diagonalNominalMm) * 10) / 10;
  const isDiagOk = Math.abs(diffDiag) <= tol.diagonalToleranceMm;

  const isOorOk = measOor <= tol.rollingOorMaxMm;
  const isAllQcPassed = isLengthOk && isWidthOk && isThickOk && isDiagOk && isOorOk;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`relative w-full bg-slate-950 border border-cyan-800/80 shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-200 ${
          isFullscreen
            ? 'w-screen h-screen rounded-none border-none'
            : 'max-w-[1600px] h-[96vh] rounded-2xl'
        }`}
      >
        {/* ============================================================ */}
        {/* MODAL HEADER                                                 */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  WC 대형 플랜트 부재 전개 &amp; 스마트 마킹 / NC 절단기 전송 시스템
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold font-mono">
                  NC CAM &amp; QR QC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                101.1m 워시타워 캔 분할 • 용접 개선선 &amp; 조립방향 &amp; 밴딩 마킹 • NC 절단기(G-Code/ESSI) 전송 • QR 스캔 승인도면 정합성 검증
              </p>
            </div>
          </div>

          {/* Quick Preset Selector & Window Control Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-slate-400 shrink-0 font-medium">분할 부재 선택:</span>
              <select
                value={selectedPlate.id}
                onChange={(e) => {
                  const found = PLATE_SEGMENT_PRESETS.find((p) => p.id === e.target.value);
                  if (found) setSelectedPlate(found);
                }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {PLATE_SEGMENT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.partNumber}] {p.thicknessMm}mmt - {p.componentType === 'shell_can' ? `CAN #${p.canNumber}` : p.componentType}
                  </option>
                ))}
              </select>
            </div>

            {/* Maximize / Restore Window Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? '창 축소 (일반 모달 뷰)' : '별도 전체화면 창으로 전환'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-cyan-400" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NAVIGATION TABS                                              */}
        {/* ============================================================ */}
        <div className="flex items-center gap-1 px-5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('marking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'marking'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. 부재 마킹 &amp; 전개도 (CAD Viewer)</span>
          </button>

          <button
            onClick={() => setActiveTab('nc_code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'nc_code'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2. NC 철판 절단기 G-Code 전송</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              CAM Ready
            </span>
          </button>

          <button
            onClick={() => setActiveTab('qr_qc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'qr_qc'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>3. QR 스캔 &amp; 승인도면 실물 검증</span>
            {isAllQcPassed && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                PASS
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('3d_context')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === '3d_context'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>4. 3D 타워 내 부재 위치 동기화</span>
          </button>

          <button
            onClick={() => setActiveTab('sop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sop'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>5. 현장 마킹 표준 작업 지침서 (SOP)</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB CONTENTS                                                 */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ======================================================== */}
          {/* TAB 1: SMART MARKING CAD VIEWER (UNFOLDED PLATE)        */}
          {/* ======================================================== */}
          {activeTab === 'marking' && (
            <div className="flex flex-col gap-4">
              {/* Controls Toolbar for Marking Layers */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    마킹 레이어 표시:
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showWeldingBevel}
                      onChange={(e) => setShowWeldingBevel(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-amber-400 font-mono">C/L-Seam 용접선</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showMatingGuides}
                      onChange={(e) => setShowMatingGuides(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-emerald-400 font-mono">인접 부재 맞춤방향(▲▼◀▶)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showRollingArrow}
                      onChange={(e) => setShowRollingArrow(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-blue-400 font-mono">롤링 벤딩 방향(➔ R=5.4m)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showAttachments}
                      onChange={(e) => setShowAttachments(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-purple-400 font-mono">트레이/러그 안착선</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showPokaYoke}
                      onChange={(e) => setShowPokaYoke(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-red-400 font-mono">오조립 방지 노치</span>
                  </label>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('nc_code')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow transition-all cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>NC G-Code 생성</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('qr_qc')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow transition-all cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>실물 QR 검증</span>
                  </button>
                </div>
              </div>

              {/* Main 2D SVG Plate Unfolded Interactive Blueprint */}
              <div className="relative w-full bg-[#050b14] border border-cyan-900/70 rounded-xl p-4 shadow-2xl overflow-hidden flex flex-col items-center">
                {/* SVG Blueprint Canvas */}
                <svg
                  viewBox="0 0 1200 480"
                  className="w-full h-auto max-h-[520px] select-none"
                  style={{ filter: 'drop-shadow(0 4px 20px rgba(6, 182, 212, 0.15))' }}
                >
                  <defs>
                    <pattern id="plate-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e2439" strokeWidth="0.5" />
                    </pattern>
                    <linearGradient id="steel-plate-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0f2238" />
                      <stop offset="50%" stopColor="#132c48" />
                      <stop offset="100%" stopColor="#0a192b" />
                    </linearGradient>
                    <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Blueprint Background Grid */}
                  <rect width="1200" height="480" fill="#030811" />
                  <rect width="1200" height="480" fill="url(#plate-grid)" opacity="0.65" />

                  {/* Coordinate scale frame */}
                  <rect x="70" y="40" width="1060" height="360" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="4,4" />

                  {/* UNROLLED FLAT STEEL PLATE (Mapped: X=90 to 1110, Y=60 to 380) */}
                  {/* Plate Rect: X=90, Y=60, W=1020, H=320 */}
                  <g id="main-plate-body">
                    <rect
                      x="90"
                      y="60"
                      width="1020"
                      height="320"
                      rx="3"
                      fill="url(#steel-plate-grad)"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />

                    {/* Poka-Yoke Corner Cutout (Top-Left 20x20mm Notch) */}
                    {showPokaYoke && selectedPlate.pokaYokeFeatures.cornerNotchPosition === 'TOP_LEFT' && (
                      <g id="poka-yoke-notch">
                        <polygon
                          points="90,60 115,60 115,85 90,85"
                          fill="#030811"
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                        <line x1="90" y1="85" x2="115" y2="60" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                        <text x="122" y="78" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          POKA-YOKE NOTCH (20x20mm)
                        </text>
                      </g>
                    )}
                  </g>

                  {/* 1. WELDING LINES & BEVEL ZONES */}
                  {showWeldingBevel && (
                    <g id="welding-bevel-markings">
                      {/* Top C-Seam Weld Line */}
                      <line x1="100" y1="75" x2="1100" y2="75" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" />
                      <text x="600" y="72" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        C-SEAM WELD BEVEL LINE (DOUBLE-V 60° - ASME SEC.VIII DIV.1)
                      </text>

                      {/* Bottom C-Seam Weld Line */}
                      <line x1="100" y1="365" x2="1100" y2="365" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" />
                      <text x="600" y="378" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        C-SEAM WELD BEVEL LINE (ROOT FACE 3mm / GAP 2.5mm)
                      </text>

                      {/* Left & Right L-Seam Lines */}
                      <line x1="105" y1="75" x2="105" y2="365" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" />
                      <line x1="1095" y1="75" x2="1095" y2="365" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" />
                    </g>
                  )}

                  {/* 2. MATING GUIDES & ALIGNMENT MARKINGS (▲, ▼, ◀, ▶) */}
                  {showMatingGuides && (
                    <g id="mating-fitup-guides">
                      {/* TOP MATING GUIDE */}
                      <rect x="360" y="43" width="480" height="16" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                      <text x="600" y="55" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {selectedPlate.matingTopPart}
                      </text>

                      {/* BOTTOM MATING GUIDE */}
                      <rect x="360" y="382" width="480" height="16" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                      <text x="600" y="394" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {selectedPlate.matingBottomPart}
                      </text>

                      {/* LEFT MATING GUIDE */}
                      <g transform="translate(73, 220) rotate(-90)">
                        <rect x="-110" y="-8" width="220" height="16" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                        <text x="0" y="4" fill="#a7f3d0" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {selectedPlate.matingLeftPart}
                        </text>
                      </g>

                      {/* RIGHT MATING GUIDE */}
                      <g transform="translate(1125, 220) rotate(90)">
                        <rect x="-110" y="-8" width="220" height="16" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                        <text x="0" y="4" fill="#a7f3d0" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {selectedPlate.matingRightPart}
                        </text>
                      </g>
                    </g>
                  )}

                  {/* 3. ROLLING / BENDING DIRECTION MARKINGS */}
                  {showRollingArrow && (
                    <g id="rolling-direction-indicators">
                      {/* Massive Rolling Arrow across middle */}
                      <g transform="translate(380, 205)">
                        <line x1="0" y1="0" x2="400" y2="0" stroke="#38bdf8" strokeWidth="5" strokeDasharray="14,6" />
                        <polygon points="400,-12 430,0 400,12" fill="#38bdf8" />
                        <text x="200" y="-12" fill="#bae6fd" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          ROLLING DIRECTION ➔ (CURVATURE RADIUS R = {selectedPlate.targetRadiusMm.toLocaleString()} mm)
                        </text>
                        <text x="200" y="24" fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          SURFACE: [{selectedPlate.surfaceMarkingSide}] • NEUTRAL AXIS R={selectedPlate.neutralAxisRadiusMm}mm
                        </text>
                      </g>
                    </g>
                  )}

                  {/* 4. INTERNAL / EXTERNAL ATTACHMENTS (TRAY RINGS, LUGS, CUTOUTS) */}
                  {showAttachments && selectedPlate.attachments.map((att) => {
                    if (att.type === 'tray_support_ring') {
                      // Map yMm (0 to 3200) to SVG Y (60 to 380)
                      const svgY = 380 - (att.yMm / selectedPlate.widthMm) * 320;
                      return (
                        <g key={att.id} id={att.id}>
                          <line x1="95" y1={svgY} x2="1105" y2={svgY} stroke="#c084fc" strokeWidth="2.5" strokeDasharray="8,4" />
                          <rect x="220" y={svgY - 10} width="320" height="20" rx="3" fill="#3b0764" stroke="#c084fc" strokeWidth="1" />
                          <text x="380" y={svgY + 4} fill="#f3e8ff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                            {att.label} [{att.weldSpec}]
                          </text>
                        </g>
                      );
                    } else if (att.type === 'lifting_lug_pad') {
                      const svgX = 90 + (att.xMm / selectedPlate.unfoldedLengthMm) * 1020;
                      const svgY = 380 - (att.yMm / selectedPlate.widthMm) * 320;
                      return (
                        <g key={att.id} id={att.id}>
                          <rect
                            x={svgX - 35}
                            y={svgY - 35}
                            width="70"
                            height="70"
                            rx="4"
                            fill="#831843"
                            stroke="#f472b6"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          />
                          <circle cx={svgX} cy={svgY} r="14" fill="#f43f5e" opacity="0.6" />
                          <text x={svgX} y={svgY - 42} fill="#fbcfe8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                            {att.label}
                          </text>
                          <text x={svgX} y={svgY + 4} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                            PAD 500t
                          </text>
                        </g>
                      );
                    } else if (att.diameterMm) {
                      const svgX = 90 + (att.xMm / selectedPlate.unfoldedLengthMm) * 1020;
                      const svgY = 380 - (att.yMm / selectedPlate.widthMm) * 320;
                      const r = (att.diameterMm / selectedPlate.widthMm) * 160;
                      return (
                        <g key={att.id} id={att.id}>
                          {/* Cutout hole */}
                          <circle cx={svgX} cy={svgY} r={r} fill="#030712" stroke="#38bdf8" strokeWidth="3" />
                          {/* Crosshair Center */}
                          <line x1={svgX - r - 15} y1={svgY} x2={svgX + r + 15} y2={svgY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                          <line x1={svgX} y1={svgY - r - 15} x2={svgX} y2={svgY + r + 15} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                          <text x={svgX} y={svgY - r - 8} fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                            CUT-OUT: {att.label} (Ø{att.diameterMm}mm)
                          </text>
                        </g>
                      );
                    } else if (att.type === 'anchor_chair') {
                      const svgX = 90 + (att.xMm / selectedPlate.unfoldedLengthMm) * 1020;
                      return (
                        <g key={att.id} id={att.id}>
                          <rect x={svgX - 18} y="330" width="36" height="42" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
                          <text x={svgX} y="355" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                            CHAIR
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}

                  {/* 5. QR CODE LASER ENGRAVING MARKING BLOCK (BOTTOM RIGHT) */}
                  <g id="qr-code-stamped-block" transform="translate(980, 275)">
                    <rect x="0" y="0" width="115" height="95" rx="4" fill="#09182b" stroke="#06b6d4" strokeWidth="1.5" />
                    {qrDataUrl ? (
                      <image href={qrDataUrl} x="6" y="6" width="55" height="55" />
                    ) : (
                      <rect x="6" y="6" width="55" height="55" fill="#1e293b" />
                    )}
                    <text x="65" y="18" fill="#67e8f9" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      WC SMART QR
                    </text>
                    <text x="65" y="30" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                      {selectedPlate.partNumber}
                    </text>
                    <text x="65" y="42" fill="#f59e0b" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                      {selectedPlate.material.slice(0, 9)}
                    </text>
                    <text x="65" y="54" fill="#10b981" fontSize="7" fontFamily="monospace">
                      HEAT: {selectedPlate.heatNumber.slice(-8)}
                    </text>
                    <rect x="6" y="66" width="103" height="22" rx="2" fill="#0f172a" />
                    <text x="58" y="77" fill="#38bdf8" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
                      SCAN FOR AS-BUILT QC
                    </text>
                    <text x="58" y="86" fill="#a5f3fc" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
                      DWG: {selectedPlate.qrCodeData.drawingNo}
                    </text>
                  </g>

                  {/* 6. OVERALL DIMENSION LINES */}
                  {showDimensions && (
                    <g id="dimension-lines">
                      {/* Top Horizontal Dimension: Unfolded Length */}
                      <line x1="90" y1="25" x2="1110" y2="25" stroke="#94a3b8" strokeWidth="1.2" />
                      <line x1="90" y1="20" x2="90" y2="30" stroke="#94a3b8" strokeWidth="1.2" />
                      <line x1="1110" y1="20" x2="1110" y2="30" stroke="#94a3b8" strokeWidth="1.2" />
                      <text x="600" y="20" fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        UNFOLDED ARC LENGTH = {selectedPlate.unfoldedLengthMm.toLocaleString()} mm (TOL ±2.5mm)
                      </text>

                      {/* Left Vertical Dimension: Width / Height */}
                      <line x1="50" y1="60" x2="50" y2="380" stroke="#94a3b8" strokeWidth="1.2" />
                      <line x1="45" y1="60" x2="55" y2="60" stroke="#94a3b8" strokeWidth="1.2" />
                      <line x1="45" y1="380" x2="55" y2="380" stroke="#94a3b8" strokeWidth="1.2" />
                      <text x="40" y="225" fill="#f1f5f9" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 40 225)" fontFamily="monospace">
                        WIDTH = {selectedPlate.widthMm.toLocaleString()} mm (TOL ±1.5mm)
                      </text>

                      {/* Plate Specification Legend */}
                      <text x="95" y="445" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        THICKNESS: <strong className="text-amber-400">{selectedPlate.thicknessMm} mm</strong> | WEIGHT: <strong className="text-emerald-400">{selectedPlate.weightTon} TON</strong> | AZIMUTH: <strong className="text-cyan-400">{selectedPlate.azimuthCoverage}</strong>
                      </text>
                      <text x="95" y="462" fill="#64748b" fontSize="9" fontFamily="monospace">
                        ASME SEC.VIII DIV.1 / UCS-56 PWHT / 100% RT NDT / HEAT NO: {selectedPlate.heatNumber}
                      </text>
                    </g>
                  )}
                </svg>

                {/* Floating summary info banner */}
                <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white">현장 작업자 마킹 완료:</span>
                    <span className="text-slate-300">
                      작업자는 도면을 별도 지참하지 않고, 철판에 새겨진 마킹만 보고 롤링 방향(➔), 상하 캔 핏업선(▲▼), 트레이 부착선 수평도를 즉시 시공할 수 있습니다.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadDxf}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>전개 마킹 DXF 받기</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('nc_code')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>NC 절단기 데이터 전송 ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: NC CUTTING MACHINE G-CODE TRANSMISSION           */}
          {/* ======================================================== */}
          {activeTab === 'nc_code' && ncProgram && (
            <div className="flex flex-col lg:flex-row gap-5 h-full">
              {/* Left Column: NC Code Terminal & Editor */}
              <div className="flex-1 flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200 ml-2">
                      {ncProgram.programName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                      {ncFormat === 'ISO_GCODE' ? 'ISO/EIA 6983 G-Code' : 'ESSI Machine Code'}
                    </span>
                  </div>

                  {/* Format Toggle & Copy/Download */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-700">
                      <button
                        onClick={() => setNcFormat('ISO_GCODE')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                          ncFormat === 'ISO_GCODE' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        ISO G-Code
                      </button>
                      <button
                        onClick={() => setNcFormat('ESSI_CODE')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                          ncFormat === 'ESSI_CODE' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        ESSI Code
                      </button>
                    </div>

                    <button
                      onClick={handleCopyNc}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                      title="코드 복사"
                    >
                      {copiedNc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNc ? '복사됨' : '복사'}</span>
                    </button>

                    <button
                      onClick={handleDownloadNc}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                      title="NC 파일 다운로드"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{ncProgram.programName} 받기</span>
                    </button>
                  </div>
                </div>

                {/* G-Code Body Viewer */}
                <div className="flex-1 p-4 bg-[#050b14] overflow-y-auto max-h-[520px] font-mono text-xs text-slate-300 leading-relaxed select-text">
                  <pre className="whitespace-pre-wrap">
                    {ncProgram.codeText.split('\n').map((line, idx) => {
                      let color = 'text-slate-300';
                      if (line.startsWith('(') || line.startsWith('%')) color = 'text-slate-500 italic';
                      else if (line.startsWith('T') || line.startsWith('M06')) color = 'text-amber-400 font-bold';
                      else if (line.startsWith('G00')) color = 'text-blue-400';
                      else if (line.startsWith('G01')) color = 'text-cyan-300';
                      else if (line.startsWith('G02') || line.startsWith('G03')) color = 'text-emerald-400';
                      else if (line.startsWith('M14') || line.startsWith('M15')) color = 'text-purple-400 font-bold';
                      else if (line.startsWith('M07') || line.startsWith('M08') || line.startsWith('M09')) color = 'text-red-400 font-bold';

                      return (
                        <div key={idx} className="hover:bg-slate-900/50 px-1 py-0.2 rounded">
                          <span className="text-slate-600 select-none mr-3 inline-block w-8 text-right">
                            {idx + 1}
                          </span>
                          <span className={color}>{line}</span>
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </div>

              {/* Right Column: NC Machine Metrics & Tool Configuration */}
              <div className="w-full lg:w-96 flex flex-col gap-4">
                {/* Machining Cycle Summary Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    NC 절단기 가공 사이클 지표
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">외곽 &amp; 관통 절단장:</span>
                      <span className="font-mono font-bold text-amber-400">{ncProgram.totalCutLengthM} m</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">징크/레이저 마킹 총길이:</span>
                      <span className="font-mono font-bold text-cyan-400">{ncProgram.totalMarkLengthM} m</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">피어싱(관통 점화) 횟수:</span>
                      <span className="font-mono font-bold text-red-400">{ncProgram.pierceCount} 회</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">예상 CNC 총 가공시간:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {ncProgram.estimatedCycleTimeMin} 분
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">적용 강판 중량:</span>
                      <span className="font-mono font-bold text-slate-200">{selectedPlate.weightTon} TON</span>
                    </div>
                  </div>
                </div>

                {/* Target Machine Compatibility */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    연동 지원 CNC 절단기 모델
                  </h3>

                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <strong className="text-cyan-300">Messer OmniMat / MultiTherm:</strong>
                      <div className="text-slate-400 mt-0.5">글로벌 후판 전용 갠트리 플라즈마 &amp; 징크 분말 마킹 지원</div>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <strong className="text-cyan-300">ESAB Suprarex HD / Vision:</strong>
                      <div className="text-slate-400 mt-0.5">3D 베벨 헤드(Double-V 60°) 자동 틸팅 및 잉크젯 마킹 연동</div>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <strong className="text-cyan-300">Koike PNC / Tanaka Heavy Gantry:</strong>
                      <div className="text-slate-400 mt-0.5">ISO G-Code 직접 DNC 유선 전송 및 USB 인터페이스</div>
                    </div>
                  </div>
                </div>

                {/* Direct CAM Export CTA */}
                <div className="bg-gradient-to-br from-cyan-950/70 to-slate-900 border border-cyan-800/80 rounded-xl p-4 shadow-xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    CAM 네스팅(Nesting) 파일 번들
                  </div>
                  <p className="text-[11px] text-slate-300">
                    FastCAM, SigmaNEST, ProNest 소프트웨어에 바로 올릴 수 있는 멀티레이어 DXF와 기계 전송용 NC 파일을 일괄 다운로드합니다.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={handleDownloadDxf}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      DXF 네스팅 받기
                    </button>
                    <button
                      onClick={handleDownloadNc}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      NC 파일 받기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: QR CODE SCANNING & AS-BUILT DRAWING QC VERIFICATION */}
          {/* ======================================================== */}
          {activeTab === 'qr_qc' && (
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left Column: Physical QR Code & Mobile Scanner Simulation */}
              <div className="w-full lg:w-[420px] flex flex-col gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col items-center text-center">
                  <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    부재 레이저 각인 스마트 QR 코드
                  </div>
                  <p className="text-[11px] text-slate-400 mb-4">
                    스마트폰 카메라 또는 산업용 바코드 리더기로 부재의 QR을 비추면 승인도면과 치수 검증 화면이 즉시 호출됩니다.
                  </p>

                  {/* QR Code Container */}
                  <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-cyan-500/50 relative group">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Part QR Code" className="w-56 h-56 object-contain" />
                    ) : (
                      <div className="w-56 h-56 bg-slate-200 flex items-center justify-center text-slate-500">
                        생성 중...
                      </div>
                    )}
                    <div className="absolute inset-0 bg-cyan-950/80 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4">
                      <Camera className="w-8 h-8 text-cyan-400" />
                      <span className="text-xs font-bold">휴대폰 카메라 스캔 가능</span>
                      <span className="text-[10px] text-slate-300 font-mono text-center">
                        {selectedPlate.qrCodeData.serialNo}
                      </span>
                    </div>
                  </div>

                  {/* QR Metadata Badge */}
                  <div className="w-full mt-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">부재 식별자:</span>
                      <span className="text-cyan-300 font-bold">{selectedPlate.qrCodeData.qrId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">시리얼 번호:</span>
                      <span className="text-slate-200">{selectedPlate.qrCodeData.serialNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">승인 도면:</span>
                      <span className="text-amber-400">{selectedPlate.qrCodeData.drawingNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">설계 고도:</span>
                      <span className="text-emerald-400">EL +{selectedPlate.qrCodeData.targetElevationM} m</span>
                    </div>
                  </div>

                  {/* One-click Scan Simulation Button */}
                  <button
                    onClick={() => {
                      setIsQrScanned(true);
                      setTimeout(() => setIsQrScanned(false), 3000);
                    }}
                    className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isQrScanned ? '✓ QR 스캔 성공 - 도면 정합 확인' : '현장 스마트폰 스캔 시뮬레이트'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Dimensional Inspection (Approved Drawing vs As-Built Measurement) */}
              <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                      승인 도면(Approved Drawing) vs 현장 실물 치수 비교 검증 시트
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ASME Sec.VIII Div.1 UG-80 / UCS-79 허용 공차 기준 실측 판정
                    </p>
                  </div>

                  {/* Overall QC Badge */}
                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow ${
                      isAllQcPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                        : 'bg-red-950/80 text-red-300 border-red-600'
                    }`}
                  >
                    {isAllQcPassed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>[승인완료] 조립 핏업 허가 (APPROVED)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>[불일치] 공차 초과 - 시정 조치 필요</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tolerance Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">검사 항목</th>
                        <th className="py-2.5 px-3">승인 도면 설계치</th>
                        <th className="py-2.5 px-3">허용 공차</th>
                        <th className="py-2.5 px-3">현장 실측치 (입력)</th>
                        <th className="py-2.5 px-3">편차</th>
                        <th className="py-2.5 px-3 text-center">합부 판정</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {/* 1. Unfolded Length */}
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-200">1. 전개 원호 길이 (Unfolded Length)</td>
                        <td className="py-3 px-3 text-slate-300">{tol.unfoldedLengthNominalMm.toLocaleString()} mm</td>
                        <td className="py-3 px-3 text-slate-400">±{tol.unfoldedLengthToleranceMm} mm</td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={measLength}
                            onChange={(e) => setMeasLength(parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className={`py-3 px-3 font-bold ${isLengthOk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diffLength > 0 ? `+${diffLength}` : diffLength} mm
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLengthOk ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'}`}>
                            {isLengthOk ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>

                      {/* 2. Width */}
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-200">2. 캔 높이 / 폭 (Plate Width)</td>
                        <td className="py-3 px-3 text-slate-300">{tol.widthNominalMm.toLocaleString()} mm</td>
                        <td className="py-3 px-3 text-slate-400">±{tol.widthToleranceMm} mm</td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={measWidth}
                            onChange={(e) => setMeasWidth(parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className={`py-3 px-3 font-bold ${isWidthOk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diffWidth > 0 ? `+${diffWidth}` : diffWidth} mm
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWidthOk ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'}`}>
                            {isWidthOk ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>

                      {/* 3. Thickness */}
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-200">3. 후판 두께 (Plate Thickness)</td>
                        <td className="py-3 px-3 text-slate-300">{tol.thicknessNominalMm.toFixed(1)} mm</td>
                        <td className="py-3 px-3 text-slate-400">-0.25 / +1.5 mm</td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={measThick}
                            onChange={(e) => setMeasThick(parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className={`py-3 px-3 font-bold ${isThickOk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diffThick > 0 ? `+${diffThick}` : diffThick} mm
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isThickOk ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'}`}>
                            {isThickOk ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>

                      {/* 4. Diagonal Squareness */}
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-200">4. 대각선 직각도 (Diagonal Squareness)</td>
                        <td className="py-3 px-3 text-slate-300">{tol.diagonalNominalMm.toFixed(1)} mm</td>
                        <td className="py-3 px-3 text-slate-400">±{tol.diagonalToleranceMm} mm</td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={measDiagonal}
                            onChange={(e) => setMeasDiagonal(parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className={`py-3 px-3 font-bold ${isDiagOk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diffDiag > 0 ? `+${diffDiag}` : diffDiag} mm
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDiagOk ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'}`}>
                            {isDiagOk ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>

                      {/* 5. Rolling Out of Roundness */}
                      <tr className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-200">5. 롤링 후 진원도 편차 (Out of Roundness)</td>
                        <td className="py-3 px-3 text-slate-300">0.0 mm</td>
                        <td className="py-3 px-3 text-slate-400">Max {tol.rollingOorMaxMm} mm</td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={measOor}
                            onChange={(e) => setMeasOor(parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className={`py-3 px-3 font-bold ${isOorOk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {measOor} mm
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOorOk ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'}`}>
                            {isOorOk ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Inspector Signature Block */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">검사 책임자:</span>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500 w-64"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">검사일시: {new Date().toLocaleDateString()}</span>
                    <button
                      onClick={() => alert(`[QC 검사 성적서 등록 완료]\n\n부재: ${selectedPlate.partNumber}\n판정: ${isAllQcPassed ? 'APPROVED (합격)' : 'REJECT (불합격)'}\n검사원: ${inspectorName}\n\nERP 및 MES 생산관리 시스템에 실시간 등록되었습니다.`)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow cursor-pointer"
                    >
                      검사 성적서 승인 서명
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: 3D DIGITAL TWIN CONTEXT & LOCATION HIGHLIGHT     */}
          {/* ======================================================== */}
          {activeTab === '3d_context' && (
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Compass className="w-4.5 h-4.5 text-cyan-400" />
                      101.1m 워시 타워 내 부재 위치 &amp; 결합 구조 (3D Digital Twin Context)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      선택 부재 [{selectedPlate.partNumber}]의 조립 고도 및 방위각 3D 맵핑
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                    EL +{selectedPlate.qrCodeData.targetElevationM}m
                  </span>
                </div>

                {/* Graphical Representation of the Tower with Highlighted Segment */}
                <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 800 280" className="w-full h-full select-none">
                    {/* Horizontal representation of the 101.1m tower laid flat for SPMT/shop */}
                    <rect x="40" y="80" width="720" height="120" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

                    {/* Dished heads */}
                    <path d="M 40 80 A 60 60 0 0 0 40 200 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                    <path d="M 760 80 A 60 60 0 0 1 760 200 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

                    {/* Can Dividers (28 cans) */}
                    {Array.from({ length: 27 }).map((_, i) => (
                      <line
                        key={i}
                        x1={40 + (i + 1) * (720 / 28)}
                        y1="80"
                        x2={40 + (i + 1) * (720 / 28)}
                        y2="200"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Highlighted Target Can/Segment */}
                    {(() => {
                      const canIdx = selectedPlate.canNumber ? selectedPlate.canNumber - 1 : 13;
                      const canWidth = 720 / 28;
                      const startX = 40 + canIdx * canWidth;
                      return (
                        <g id="highlighted-can-segment">
                          <rect
                            x={startX}
                            y="80"
                            width={canWidth}
                            height="120"
                            fill="#0891b2"
                            fillOpacity="0.4"
                            stroke="#06b6d4"
                            strokeWidth="3"
                            filter="url(#laser-glow)"
                          />
                          {/* Indicator Callout Pin */}
                          <line x1={startX + canWidth / 2} y1="80" x2={startX + canWidth / 2} y2="35" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,3" />
                          <circle cx={startX + canWidth / 2} cy="35" r="4" fill="#22d3ee" />
                          <g transform={`translate(${startX + canWidth / 2}, 25)`}>
                            <rect x="-90" y="-18" width="180" height="24" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1.5" />
                            <text x="0" y="-2" fill="#a5f3fc" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              {selectedPlate.partNumber}
                            </text>
                          </g>
                        </g>
                      );
                    })()}

                    {/* Bottom Ground Reference and Dimensions */}
                    <line x1="40" y1="230" x2="760" y2="230" stroke="#475569" strokeWidth="1.5" />
                    <text x="400" y="248" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      TOTAL TOWER LENGTH = 101.1 METERS (28 CANS / 84 TRAYS)
                    </text>
                  </svg>
                </div>

                {/* 3D Context Details Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1">상하 결합 위치:</span>
                    <div className="font-semibold text-cyan-300">{selectedPlate.matingTopPart}</div>
                    <div className="font-semibold text-emerald-300 mt-1">{selectedPlate.matingBottomPart}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1">원주 방위각(Azimuth) 범위:</span>
                    <div className="font-mono text-amber-300 text-sm font-bold">{selectedPlate.azimuthCoverage}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">3개 분할판 중 제{selectedPlate.segmentIndex}구역</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1">내부 부속품 장착:</span>
                    <div className="text-slate-200">
                      {selectedPlate.attachments.length > 0
                        ? `${selectedPlate.attachments.length}개소 (트레이/러그/노즐)`
                        : '기본 쉘 플레이트'}
                    </div>
                    <div className="text-cyan-400 text-[11px] font-mono mt-0.5">
                      {selectedPlate.attachments[0]?.label || '표준 개선면'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SHOP FLOOR SOP & POKA-YOKE PROCEDURE GUIDE       */}
          {/* ======================================================== */}
          {activeTab === 'sop' && (
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  현장 작업자 마킹 기반 무도면(Drawing-Free) 5단계 표준 작업 지침서 (SOP)
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  현장 작업자가 무거운 설계 도면철을 넘기지 않고, 강판에 레이저로 새겨진 마킹만 보고 실수 없이 롤링 및 용접을 완수할 수 있는 포카요케 절차입니다.
                </p>

                <div className="space-y-4 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <strong className="text-sm text-white">강판 입고 및 내/외면(I.S./O.S.) 식별</strong>
                      <p className="text-slate-300 leading-relaxed">
                        크레인 인양 시 강판 모서리의 <span className="text-red-400 font-bold font-mono">POKA-YOKE 코너 노치(20x20mm)</span>가 좌측 상단에 위치하는지 확인하십시오. 마킹 표면에 명기된 <code>[{selectedPlate.surfaceMarkingSide}]</code> 식별자를 확인하여 롤러 투입 면을 결정합니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-1">
                      <strong className="text-sm text-white">롤링 벤딩 방향(➔) 화살표 확인 및 3본 롤러 투입</strong>
                      <p className="text-slate-300 leading-relaxed">
                        강판 중앙에 새겨진 <span className="text-blue-400 font-bold font-mono">ROLLING DIRECTION ➔</span> 화살표 방향과 평행하게 벤딩 롤러에 인입합니다. 목표 곡률 반경(R={selectedPlate.targetRadiusMm}mm) 게이지를 부재 중심에 밀착하여 진원도 오차를 측정합니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="space-y-1">
                      <strong className="text-sm text-white">L-Seam 맞대기 용접 및 방위각(Azimuth) 정렬</strong>
                      <p className="text-slate-300 leading-relaxed">
                        좌우 맞댐선에 표기된 <code>{selectedPlate.matingLeftPart}</code> 및 <code>{selectedPlate.matingRightPart}</code> 라인을 인접 분할판과 1:1 일치시킵니다. Double-V 60° 개선면 루트 갭(2.5mm)을 유지한 후 150℃ 예열 상태에서 탠덤 SAW 본용접을 진행합니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div className="space-y-1">
                      <strong className="text-sm text-white">상하 캔(C-Seam) 핏업 가이드(▲ UP, ▼ DOWN) 결합</strong>
                      <p className="text-slate-300 leading-relaxed">
                        상단 원주에 각인된 <span className="text-emerald-400 font-bold font-mono">{selectedPlate.matingTopPart}</span> 기호가 상부 경판 방향을 향하고, 하단 기호가 스커트 방향을 향하도록 크레인 조립 방향을 최종 검증합니다.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                      5
                    </div>
                    <div className="space-y-1">
                      <strong className="text-sm text-white">스마트폰 QR 스캔 및 승인도면 최종 치수 검증 (QC Sign-off)</strong>
                      <p className="text-slate-300 leading-relaxed">
                        용접 완료 후 우측 하단 레이저 마킹 QR 코드를 스마트폰으로 스캔하여 실측 길이, 폭, 두께를 입력하고 <span className="text-emerald-400 font-bold">[APPROVED FOR FIT-UP]</span> 승인 성적서를 모바일로 즉시 발급받습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL FOOTER                                                 */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-950 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono">
            <span>선택 부재: <strong className="text-cyan-300">{selectedPlate.partNumber}</strong></span>
            <span>•</span>
            <span>규격: <strong className="text-slate-200">{selectedPlate.material}</strong></span>
            <span>•</span>
            <span>중량: <strong className="text-emerald-400">{selectedPlate.weightTon} t</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDxf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>네스팅 DXF</span>
            </button>

            <button
              onClick={handleDownloadNc}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>NC 절단 G-Code 받기</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
