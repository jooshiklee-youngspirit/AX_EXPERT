import React from 'react';
import { RfpSpecification } from '../types';
import { X, FileText, CheckCircle2, ShieldCheck, Download, AlertTriangle, Layers } from 'lucide-react';

interface RfpSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfpSpec: RfpSpecification;
}

export const RfpSpecModal: React.FC<RfpSpecModalProps> = ({ isOpen, onClose, rfpSpec }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">제작 사양 명세서 (RFP SPECIFICATION)</h2>
              <p className="text-xs text-slate-400">발주 요구사항 및 품질 기준 자동 분석 보고서</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Project Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs block">과업명 / 제안 프로젝트</span>
                <span className="text-slate-100 font-semibold text-sm">{rfpSpec.title}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">발주처 기관</span>
                <span className="text-indigo-300 font-semibold text-sm">{rfpSpec.client}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">계약 예산</span>
                <span className="text-amber-400 font-bold text-sm">{rfpSpec.budget}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">납품 기한</span>
                <span className="text-emerald-400 font-semibold text-sm">{rfpSpec.deliveryPeriod}</span>
              </div>
            </div>
          </div>

          {/* Technical Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Design Parameters */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                설계 환경 &amp; 운전 조건
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">설계 압력 (Design Press.):</span>
                  <span className="font-mono text-slate-200">{rfpSpec.designPressure}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">설계 온도 (Design Temp.):</span>
                  <span className="font-mono text-sky-300 font-semibold">{rfpSpec.designTemp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">표면 처리 및 조도:</span>
                  <span className="font-mono text-slate-300 text-right">{rfpSpec.surfaceTreatment}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">용접 사양:</span>
                  <span className="font-mono text-slate-300 text-right">{rfpSpec.weldingRequirements}</span>
                </div>
              </div>
            </div>

            {/* Standards & Codes */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4 text-amber-400" />
                적용 규격 및 인허가 기준
              </h3>
              <ul className="space-y-2 text-xs">
                {rfpSpec.applicableStandards.map((std, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{std}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quality Inspection Requirements */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-rose-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              품질 검사 및 필수 성적서 항목 (Demo Client Lab 입회 시험)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {rfpSpec.inspectionRequirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span className="text-slate-300">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs">
          <span className="text-slate-400">문서 번호: {rfpSpec.projectCode}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text = `제작 사양 명세서\n과업명: ${rfpSpec.title}\n발주처: ${rfpSpec.client}\n예산: ${rfpSpec.budget}\n설계압력: ${rfpSpec.designPressure}\n설계온도: ${rfpSpec.designTemp}\n적용규격:\n${rfpSpec.applicableStandards.join('\n')}\n검사항목:\n${rfpSpec.inspectionRequirements.join('\n')}`;
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Demo Client Lab_LNG_제작사양명세서.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>명세서 텍스트 다운로드</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
            >
              확인 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
