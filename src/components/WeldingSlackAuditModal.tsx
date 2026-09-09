import React, { useState } from 'react';
import { VesselPlantParams, WeldingLeadTimeAnalysis, PlantCostBreakdown, QualityMatrixItem, CostSensitivityParams } from '../types';
import { calculateWeldingAnalysis, calculatePlantCost, getStandardQualityMatrix } from '../utils/weldingCalculator';
import { EPC_BENCHMARKS, exportAuditToCSV, exportAuditToPrintableHtml } from '../utils/auditExporter';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Flame,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  X,
  Gauge,
  Sliders,
  DollarSign,
  Zap,
  BarChart3,
  SlidersHorizontal,
  Printer,
  Globe2,
} from 'lucide-react';

interface WeldingSlackAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselParams: VesselPlantParams;
  onUpdateEngineerDays?: (days: number) => void;
}

export const WeldingSlackAuditModal: React.FC<WeldingSlackAuditModalProps> = ({
  isOpen,
  onClose,
  vesselParams,
  onUpdateEngineerDays,
}) => {
  const [activeTab, setActiveTab] = useState<'slack-audit' | 'quality-matrix' | 'cost-estimate' | 'sensitivity' | 'benchmark'>('slack-audit');
  const [interactiveDays, setInteractiveDays] = useState<number>(vesselParams.engineerSubmittedDays || 420);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sensitivity analysis sliders state
  const [sensitivity, setSensitivity] = useState<CostSensitivityParams>({
    rawSteelPricePerTonUsd: 1150,
    welderHourlyRateKrw: 58000,
    turnrollAutomationBoostPct: 20,
    ndtRejectionRatePct: 1.2,
  });

  if (!isOpen) return null;

  // Recalculate analysis based on current interactive engineer days
  const currentParams: VesselPlantParams = {
    ...vesselParams,
    engineerSubmittedDays: interactiveDays,
  };

  const analysis: WeldingLeadTimeAnalysis = calculateWeldingAnalysis(currentParams);
  const cost: PlantCostBreakdown = calculatePlantCost(currentParams, analysis);
  const qualityItems: QualityMatrixItem[] = getStandardQualityMatrix(currentParams);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInteractiveDays(val);
    if (onUpdateEngineerDays) {
      onUpdateEngineerDays(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  용접 엔지니어 납기 부풀림(Slack) 감사 & 생산품질 관리 시스템
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold animate-pulse">
                  SLACK DETECTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {vesselParams.equipmentTag} ({vesselParams.totalLengthM}m x Ø{vesselParams.outerDiameterM}m, {vesselParams.totalWeightTon.toLocaleString()}톤) • WC 안중공장
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-800 bg-slate-900/60 gap-2 sm:gap-4 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('slack-audit')}
            className={`flex items-center gap-2 py-3 px-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'slack-audit'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4 shrink-0" />
            <span>납기 부풀림(Slack) 정밀 진단</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono shrink-0">
              +{analysis.slackDays}일
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quality-matrix')}
            className={`flex items-center gap-2 py-3 px-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'quality-matrix'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>ASME 생산품질 & NDT 검사 매트릭스</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono shrink-0">
              결함률 0.16%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cost-estimate')}
            className={`flex items-center gap-2 py-3 px-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'cost-estimate'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>공학 표준 견적가 & 절감액 분석</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono shrink-0">
              -{(cost.costDifferenceKrw / 100_000_000).toFixed(1)}억원
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sensitivity')}
            className={`flex items-center gap-2 py-3 px-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'sensitivity'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>원가/공기 민감도 분석</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono shrink-0">
              시뮬레이터
            </span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center gap-2 py-3 px-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-4 h-4 shrink-0" />
            <span>글로벌 EPC 벤치마크</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono shrink-0">
              경쟁력 비교
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SLACK AUDIT */}
          {activeTab === 'slack-audit' && (
            <div className="space-y-6">
              {/* Alert Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/80 via-amber-950/60 to-slate-900 border border-red-500/40 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>용접엔지니어 제출 납기 과다 경고 ({analysis.slackSeverity})</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/80 text-red-200 border border-red-700">
                        부풀림률 +{analysis.slackPercentage}%
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      공학적 표준 아크 타임(Arc-on) 및 4개 베이 병렬 용접 기준 최적 공기는{' '}
                      <strong className="text-emerald-400 font-mono">{analysis.scientificLeadTimeDays}일</strong>이나,
                      생산 용접팀이 <strong className="text-red-400 font-mono">{analysis.engineerSubmittedDays}일</strong>로 제출하여{' '}
                      <strong className="text-amber-300 font-mono">{analysis.slackDays}일간의 불필요한 태만 마진/지연</strong>이 발생하고 있습니다.
                    </p>
                  </div>
                </div>

                {/* KPI Comparison Badge */}
                <div className="flex items-center gap-4 shrink-0 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">엔지니어 요구</div>
                    <div className="text-xl font-bold font-mono text-red-400">{analysis.engineerSubmittedDays}일</div>
                  </div>
                  <div className="text-xl font-bold text-slate-600">➔</div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">AI 표준 공기</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">{analysis.scientificLeadTimeDays}일</div>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-800" />
                  <div className="text-center">
                    <div className="text-[10px] text-amber-400 font-semibold">단축 가능</div>
                    <div className="text-xl font-bold font-mono text-amber-400">-{analysis.slackDays}일</div>
                  </div>
                </div>
              </div>

              {/* Interactive Engineer Lead Time Slider */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      현장 엔지니어 제출 납기 시뮬레이션 (조절 가능)
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-blue-400">
                    {interactiveDays}일 (약 {(interactiveDays / 30).toFixed(1)}개월)
                  </span>
                </div>
                <input
                  type="range"
                  min={180}
                  max={550}
                  step={5}
                  value={interactiveDays}
                  onChange={handleSliderChange}
                  className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>180일 (극한 압축 공기)</span>
                  <span className="text-emerald-400 font-bold">{analysis.scientificLeadTimeDays}일 (공학적 권장 표준)</span>
                  <span className="text-red-400 font-bold">420일 (엔지니어 과다 제출치)</span>
                  <span>550일 (최대 허용 한계)</span>
                </div>
              </div>

              {/* Scientific Engineering Foundations (How 215 days is calculated) */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>WPS/PQR 기반 과학적 표준 공기(Lead Time) 산출 근거</span>
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="text-[11px] text-slate-400">총 용접 이음 길이</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {analysis.totalWeldLengthM.toLocaleString()} m
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      C-Seam {analysis.totalCircumferentialWeldM}m + L-Seam {analysis.totalLongitudinalWeldM}m
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="text-[11px] text-slate-400">총 용착 금속 중량</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {analysis.totalWeldMetalWeightKg.toLocaleString()} kg
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Double-U 단면적 {analysis.weldCrossSectionAreaCm2} cm²
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="text-[11px] text-slate-400">표준 용접 공수 (M/H)</div>
                    <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                      {analysis.standardTotalManHours.toLocaleString()} M/H
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      순수 아크 {analysis.pureArcHours}h + 핏업/예열
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="text-[11px] text-slate-400">병렬 베이 가동 능력</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {analysis.activeWeldingBays}개 베이 / 2교대
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      탠덤 SAW 턴롤 4대 동시 용접
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown of Production Schedule Steps */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-200">단계별 공정 일정 타임라인 (표준 215일 공기)</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">1. 중후판 롤벤딩 & 캔(Can) 탠덤 SAW 자동 용접</span>
                    <span className="font-mono text-emerald-400 font-semibold">{analysis.weldPassDays}일 소요</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(analysis.weldPassDays / analysis.scientificLeadTimeDays) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">2. 100% 방사선 투과(RT), PAUT 및 620℃ 소둔 열처리(PWHT)</span>
                    <span className="font-mono text-blue-400 font-semibold">{analysis.ndtAndPwhtDays}일 소요</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(analysis.ndtAndPwhtDays / analysis.scientificLeadTimeDays) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">3. 수압시험 (3.6 MPa), 블라스팅, 중방식 도장 & SPMT 적재</span>
                    <span className="font-mono text-purple-400 font-semibold">{analysis.hydroTestAndPaintingDays}일 소요</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${(analysis.hydroTestAndPaintingDays / analysis.scientificLeadTimeDays) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Slack Causes & Immediate Action Plans */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span>용접엔지니어 태만 및 납기 부풀림 4대 요인 적발 & 단축 실행방안</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.slackCauses.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            {item.cause}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                            +{item.delayDays}일 지연
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 flex items-start gap-1.5 text-[11px] text-emerald-400">
                        <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><strong>개선 솔루션:</strong> {item.solution}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUALITY MATRIX */}
          {activeTab === 'quality-matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span>ASME Sec.VIII Div.1 / Div.2 품질 보증 및 NDT 전수 검사 시스템</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    삼성엔지니어링 / 사빅 기준 합격 규격 준수: 방사선 투과(RT) 100% 전수 검사 및 허용 결함률 0.25% 이하 관리
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">현재 용접 결함률</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">0.16% (우수)</div>
                </div>
              </div>

              {/* Quality Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-3 font-semibold">검사 공정</th>
                      <th className="p-3 font-semibold">검사 항목 및 기준</th>
                      <th className="p-3 font-semibold">검사 주기/방법</th>
                      <th className="p-3 font-semibold">목표 결함률</th>
                      <th className="p-3 font-semibold">담당 검사원</th>
                      <th className="p-3 font-semibold text-center">진행 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                    {qualityItems.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-medium text-white">{q.stage}</td>
                        <td className="p-3">
                          <div className="text-slate-200 font-medium">{q.inspectionItem}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{q.acceptanceCriteria}</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          <div>{q.frequency}</div>
                          <div className="text-[10px] text-slate-500">{q.method}</div>
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-semibold">{q.defectRateTarget}</td>
                        <td className="p-3 text-slate-300">{q.inspector}</td>
                        <td className="p-3 text-center">
                          {q.status === 'COMPLETED' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                              합격 완료
                            </span>
                          )}
                          {q.status === 'IN_PROGRESS' && (
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold animate-pulse">
                              검사 진행중
                            </span>
                          )}
                          {q.status === 'SCHEDULED' && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                              공정 예정
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COST ESTIMATE */}
          {activeTab === 'cost-estimate' && (
            <div className="space-y-6">
              {/* Cost Difference Alert */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span>AI 공학 표준 원가 vs 엔지니어 제출 견적가 비교</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    불필요한 공수 마진 및 과다 자재 버퍼 제거로{' '}
                    <strong className="text-emerald-400 font-bold">
                      약 {(cost.costDifferenceKrw / 100_000_000).toFixed(1)}억원
                    </strong>
                    의 원가 절감 포인트를 확보했습니다.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] text-slate-400">엔지니어 제출 견적</div>
                    <div className="text-lg font-bold font-mono text-red-400">
                      {(cost.engineerSubmittedCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                  <div className="text-lg font-bold text-slate-600">➔</div>
                  <div>
                    <div className="text-[10px] text-slate-400">AI 표준 최적 견적</div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {(cost.totalScientificCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Item Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">1. 강재비 (중후판 SA516-70N 2,080톤)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">85mm 중후판 롤벤딩 모재 및 스크랩 8% 감안</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-white">
                      {(cost.rawMaterialCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">2. 용접재료비 (SAW 와이어 & 플럭스)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">총 용착량 24,180kg + 150℃ 베이킹/실드가스</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-white">
                      {(cost.weldingConsumablesCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">3. 순수 용접 & 제관 인건비 (표준 M/H)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">ASME IX 공인용접사 61,632 M/H @ 58,000원</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-blue-400">
                      {(cost.laborWeldingCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">4. NDT 100% RT 및 620℃ PWHT 열처리비</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">1,842m 방사선 탐상 + 대형 밀폐로 8.5시간 침적</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-purple-400">
                      {(cost.ndtQualityCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">5. 내부 트레이 84단 & 단조 노즐 가공비</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">SUS316L 앵글 링 84개소 및 단조 플랜지 42개소</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-white">
                      {(cost.machiningAndInternalsCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">6. SPMT 48축 유압 운송 & 바지선 선적비</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">WC 전용 부두 이송 및 해상 고정 래싱</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-amber-400">
                      {(cost.transportSpmtCostKrw / 100_000_000).toFixed(1)} 억원
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SENSITIVITY ANALYSIS */}
          {activeTab === 'sensitivity' && (() => {
            const steelBaseUsd = 1150;
            const wageBaseKrw = 58000;
            const rawMaterialShiftRatio = sensitivity.rawSteelPricePerTonUsd / steelBaseUsd;
            const laborShiftRatio = sensitivity.welderHourlyRateKrw / wageBaseKrw;
            const turnrollDaysReduction = Math.round(analysis.scientificLeadTimeDays * (sensitivity.turnrollAutomationBoostPct / 100) * 0.4);
            const adjustedLeadTimeDays = Math.max(120, analysis.scientificLeadTimeDays - turnrollDaysReduction + Math.round(sensitivity.ndtRejectionRatePct * 6));
            const adjustedMaterialCost = cost.rawMaterialCostKrw * rawMaterialShiftRatio;
            const adjustedLaborCost = cost.laborWeldingCostKrw * laborShiftRatio * (1 - (sensitivity.turnrollAutomationBoostPct / 100) * 0.25);
            const adjustedTotalCostKrw =
              adjustedMaterialCost +
              adjustedLaborCost +
              cost.weldingConsumablesCostKrw +
              cost.ndtQualityCostKrw * (1 + (sensitivity.ndtRejectionRatePct - 1.2) * 0.08) +
              cost.machiningAndInternalsCostKrw +
              cost.transportSpmtCostKrw;

            return (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-start gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200">
                      원자재가·인건비·자동화율 다변량 민감도 시뮬레이터 (Monte Carlo Sensitivity)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      글로벌 후판 철강 시세 변동, 숙련 용접사 시급 상승, 턴롤 자동화율 도입에 따른 실시간 납기 및 총 제조원가 변화를 실시간으로 스트레스 테스트합니다.
                    </p>
                  </div>
                </div>

                {/* 4 Interactive Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Slider 1: Steel Plate USD/ton */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        1. SA516-70N 후판 원자재 단가 (USD/톤)
                      </label>
                      <span className="text-sm font-bold font-mono text-cyan-400">
                        ${sensitivity.rawSteelPricePerTonUsd.toLocaleString()} / t
                      </span>
                    </div>
                    <input
                      type="range"
                      min="800"
                      max="1600"
                      step="25"
                      value={sensitivity.rawSteelPricePerTonUsd}
                      onChange={(e) => setSensitivity({ ...sensitivity, rawSteelPricePerTonUsd: Number(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>저점 $800</span>
                      <span>기준 $1,150</span>
                      <span>고점 $1,600</span>
                    </div>
                  </div>

                  {/* Slider 2: Welder Hourly Wage */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        2. ASME IX 공인 용접사 시간당 임율 (KRW/hr)
                      </label>
                      <span className="text-sm font-bold font-mono text-blue-400">
                        {sensitivity.welderHourlyRateKrw.toLocaleString()} 원/h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="42000"
                      max="85000"
                      step="1000"
                      value={sensitivity.welderHourlyRateKrw}
                      onChange={(e) => setSensitivity({ ...sensitivity, welderHourlyRateKrw: Number(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>최저 42,000원</span>
                      <span>현재 58,000원</span>
                      <span>성수기 85,000원</span>
                    </div>
                  </div>

                  {/* Slider 3: Turn-roll Automation Boost */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        3. 스마트 턴롤 & 탠덤 자동화율 증대
                      </label>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        +{sensitivity.turnrollAutomationBoostPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="5"
                      value={sensitivity.turnrollAutomationBoostPct}
                      onChange={(e) => setSensitivity({ ...sensitivity, turnrollAutomationBoostPct: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0% (수동 지그)</span>
                      <span>20% (표준 턴롤 4조)</span>
                      <span>40% (AI 적응형 SAW)</span>
                    </div>
                  </div>

                  {/* Slider 4: NDT Rejection Rate */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        4. 100% RT/PAUT 용접 결함률 (Repair Rate)
                      </label>
                      <span className="text-sm font-bold font-mono text-amber-400">
                        {sensitivity.ndtRejectionRatePct.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="4.0"
                      step="0.2"
                      value={sensitivity.ndtRejectionRatePct}
                      onChange={(e) => setSensitivity({ ...sensitivity, ndtRejectionRatePct: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.2% (WC 역대 최고)</span>
                      <span>1.2% (업계 평균)</span>
                      <span>4.0% (고위험 재작업)</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Dynamic Sensitivity Output Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      실시간 민감도 시뮬레이션 산출 결과
                    </span>
                    <span className="text-xs text-cyan-400 font-medium">
                      기준 대비 변동폭 즉시 반영 중
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <div className="text-xs text-slate-400">조정 후 예상 총 납기</div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                        {adjustedLeadTimeDays} 일
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        엔지니어안(420일) 대비 <strong className="text-cyan-300">{420 - adjustedLeadTimeDays}일 단축</strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <div className="text-xs text-slate-400">조정 후 총 제작 원가</div>
                      <div className="text-2xl font-bold font-mono text-white mt-1">
                        {(adjustedTotalCostKrw / 100_000_000).toFixed(1)} 억원
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        후판 {(adjustedMaterialCost / 100_000_000).toFixed(1)}억 + 인건비 {(adjustedLaborCost / 100_000_000).toFixed(1)}억
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <div className="text-xs text-slate-400">최종 순 절감액</div>
                      <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                        {((cost.engineerSubmittedCostKrw - adjustedTotalCostKrw) / 100_000_000).toFixed(1)} 억원
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        원가 절감율: <strong className="text-emerald-400">{(((cost.engineerSubmittedCostKrw - adjustedTotalCostKrw) / cost.engineerSubmittedCostKrw) * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: GLOBAL EPC BENCHMARKS */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-start gap-3">
                <Globe2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-indigo-200">
                    글로벌 Top-tier EPC 제작사 대비 공기 & 원가 벤치마크 (Global Benchmarking)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    국내외 주요 대형 플랜트 타워 제작사(일본 JGC, 치요다, 이탈리아 사이펨, 삼성E&A)의 실적 데이터와 현장 엔지니어 요구안, WC 안중 표준을 비교 분석합니다.
                  </p>
                </div>
              </div>

              {/* Comparative Visual Bar Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Lead Time Days */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>제작 공기(Lead-time) 비교 (일)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">낮을수록 우수</span>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {EPC_BENCHMARKS.map((item, idx) => {
                      const maxDays = 450;
                      const widthPct = Math.min(100, Math.round((item.leadTimeDays / maxDays) * 100));
                      const isWC = item.isOurTarget;
                      const isClaimed = idx === 0;

                      return (
                        <div key={item.company} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={`font-medium truncate ${isWC ? 'text-cyan-300 font-bold' : isClaimed ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                              {item.company} ({item.country})
                            </span>
                            <span className="font-mono font-bold text-slate-100">
                              {item.leadTimeDays}일
                            </span>
                          </div>
                          <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isWC
                                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-md shadow-cyan-500/30'
                                  : isClaimed
                                  ? 'bg-red-500'
                                  : 'bg-indigo-500/70'
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 2: Total Cost in Billion KRW */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>총 제작 견적가 비교 (억원)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">낮을수록 우수</span>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {EPC_BENCHMARKS.map((item, idx) => {
                      const maxCost = 180;
                      const widthPct = Math.min(100, Math.round((item.costBillionKrw / maxCost) * 100));
                      const isWC = item.isOurTarget;
                      const isClaimed = idx === 0;

                      return (
                        <div key={item.company} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={`font-medium truncate ${isWC ? 'text-emerald-300 font-bold' : isClaimed ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                              {item.company}
                            </span>
                            <span className="font-mono font-bold text-slate-100">
                              {item.costBillionKrw} 억원
                            </span>
                          </div>
                          <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isWC
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
                                  : isClaimed
                                  ? 'bg-red-500'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed Benchmark Spec Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">제작처</th>
                      <th className="px-4 py-3">주요 용접 공법</th>
                      <th className="px-4 py-3 text-right">공기(일)</th>
                      <th className="px-4 py-3 text-right">총 견적(억원)</th>
                      <th className="px-4 py-3 text-center">생산성 지수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {EPC_BENCHMARKS.map((b) => (
                      <tr key={b.company} className={b.isOurTarget ? 'bg-cyan-950/30 font-semibold' : ''}>
                        <td className="px-4 py-2.5 flex items-center gap-2">
                          {b.isOurTarget && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                          <span className={b.isOurTarget ? 'text-cyan-300' : ''}>{b.company}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{b.weldingMethod}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-200">{b.leadTimeDays}일</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-200">{b.costBillionKrw} 억</td>
                        <td className="px-4 py-2.5 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${b.productivityIndex >= 1.2 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : b.productivityIndex <= 0.8 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'}`}>
                            {b.productivityIndex.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Export Success Toast In-Modal */}
        {exportNotice && (
          <div className="mx-6 mb-2 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{exportNotice}</span>
            </div>
            <button onClick={() => setExportNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/90">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">ASME Sec.VIII Div.1/2 U2 및 AWS D1.1 공학 표준 기반 감사 엔진</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              닫기
            </button>

            {/* Real CSV / Excel Export */}
            <button
              onClick={() => {
                exportAuditToCSV(currentParams, analysis, cost, qualityItems);
                setExportNotice('감사 내역 및 원가 거버넌스 CSV/Excel 파일이 성공적으로 다운로드되었습니다.');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Excel 호환 CSV 내보내기"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel/CSV 다운로드</span>
            </button>

            {/* Real PDF / Print Report Export */}
            <button
              onClick={() => {
                exportAuditToPrintableHtml(currentParams, analysis, cost, qualityItems);
                setExportNotice('감사 리포트 인쇄/PDF 양식 파일이 생성되어 다운로드되었습니다.');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
              title="인쇄 및 PDF 다운로드"
            >
              <Printer className="w-4 h-4" />
              <span>PDF/인쇄 리포트</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
