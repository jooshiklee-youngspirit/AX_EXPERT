import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { PlateSegmentData, NcProgramResult } from '../types';
import { PLATE_SEGMENT_PRESETS } from '../data/plateMarkingData';
import { generatePlateGCode, generatePlateEssiCode, generatePlateDxf, downloadTextFile } from '../utils/ncCodeGenerator';
import {
  Cpu,
  Layers,
  FileCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Send,
  Camera,
  RefreshCw,
  QrCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Compass,
  FileText,
  RotateCw,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface NcCuttingMarkingStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlateId?: string;
}

export const NcCuttingMarkingStudio: React.FC<NcCuttingMarkingStudioProps> = ({
  isOpen,
  onClose,
  initialPlateId,
}) => {
  const [selectedPlateId, setSelectedPlateId] = useState<string>(
    initialPlateId || PLATE_SEGMENT_PRESETS[0].id
  );
  const [activeTab, setActiveTab] = useState<'nc_code' | 'qr_qc' | 'digital_twin' | 'sop'>('nc_code');
  const [ncFormat, setNcFormat] = useState<'ISO_GCODE' | 'ESSI_CODE'>('ISO_GCODE');
  
  // Layer visibility toggles for the 2D plate canvas
  const [showCutLines, setShowCutLines] = useState(true);
  const [showWeldSeams, setShowWeldSeams] = useState(true);
  const [showRollingDir, setShowRollingDir] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [showPokaYoke, setShowPokaYoke] = useState(true);
  const [showQrBlock, setShowQrBlock] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // DNC Transmission simulation state
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitProgress, setTransmitProgress] = useState(0);
  const [transmitSuccess, setTransmitSuccess] = useState(false);

  // QR Code canvas reference & data
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Dimensional Inspection inputs (Approved Drawing vs As-Built)
  const currentPlate = PLATE_SEGMENT_PRESETS.find((p) => p.id === selectedPlateId) || PLATE_SEGMENT_PRESETS[0];

  const [measurements, setMeasurements] = useState({
    unfoldedLength: currentPlate.inspectionTolerances.unfoldedLengthNominalMm,
    width: currentPlate.inspectionTolerances.widthNominalMm,
    thickness: currentPlate.inspectionTolerances.thicknessNominalMm,
    diagonal: currentPlate.inspectionTolerances.diagonalNominalMm,
    rollingOor: 2.8,
    grooveAngle: 60.0,
    trayRingLevel: 1600.0,
  });

  // Reset measurements when plate changes
  useEffect(() => {
    setMeasurements({
      unfoldedLength: currentPlate.inspectionTolerances.unfoldedLengthNominalMm + 0.8,
      width: currentPlate.inspectionTolerances.widthNominalMm - 0.5,
      thickness: currentPlate.inspectionTolerances.thicknessNominalMm + 0.2,
      diagonal: currentPlate.inspectionTolerances.diagonalNominalMm + 1.2,
      rollingOor: 2.8,
      grooveAngle: 60.0,
      trayRingLevel: 1600.0,
    });
    setTransmitSuccess(false);
    setTransmitProgress(0);
  }, [selectedPlateId]);

  // Generate real QR code on canvas
  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        JSON.stringify({
          id: currentPlate.qrCodeData.qrId,
          part: currentPlate.partNumber,
          dwg: currentPlate.qrCodeData.drawingNo,
          rev: currentPlate.qrCodeData.rev,
          heat: currentPlate.heatNumber,
          elev: currentPlate.qrCodeData.targetElevationM,
        }),
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        }
      );
    }
  }, [currentPlate]);

  // Generate NC Program
  const ncProgram: NcProgramResult =
    ncFormat === 'ISO_GCODE'
      ? generatePlateGCode(currentPlate)
      : generatePlateEssiCode(currentPlate);

  // Handle DNC Transmission to NC Machine
  const handleTransmitDnc = () => {
    setIsTransmitting(true);
    setTransmitProgress(0);
    setTransmitSuccess(false);

    const interval = setInterval(() => {
      setTransmitProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTransmitting(false);
          setTransmitSuccess(true);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  // Tolerances checks
  const tol = currentPlate.inspectionTolerances;
  const isLengthPass = Math.abs(measurements.unfoldedLength - tol.unfoldedLengthNominalMm) <= tol.unfoldedLengthToleranceMm;
  const isWidthPass = Math.abs(measurements.width - tol.widthNominalMm) <= tol.widthToleranceMm;
  const isThkPass = (measurements.thickness - tol.thicknessNominalMm) >= tol.thicknessToleranceMinMm &&
                    (measurements.thickness - tol.thicknessNominalMm) <= tol.thicknessToleranceMaxMm;
  const isDiagPass = Math.abs(measurements.diagonal - tol.diagonalNominalMm) <= tol.diagonalToleranceMm;
  const isOorPass = measurements.rollingOor <= tol.rollingOorMaxMm;
  const isAllPass = isLengthPass && isWidthPass && isThkPass && isDiagPass && isOorPass;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden select-none animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* 1. TOP CONTROL BAR / WORKSPACE HEADER                        */}
      {/* ============================================================ */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                NC 철판 절단기 마킹 데이터 전송 &amp; 현장 스마트 QR 검증 스튜디오
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                WC DNC CONNECT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              대형 탑조류 후판 전개 분할 • CNC 가스/플라즈마 개선 절단 &amp; 마킹 G-Code 전송 • 승인도면 vs 실물 합불 검증
            </p>
          </div>
        </div>

        {/* Plate Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-lg">
            <span className="text-xs text-slate-400">대상 부재:</span>
            <select
              value={selectedPlateId}
              onChange={(e) => setSelectedPlateId(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {PLATE_SEGMENT_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.partNumber} ({p.thicknessMm}mm / {p.componentType === 'shell_can' ? `CAN #${p.canNumber}` : p.componentType})
                </option>
              ))}
            </select>
          </div>

          {/* Quick DNC Transmit Button */}
          <button
            onClick={handleTransmitDnc}
            disabled={isTransmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isTransmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>NC 전송 중 ({transmitProgress}%)</span>
              </>
            ) : transmitSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>DNC 전송 완료!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>NC 절단기로 DNC 전송</span>
              </>
            )}
          </button>

          {/* Close / Return to CAD */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="스튜디오 닫기 및 CAD 화면 복귀"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN SPLIT WORKSPACE                                      */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* LEFT 60%: 2D UN折전개도 INTERACTIVE SVG MARKING CANVAS */}
        <div className="w-full lg:w-[60%] h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 overflow-hidden">
          {/* Canvas Sub-toolbar */}
          <div className="bg-slate-900/80 border-b border-slate-800/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-cyan-400 font-bold">{currentPlate.partNumber}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-mono text-[11px]">
                {currentPlate.unfoldedLengthMm.toFixed(1)} x {currentPlate.widthMm.toFixed(1)} x {currentPlate.thicknessMm}t ({currentPlate.weightTon}t)
              </span>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
              <button
                onClick={() => setShowCutLines(!showCutLines)}
                className={`px-1.5 py-0.5 rounded transition-colors ${showCutLines ? 'bg-emerald-600/30 text-emerald-300 font-bold' : 'text-slate-500'}`}
                title="외곽 절단선 및 베벨"
              >
                절단선
              </button>
              <button
                onClick={() => setShowWeldSeams(!showWeldSeams)}
                className={`px-1.5 py-0.5 rounded transition-colors ${showWeldSeams ? 'bg-red-600/30 text-red-300 font-bold' : 'text-slate-500'}`}
                title="C-Seam / L-Seam 및 인접부재 조립방향"
              >
                용접/방향
              </button>
              <button
                onClick={() => setShowRollingDir(!showRollingDir)}
                className={`px-1.5 py-0.5 rounded transition-colors ${showRollingDir ? 'bg-amber-600/30 text-amber-300 font-bold' : 'text-slate-500'}`}
                title="밴딩/롤링 방향 및 곡률반경"
              >
                롤링R
              </button>
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                className={`px-1.5 py-0.5 rounded transition-colors ${showAttachments ? 'bg-cyan-600/30 text-cyan-300 font-bold' : 'text-slate-500'}`}
                title="트레이 링 및 안착 부속품"
              >
                부속품
              </button>
              <button
                onClick={() => setShowPokaYoke(!showPokaYoke)}
                className={`px-1.5 py-0.5 rounded transition-colors ${showPokaYoke ? 'bg-purple-600/30 text-purple-300 font-bold' : 'text-slate-500'}`}
                title="오조립 방지 노치 및 핀펀치"
              >
                포카요케
              </button>
              <button
                onClick={() => setShowQrBlock(!showQrBlock)}
                className={`px-1.5 py-0.5 rounded transition-colors ${showQrBlock ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-slate-500'}`}
                title="레이저 QR 각인 블록"
              >
                QR각인
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 w-8 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-mono"
                title="100% 리셋"
              >
                1:1
              </button>
            </div>
          </div>

          {/* SVG UN-FOLDED PLATE CANVAS */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#0a0f1d] relative">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="transition-transform duration-150 shadow-2xl rounded border border-slate-800/80 bg-[#0d1527] p-2"
            >
              {/* SVG 1000 x 520 viewBox representing plate coordinate space */}
              <svg width="860" height="460" viewBox="0 0 1000 540" className="select-none font-sans">
                <defs>
                  {/* Grid background */}
                  <pattern id="nc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
                  </pattern>
                  {/* Neon Glow filters */}
                  <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Grid */}
                <rect width="1000" height="540" fill="#0b1120" />
                <rect width="1000" height="540" fill="url(#nc-grid)" />

                {/* DRAWING TITLE BOX & BORDER (0,0 to 1000,540) */}
                {/* Plate Area: x=80, y=70, w=840, h=380 */}
                <g id="plate-body">
                  {/* Outer Steel Plate Base (SA516-70N) */}
                  <rect
                    x="80"
                    y="70"
                    width="840"
                    height="380"
                    fill="#151e33"
                    stroke={showCutLines ? "#10b981" : "#334155"}
                    strokeWidth="3"
                  />

                  {/* Poka-Yoke Top-Left Corner Notch (15x15mm visual) */}
                  {showPokaYoke && (
                    <g id="poka-yoke-notch">
                      <polygon points="80,70 110,70 110,95 80,95" fill="#0b1120" stroke="#a855f7" strokeWidth="2" />
                      <text x="115" y="88" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        POKA-YOKE NOTCH (ROLLING REVERSAL PREVENTION)
                      </text>
                      {/* Punch marks */}
                      <circle cx="95" cy="115" r="3.5" fill="#c084fc" />
                      <circle cx="115" cy="115" r="3.5" fill="#c084fc" />
                      <text x="130" y="118" fill="#e9d5ff" fontSize="8" fontFamily="monospace">
                        PIN PUNCH (AZ 120° ALIGNMENT)
                      </text>
                    </g>
                  )}

                  {/* 1. WELDING BEVEL LINES & MATING DIRECTIONS */}
                  {showWeldSeams && (
                    <g id="welding-guides">
                      {/* TOP C-SEAM (Circumferential Weld to Upper Can) */}
                      <line x1="80" y1="85" x2="920" y2="85" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,3" />
                      <rect x="360" y="52" width="280" height="22" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
                      <text x="500" y="67" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {currentPlate.matingTopPart}
                      </text>

                      {/* BOTTOM C-SEAM (Circumferential Weld to Lower Can) */}
                      <line x1="80" y1="435" x2="920" y2="435" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,3" />
                      <rect x="360" y="445" width="280" height="22" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
                      <text x="500" y="460" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {currentPlate.matingBottomPart}
                      </text>

                      {/* LEFT L-SEAM (Longitudinal Seam Butt Joint) */}
                      <line x1="95" y1="70" x2="95" y2="450" stroke="#f97316" strokeWidth="2" strokeDasharray="6,3" />
                      <g transform="translate(60, 260) rotate(-90)">
                        <rect x="-100" y="-12" width="200" height="20" rx="3" fill="#431407" stroke="#f97316" strokeWidth="1" />
                        <text x="0" y="2" fill="#fdba74" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                          {currentPlate.matingLeftPart}
                        </text>
                      </g>

                      {/* RIGHT L-SEAM (Longitudinal Seam Butt Joint) */}
                      <line x1="905" y1="70" x2="905" y2="450" stroke="#f97316" strokeWidth="2" strokeDasharray="6,3" />
                      <g transform="translate(940, 260) rotate(90)">
                        <rect x="-100" y="-12" width="200" height="20" rx="3" fill="#431407" stroke="#f97316" strokeWidth="1" />
                        <text x="0" y="2" fill="#fdba74" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                          {currentPlate.matingRightPart}
                        </text>
                      </g>
                    </g>
                  )}

                  {/* 2. ROLLING & BENDING MARKINGS */}
                  {showRollingDir && (
                    <g id="rolling-markings">
                      {/* Big Center Arrow */}
                      <line x1="250" y1="260" x2="720" y2="260" stroke="#f59e0b" strokeWidth="4" filter="url(#glow-orange)" />
                      <polygon points="720,248 750,260 720,272" fill="#f59e0b" />
                      <rect x="370" y="242" width="240" height="34" rx="6" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1.5" />
                      <text x="490" y="258" fill="#fde047" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        ROLLING DIRECTION ➔
                      </text>
                      <text x="490" y="271" fill="#93c5fd" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        TARGET RADIUS: R = {currentPlate.targetRadiusMm}mm [{currentPlate.surfaceMarkingSide}]
                      </text>
                    </g>
                  )}

                  {/* 3. ATTACHMENT MARKINGS (Tray Rings, Lifting Lug Pads, Nozzles) */}
                  {showAttachments && (
                    <g id="attachments">
                      {/* Tray Ring Continuous Fillet Line */}
                      <line x1="80" y1="200" x2="920" y2="200" stroke="#06b6d4" strokeWidth="3" strokeDasharray="8,4" filter="url(#glow-cyan)" />
                      <rect x="220" y="188" width="310" height="18" rx="3" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
                      <text x="230" y="201" fill="#a5f3fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        ★ TRAY SUPPORT RING #42 CONTINUOUS FILLET LINE (L100x100x12)
                      </text>

                      {/* Lifting Trunnion Pad (500x500mm box marking) */}
                      <rect x="520" y="280" width="70" height="70" fill="#0e7490" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4,2" />
                      <line x1="520" y1="280" x2="590" y2="350" stroke="#22d3ee" strokeWidth="0.8" />
                      <line x1="590" y1="280" x2="520" y2="350" stroke="#22d3ee" strokeWidth="0.8" />
                      <rect x="470" y="355" width="170" height="16" rx="2" fill="#083344" stroke="#06b6d4" strokeWidth="0.8" />
                      <text x="555" y="367" fill="#67e8f9" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        LIFTING TRUNNION PAD (500x500)
                      </text>

                      {/* Nozzle N1 Cutout (if present) */}
                      {currentPlate.attachments.find(a => a.type === 'nozzle_cutout') && (
                        <g transform="translate(320, 320)">
                          <circle r="40" fill="#0f172a" stroke="#f43f5e" strokeWidth="3" />
                          <circle r="60" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="4,3" />
                          <line x1="-50" y1="0" x2="50" y2="0" stroke="#f43f5e" strokeWidth="1" />
                          <line x1="0" y1="-50" x2="0" y2="50" stroke="#f43f5e" strokeWidth="1" />
                          <rect x="-80" y="48" width="160" height="16" rx="2" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
                          <text x="0" y="60" fill="#fecdd3" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                            Ø1,200 N1 NOZZLE CUTOUT
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* 4. HIGH-DENSITY INDUSTRIAL QR CODE MARKING BLOCK */}
                  {showQrBlock && (
                    <g id="qr-marking-block" transform="translate(730, 310)">
                      <rect x="0" y="0" width="160" height="115" rx="6" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
                      {/* QR frame */}
                      <rect x="10" y="10" width="55" height="55" fill="#ffffff" rx="2" />
                      {/* Fake stylized QR mini dots */}
                      <rect x="14" y="14" width="14" height="14" fill="#000" />
                      <rect x="47" y="14" width="14" height="14" fill="#000" />
                      <rect x="14" y="47" width="14" height="14" fill="#000" />
                      <rect x="32" y="32" width="10" height="10" fill="#000" />

                      <text x="72" y="24" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        SMART QR QC
                      </text>
                      <text x="72" y="37" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                        {currentPlate.partNumber}
                      </text>
                      <text x="72" y="49" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace">
                        HEAT: {currentPlate.heatNumber}
                      </text>
                      <text x="72" y="61" fill="#34d399" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                        {currentPlate.thicknessMm}t / R={currentPlate.targetRadiusMm}
                      </text>

                      {/* Instruction */}
                      <line x1="8" y1="72" x2="152" y2="72" stroke="#1e293b" />
                      <text x="12" y="86" fill="#cbd5e1" fontSize="7" fontFamily="monospace">
                        1. 휴대폰 QR 스캔 시 3D 조감도/도면 즉시 확인
                      </text>
                      <text x="12" y="98" fill="#cbd5e1" fontSize="7" fontFamily="monospace">
                        2. 실물 치수 입력 시 승인도면 공차 자동 대조
                      </text>
                      <text x="12" y="108" fill="#f59e0b" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                        LASER PIN-PUNCHED • HEAT-PROOF 850℃
                      </text>
                    </g>
                  )}

                  {/* DIMENSION LINES (Length & Width) */}
                  <g id="dimension-callouts">
                    {/* Width dimension (right side) */}
                    <line x1="935" y1="70" x2="935" y2="450" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="925" y1="70" x2="945" y2="70" stroke="#64748b" strokeWidth="1" />
                    <line x1="925" y1="450" x2="945" y2="450" stroke="#64748b" strokeWidth="1" />
                    <text x="965" y="265" fill="#cbd5e1" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90, 965, 265)">
                      WIDTH: {currentPlate.widthMm.toLocaleString()} mm
                    </text>

                    {/* Unfolded Length dimension (bottom) */}
                    <line x1="80" y1="490" x2="920" y2="490" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="80" y1="480" x2="80" y2="500" stroke="#64748b" strokeWidth="1" />
                    <line x1="920" y1="480" x2="920" y2="500" stroke="#64748b" strokeWidth="1" />
                    <text x="500" y="515" fill="#cbd5e1" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      UNFOLDED LENGTH: {currentPlate.unfoldedLengthMm.toFixed(1)} mm (FLAT PLATE CUTTING LENGTH)
                    </text>
                  </g>
                </g>
              </svg>
            </div>
          </div>

          {/* Bottom Live Legend Bar */}
          <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <strong className="text-slate-200">초록 실선:</strong> 플라즈마/가스 외곽 절단선 (Double-V 60° Bevel)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                <strong className="text-slate-200">빨강 점선:</strong> C-Seam 원주 용접선 (상하 인접 캔 결합)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                <strong className="text-slate-200">청록 점선:</strong> 트레이 링 &amp; 인양 러그 안착 마킹
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                <strong className="text-slate-200">노랑 화살표:</strong> 롤링 진행 방향 (R={currentPlate.targetRadiusMm}mm)
              </span>
            </div>
            <div className="font-mono text-cyan-400 font-semibold">
              POSCO {currentPlate.material} | HEAT: {currentPlate.heatNumber}
            </div>
          </div>
        </div>

        {/* RIGHT 40%: TABBED OPERATIONAL WORKSPACE */}
        <div className="w-full lg:w-[40%] h-full flex flex-col bg-slate-900 overflow-hidden">
          {/* Tabs header */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setActiveTab('nc_code')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'nc_code'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>NC 절단기 G-Code</span>
            </button>

            <button
              onClick={() => setActiveTab('qr_qc')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'qr_qc'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR 스캔 &amp; 실물검증</span>
            </button>

            <button
              onClick={() => setActiveTab('digital_twin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'digital_twin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3D 장착 위치</span>
            </button>

            <button
              onClick={() => setActiveTab('sop')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sop'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>표준 작업지침</span>
            </button>
          </div>

          {/* TAB 1: NC CODE GENERATION & DNC TRANSMISSION */}
          {activeTab === 'nc_code' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0 space-y-3">
              {/* CNC Machine Spec & Process Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">외곽 절단 길이</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {ncProgram.totalCutLengthM} m
                  </div>
                  <div className="text-[9px] text-slate-500">60° Double-V Bevel</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">마킹 선 길이</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {ncProgram.totalMarkLengthM} m
                  </div>
                  <div className="text-[9px] text-slate-500">잉크젯 / 핀펀치 마킹</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">피어싱 횟수</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    {ncProgram.pierceCount} 회
                  </div>
                  <div className="text-[9px] text-slate-500">85mm 중후판 3.0s</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">가공 사이클 타임</div>
                  <div className="text-sm font-bold text-indigo-300 font-mono">
                    {ncProgram.estimatedCycleTimeMin} 분
                  </div>
                  <div className="text-[9px] text-slate-500">Feed 420mm/min</div>
                </div>
              </div>

              {/* DNC Transmission Status Card */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      공장 DNC 네트워크 연결: 1호기 대형 갠트리 절단기 (MESSER OMNICUT 6000)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    TCP/IP 192.168.10.42
                  </span>
                </div>

                {isTransmitting && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>G-Code 블록 패킷 전송 중...</span>
                      <span className="font-mono">{transmitProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-200"
                        style={{ width: `${transmitProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {transmitSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>전송 성공:</strong> NC 장비 제어반(CNC)에 <code className="font-mono text-white">{ncProgram.programName}</code> 등록 완료!
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">STANDBY FOR CUT</span>
                  </div>
                )}
              </div>

              {/* Code Format Switcher & File Download Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setNcFormat('ISO_GCODE')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                      ncFormat === 'ISO_GCODE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ISO G-Code (.NC)
                  </button>
                  <button
                    onClick={() => setNcFormat('ESSI_CODE')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                      ncFormat === 'ESSI_CODE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ESSI Code (.ESI)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => downloadTextFile(ncProgram.programName, ncProgram.codeText)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="NC 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>NC 저장</span>
                  </button>

                  <button
                    onClick={() => downloadTextFile(`${currentPlate.partNumber}_UNFOLDED.dxf`, generatePlateDxf(currentPlate))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="CAD DXF 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DXF 저장</span>
                  </button>
                </div>
              </div>

              {/* G-Code Live Code Preview Area */}
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[11px] overflow-auto text-slate-300 leading-relaxed min-h-0">
                <pre className="whitespace-pre">{ncProgram.codeText}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: QR SCAN & AS-BUILT VS APPROVED DRAWING QC */}
          {activeTab === 'qr_qc' && (
            <div className="flex-1 flex flex-col p-4 overflow-auto space-y-4 min-h-0">
              {/* QR Code & Part Identification Header */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shrink-0 shadow">
                  <canvas ref={qrCanvasRef} width={100} height={100} className="w-24 h-24" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="text-[10px] text-cyan-400 font-mono font-bold">
                    QR SERIAL: {currentPlate.qrCodeData.serialNo}
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {currentPlate.partNumber} ({currentPlate.material})
                  </div>
                  <div className="text-xs text-slate-400">
                    승인도면: <span className="font-mono text-slate-200 font-semibold">{currentPlate.qrCodeData.drawingNo}</span> ({currentPlate.qrCodeData.rev})
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    설계 치수: {currentPlate.unfoldedLengthMm.toFixed(1)}mm(L) x {currentPlate.widthMm.toFixed(1)}mm(W) x {currentPlate.thicknessMm}mm(T)
                  </div>
                </div>
              </div>

              {/* 7-Point Dimensional Inspection & Tolerance Comparator Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>승인도면(Approved Drawing) vs 현장 실측치(As-Built) 검증 시트</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAllPass ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
                  }`}>
                    {isAllPass ? '전 항목 공차 만족 (PASS)' : '공차 초과 항목 있음 (FAIL)'}
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/80 text-slate-300 text-[10px] font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-2">검사 항목</th>
                        <th className="p-2">승인 도면치</th>
                        <th className="p-2">허용 공차</th>
                        <th className="p-2">현장 실측치 (입력)</th>
                        <th className="p-2 text-center">판정</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {/* 1. Unfolded Length */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300 font-sans font-medium">1. 전개 길이 (Length)</td>
                        <td className="p-2 text-slate-200">{tol.unfoldedLengthNominalMm.toFixed(1)} mm</td>
                        <td className="p-2 text-slate-400">±{tol.unfoldedLengthToleranceMm} mm</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={measurements.unfoldedLength}
                            onChange={(e) => setMeasurements({ ...measurements, unfoldedLength: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {isLengthPass ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>

                      {/* 2. Width (Can Height) */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300 font-sans font-medium">2. 캔 폭 / 높이 (Width)</td>
                        <td className="p-2 text-slate-200">{tol.widthNominalMm.toFixed(1)} mm</td>
                        <td className="p-2 text-slate-400">±{tol.widthToleranceMm} mm</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={measurements.width}
                            onChange={(e) => setMeasurements({ ...measurements, width: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {isWidthPass ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>

                      {/* 3. Plate Thickness */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300 font-sans font-medium">3. 후판 두께 (Thickness)</td>
                        <td className="p-2 text-slate-200">{tol.thicknessNominalMm.toFixed(1)} mm</td>
                        <td className="p-2 text-slate-400">-{Math.abs(tol.thicknessToleranceMinMm)} / +{tol.thicknessToleranceMaxMm} mm</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={measurements.thickness}
                            onChange={(e) => setMeasurements({ ...measurements, thickness: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {isThkPass ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>

                      {/* 4. Diagonal Squareness */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300 font-sans font-medium">4. 대각선 직각도 (Diagonal)</td>
                        <td className="p-2 text-slate-200">{tol.diagonalNominalMm.toFixed(1)} mm</td>
                        <td className="p-2 text-slate-400">±{tol.diagonalToleranceMm} mm</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={measurements.diagonal}
                            onChange={(e) => setMeasurements({ ...measurements, diagonal: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {isDiagPass ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>

                      {/* 5. Rolling Out-of-Roundness */}
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-300 font-sans font-medium">5. 롤링 후 진원도 편차 (OOR)</td>
                        <td className="p-2 text-slate-200">R={currentPlate.targetRadiusMm} mm</td>
                        <td className="p-2 text-slate-400">Max {tol.rollingOorMaxMm} mm</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={measurements.rollingOor}
                            onChange={(e) => setMeasurements({ ...measurements, rollingOor: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {isOorPass ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inspection Disposition / Approval Certificate Card */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                isAllPass
                  ? 'bg-emerald-950/40 border-emerald-600/60'
                  : 'bg-red-950/40 border-red-600/60'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isAllPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isAllPass ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isAllPass
                        ? '품질검사 합격: 승인도면 정합 확인 완료 (APPROVED FOR FIT-UP)'
                        : '품질 경고: 도면 공차 초과 (NCR 불일치 시정조치 요구)'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      검사관: ASME Lead Inspector • 검사기준: ASME Sec.VIII Div.1 UG-80 / AWS D1.1
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert(`[품질 합격 승인서 발행]\n부재 번호: ${currentPlate.partNumber}\nHeat No: ${currentPlate.heatNumber}\n전 항목 공차 검증 PASS (ASME U2 승인 완료)`)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer whitespace-nowrap"
                >
                  승인서 발급
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 3D DIGITAL TWIN MOUNTING CONTEXT */}
          {activeTab === 'digital_twin' && (
            <div className="flex-1 flex flex-col p-4 overflow-auto space-y-3 min-h-0">
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>전체 101.1m 워시 타워 내 부재 조립 위치</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
                    ELEVATION: EL +{currentPlate.qrCodeData.targetElevationM}m
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed">
                  본 부재 <strong>{currentPlate.partNumber}</strong>는 101.1m 워시 타워의{' '}
                  <span className="text-cyan-300 font-semibold font-mono">CAN #{currentPlate.canNumber}</span>에 해당하는{' '}
                  3분할 원주 중 <strong>{currentPlate.segmentIndex}번째 플레이트 (방위각 {currentPlate.azimuthCoverage})</strong>입니다.
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">설치 해발 고도:</span>
                    <div className="font-mono text-emerald-400 font-bold text-sm">
                      EL +{currentPlate.qrCodeData.targetElevationM} m
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">결합 방위각:</span>
                    <div className="font-mono text-cyan-400 font-bold text-sm">
                      {currentPlate.azimuthCoverage}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tower Height Scale Graphic */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-slate-300">타워 수직 고도별 캔 적층 다이어그램</div>
                <div className="relative h-40 bg-slate-900 rounded-lg p-2 flex items-center justify-center border border-slate-800 overflow-hidden">
                  <div className="w-16 h-36 border-2 border-slate-700 bg-slate-800/80 rounded-t-xl relative flex flex-col justify-between p-1">
                    <div className="text-[8px] text-center text-slate-400">TOP 101m</div>
                    {/* Highlighted Can Band */}
                    <div className="w-full bg-cyan-500/30 border border-cyan-400 p-0.5 rounded text-[8px] text-cyan-200 text-center font-bold animate-pulse">
                      CAN #{currentPlate.canNumber || 'HD'}
                    </div>
                    <div className="text-[8px] text-center text-slate-400">BTM 0m</div>
                  </div>
                  <div className="ml-6 space-y-1 text-xs">
                    <div className="text-slate-400">상부 결합: <strong className="text-slate-200">{currentPlate.matingTopPart}</strong></div>
                    <div className="text-slate-400">하부 결합: <strong className="text-slate-200">{currentPlate.matingBottomPart}</strong></div>
                    <div className="text-slate-400">좌측 맞대기: <strong className="text-slate-200">{currentPlate.matingLeftPart}</strong></div>
                    <div className="text-slate-400">우측 맞대기: <strong className="text-slate-200">{currentPlate.matingRightPart}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STANDARD OPERATING PROCEDURE (SOP) */}
          {activeTab === 'sop' && (
            <div className="flex-1 p-4 overflow-auto space-y-3 min-h-0 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>현장 작업자 마킹 기반 100% 무결함 조립 원칙 (5대 수칙)</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <div>
                      <strong>강판 입고 시 면(I.S./O.S.) 및 롤링 방향 확인:</strong> 후판 표면의 <code>ROLLING DIRECTION ➔</code> 화살표가 벤딩 롤러 삽입 축과 직각을 이루는지 점검.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <div>
                      <strong>포카요케(오조립 방지) 코너 노치 검증:</strong> 상부 좌측 15mm 노치가 정확한 위치에 있는지 확인하여 강판 앞/뒷면 및 상/하 반전 원천 차단.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <div>
                      <strong>C-Seam / L-Seam 핏업(Fit-up) 정렬:</strong> 인접 강판의 <code>▲ FIT-UP WITH CAN-15</code> 및 <code>◀ BUTT JOINT</code> 기호를 상호 일치시켜 원주 오차 0mm 조립.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                    <div>
                      <strong>부속품(트레이 지지링/러그) 사전 마킹선 확인:</strong> 롤링 전 평판 상태에서 타점된 청록색 안착선에 맞춰 취부하여 수평도 오차 ±1.0mm 이내 유지.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">5</span>
                    <div>
                      <strong>스마트폰 QR 스캔을 통한 즉시 검증:</strong> 강판 우측 하단 레이저 각인 QR 코드를 스캔하여 승인도면(REV.3)과 실물 치수를 대조 후 조립 개시.
                    </div>
                  </div>
                </div>
              </div>

              {/* POSCO Mill Test Certificate (MTR) Link */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">포스코 공인 강판 밀시트 (MTR 연동)</div>
                  <div className="font-mono text-cyan-300 font-bold">{currentPlate.heatNumber}</div>
                  <div className="text-[10px] text-slate-500">인장강도: 515 MPa • 충격시험: -46℃ 68J (ASME U2)</div>
                </div>
                <button
                  onClick={() => alert(`[POSCO MTR CERTIFICATE]\n강종: SA516-70N\nHeat No: ${currentPlate.heatNumber}\n항복강도: 380 MPa\n인장강도: 545 MPa\n연신율: 28%\n100% 초음파 UT 탐상 합격 (ASTM A578 Level 1)`)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>밀시트 확인</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
