import React from 'react';
import { BomItem, BlueprintModel } from '../types';
import { calculateBOM } from '../data/cadPresets';
import { X, Table, Download, DollarSign, Scale, Layers } from 'lucide-react';

interface BomModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: BlueprintModel;
}

export const BomModal: React.FC<BomModalProps> = ({ isOpen, onClose, blueprint }) => {
  if (!isOpen) return null;

  const bomItems: BomItem[] = calculateBOM(blueprint);

  const totalWeight = bomItems.reduce((acc, item) => acc + item.totalWeightKg, 0);
  const totalPrice = bomItems.reduce((acc, item) => acc + item.totalPriceKrw, 0);

  const exportCSV = () => {
    let csv = '품번,품명,적용규격,상세치수/사양,재질,수량,단위중량(kg),총중량(kg),단가(원),합계(원),주요가공공정\n';
    bomItems.forEach((item) => {
      csv += `"${item.partNo}","${item.name}","${item.standard}","${item.spec}","${item.material}",${item.quantity},${item.unitWeightKg},${item.totalWeightKg},${item.unitPriceKrw},${item.totalPriceKrw},"${item.process}"\n`;
    });
    csv += `,"합계 (TOTAL)",,,,${bomItems.reduce((a, b) => a + b.quantity, 0)},,${totalWeight.toFixed(2)},,${totalPrice},""\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.id}_BOM_내역서.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">자재 명세서 (BOM - BILL OF MATERIALS)</h2>
              <p className="text-xs text-slate-400">
                2D/3D 파라메트릭 솔리드 치수 연동 자동 자재 산출서 ({blueprint.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 pb-2">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">자재 품목 수</span>
              <div className="text-lg font-bold text-slate-100">{bomItems.length} 개 품목</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">총 금속 중량</span>
              <div className="text-lg font-bold text-emerald-400">{totalWeight.toFixed(2)} kg</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">예상 제작 원가 (BOM 합계)</span>
              <div className="text-lg font-bold text-amber-400">₩{totalPrice.toLocaleString()}원</div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 pt-2 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">품번</th>
                <th className="py-2.5 px-3">품명</th>
                <th className="py-2.5 px-3">규격 및 치수</th>
                <th className="py-2.5 px-3">재질</th>
                <th className="py-2.5 px-3 text-center">수량</th>
                <th className="py-2.5 px-3 text-right">중량(kg)</th>
                <th className="py-2.5 px-3 text-right">단가(원)</th>
                <th className="py-2.5 px-3 text-right">합계(원)</th>
                <th className="py-2.5 px-3">가공 공정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bomItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-cyan-300 font-medium">{item.partNo}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">{item.name}</td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px]">{item.spec}</td>
                  <td className="py-2.5 px-3 text-indigo-300 font-semibold">{item.material}</td>
                  <td className="py-2.5 px-3 text-center text-slate-200">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">{item.totalWeightKg.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">₩{item.unitPriceKrw.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">
                    ₩{item.totalPriceKrw.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">{item.process}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950 font-bold">
                <td colSpan={5} className="py-3 px-3 font-sans text-right text-slate-300">
                  총 합계 (TOTAL):
                </td>
                <td className="py-3 px-3 text-right text-emerald-400">{totalWeight.toFixed(2)} kg</td>
                <td className="py-3 px-3 text-right text-slate-400">-</td>
                <td className="py-3 px-3 text-right text-amber-400 text-sm">
                  ₩{totalPrice.toLocaleString()}원
                </td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs">
          <span className="text-slate-400">
            * 2D 도면 치수(외경, 두께, 볼트홀 개수) 변경 시 BOM 중량과 견적 가격이 자동 재계산됩니다.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>BOM 엑셀(CSV) 내보내기</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
