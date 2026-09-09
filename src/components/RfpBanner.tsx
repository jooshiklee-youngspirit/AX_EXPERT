import React from 'react';
import { RfpSpecification } from '../types';
import { FileText, Table, RefreshCw, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface RfpBannerProps {
  rfpSpec: RfpSpecification;
  onOpenSpec: () => void;
  onOpenBom: () => void;
  onSwitchRfp: () => void;
  onOpenAuditModal?: () => void;
}

export const RfpBanner: React.FC<RfpBannerProps> = ({
  rfpSpec,
  onOpenSpec,
  onOpenBom,
  onSwitchRfp,
  onOpenAuditModal,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-900/40 px-4 py-2.5">
      <div className="max-w-[1920px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 text-xs">
        {/* Left: Info Text */}
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 mt-0.5 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-cyan-300">제안서 분석 활성화:</span>
              <span className="text-slate-100 font-medium">{rfpSpec.title}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                발주처: <strong className="text-slate-300 font-normal">{rfpSpec.client}</strong>
              </span>
              <span>|</span>
              <span>
                예산: <strong className="text-amber-400 font-semibold">{rfpSpec.budget}</strong>
              </span>
              <span>|</span>
              <span>
                설계압력: <strong className="text-slate-300 font-mono">{rfpSpec.designPressure}</strong>
              </span>
              <span>|</span>
              <span>
                설계온도: <strong className="text-sky-300 font-mono">{rfpSpec.designTemp}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenAuditModal && (
            <button
              id="btn-rfp-audit-slack"
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-900/30 transition-all cursor-pointer"
              title="용접엔지니어 납기 부풀림(Slack) 감사 & 원가 절감 분석"
            >
              <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0" />
              <span>납기 부풀림(Slack) 감사</span>
            </button>
          )}

          <button
            id="btn-view-spec-details"
            onClick={onOpenSpec}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer shadow-sm"
          >
            <span>사양 명세서</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-view-bom"
            onClick={onOpenBom}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
            <span>BOM 내역</span>
          </button>

          <button
            id="btn-switch-rfp"
            onClick={onSwitchRfp}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">다른 </span><span>제안서</span>
          </button>
        </div>
      </div>
    </div>
  );
};
