import React from 'react';
import { BlueprintModel } from '../types';
import { PRESET_BLUEPRINTS } from '../data/cadPresets';
import { X, Check, ArrowRight, Box } from 'lucide-react';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentId: string;
  onSelect: (bp: BlueprintModel) => void;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  currentId,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">도면 라이브러리 선택</h2>
              <p className="text-xs text-slate-400">변경할 2D 도면 및 3D CAD 모델을 선택하세요</p>
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
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {PRESET_BLUEPRINTS.map((bp) => {
            const isSelected = bp.id === currentId;
            return (
              <div
                key={bp.id}
                onClick={() => {
                  onSelect(bp);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">{bp.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      {bp.standard}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        현재 도면
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{bp.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                    <span>OD: Ø{bp.params.outerDiameter}mm</span>
                    <span>PCD: Ø{bp.params.pitchCircleDiameter}mm</span>
                    <span>볼트: {bp.params.boltHoleCount}-Ø{bp.params.boltHoleDiameter}</span>
                    <span>높이: {bp.params.totalHeight}mm</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
