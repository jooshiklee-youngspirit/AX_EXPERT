import React from 'react';
import { ViewMode } from '../types';
import {
  Columns,
  Box,
  FileCode,
  FileText,
  Upload,
  Download,
  Sparkles,
  Dices,
  ShieldCheck,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenRfpInput: () => void;
  onOpen2dInput: () => void;
  onGenerateArbitrary: () => void;
  onOpenVerification: () => void;
  onDownload2d: () => void;
  onDownload3d: () => void;
  onOpenAuditModal?: () => void;
  onOpenPlateMarking?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onChangeViewMode,
  onOpenRfpInput,
  onOpen2dInput,
  onGenerateArbitrary,
  onOpenVerification,
  onDownload2d,
  onDownload3d,
  onOpenAuditModal,
  onOpenPlateMarking,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 select-none">
      <div className="max-w-[1920px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                W Company 2D/3D 플랜트 엔지니어링 &amp; 납기·품질 관리 시스템
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                W Company
              </span>
            </div>
            <p className="text-xs text-slate-400">
              초대형 타워·반응기 2D 도면/3D 조감도 변환 • 부재 마킹 &amp; NC 절단기 전송 • 용접 납기 감사 &amp; 원가 견적
            </p>
          </div>
        </div>

        {/* Center & Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium w-full xl:w-auto justify-start xl:justify-end">
          {/* Plate Marking & NC Cutting Machine Transmission */}
          {onOpenPlateMarking && (
            <button
              id="btn-open-plate-marking"
              onClick={onOpenPlateMarking}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-900/30 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="부재 분할 전개도, 마킹선(용접/조립/롤링/트레이), 스마트 QR 코드 & NC 철판 절단기 G-Code 전송"
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>부재 마킹 &amp; NC 절단기 전송</span>
            </button>
          )}

          {/* Welding Engineer Slack Audit CTA Button */}
          {onOpenAuditModal && (
            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-md shadow-amber-900/30 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="용접엔지니어 제출 납기 과다 부풀림(205일) 감사 및 품질 매트릭스"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>용접 납기 </span><span className="hidden sm:inline">부풀림(Slack) </span><span>감사</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              id="btn-view-split"
              onClick={() => onChangeViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">분할 뷰</span>
              <span className="md:hidden">분할</span>
            </button>
            <button
              id="btn-view-3d"
              onClick={() => onChangeViewMode('3d-only')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewMode === '3d-only'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
            <button
              id="btn-view-2d"
              onClick={() => onChangeViewMode('2d-only')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewMode === '2d-only'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>2D</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Arbitrary 2D CAD Generation & Verification */}
          <button
            id="btn-generate-arbitrary-header"
            onClick={onGenerateArbitrary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-900/30 font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="새로운 임의 2D 도면을 생성하고 3D 모델로 실시간 변환합니다"
          >
            <Dices className="w-3.5 h-3.5 shrink-0" />
            <span>임의 도면 생성</span>
          </button>

          <button
            id="btn-open-verify-header"
            onClick={onOpenVerification}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="2D 도면의 3D 파라메트릭 솔리드 변환 정합성 리포트 확인"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">3D 변환 </span><span>검증 (100%)</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden lg:block" />

          {/* Input Modals */}
          <button
            id="btn-open-rfp"
            onClick={onOpenRfpInput}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/50 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>제안서(RFP)</span>
          </button>

          <button
            id="btn-open-2d"
            onClick={onOpen2dInput}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700/50 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>2D 업로드</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden lg:block" />

          {/* Export Buttons */}
          <button
            id="btn-header-download-2d"
            onClick={onDownload2d}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">2D </span><span>도면 받기</span>
          </button>

          <button
            id="btn-header-download-3d"
            onClick={onDownload3d}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">3D </span><span>도면 받기</span>
          </button>
        </div>
      </div>
    </header>
  );
};
