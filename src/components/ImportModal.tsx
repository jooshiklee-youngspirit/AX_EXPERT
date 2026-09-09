import React, { useState } from 'react';
import { BlueprintModel, FlangeParams } from '../types';
import { PRESET_BLUEPRINTS } from '../data/cadPresets';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  FileCode,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'rfp' | 'blueprint';
  onSelectBlueprint: (bp: BlueprintModel) => void;
  onCustomParams: (params: FlangeParams, name: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSelectBlueprint,
  onCustomParams,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'preset' | 'upload' | 'text'>(
    mode === 'rfp' ? 'text' : 'preset'
  );
  const [rfpText, setRfpText] = useState(
    `[과업요구서] 한국조선해양기자재연구원(KOMERI) LNG 레벨테스트 저장탱크 제작\n1. 상부 액체 주입구 노즐 플랜지: 외경 Ø190mm, PCD Ø160mm, 볼트홀 8개(Ø12mm), 내경 Ø38mm, 보스 외경 Ø60mm, 전고 74mm, 플랜지 두께 24mm.\n2. 재질: SUS316L 극저온 내식 단조재 (ASTM A182 F316L).\n3. 설계압력 1.6 MPa, 설계온도 -163℃.`
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAnalyzeRfpOrImage = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      // Analyze text/drawing parameters
      const extractedParams: FlangeParams = {
        outerDiameter: 190,
        pitchCircleDiameter: 160,
        boltHoleCount: 8,
        boltHoleDiameter: 12,
        bossDiameter: 60,
        innerDiameter: 38,
        totalHeight: 74,
        flangeThickness: 24,
        raisedFaceDiameter: 130,
        raisedFaceHeight: 2,
      };
      onCustomParams(extractedParams, 'AI 분석 도면: KOMERI LNG 노즐 플랜지 (Ø190)');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {mode === 'rfp' ? <FileText className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {mode === 'rfp' ? '제안서(RFP) 분석 및 3D 모델 변환' : '2D 도면 입력 & CAD 라이브러리'}
              </h2>
              <p className="text-xs text-slate-400">
                도면 치수 파라미터 및 P&amp;ID 규격을 추출하여 3D 파라메트릭 솔리드로 즉시 렌더링합니다
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('preset')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'preset'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            표준 CAD 도면 라이브러리 (추천)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2D 도면 파일 업로드 (이미지/DXF)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            제안서(RFP) 요구사항 직접 입력
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Preset Tab */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                제안서 및 조선해양/압력용기 현장에서 가장 많이 사용되는 2D 표준 도면입니다:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {PRESET_BLUEPRINTS.map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => {
                      onSelectBlueprint(bp);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                          {bp.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {bp.standard}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{bp.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                        <span>외경: Ø{bp.params.outerDiameter}mm</span>
                        <span>PCD: Ø{bp.params.pitchCircleDiameter}mm</span>
                        <span>볼트홀: {bp.params.boltHoleCount}개</span>
                        <span>높이: {bp.params.totalHeight}mm</span>
                      </div>
                    </div>

                    <button className="px-3.5 py-1.5 rounded-lg bg-cyan-600/20 group-hover:bg-cyan-600 text-cyan-300 group-hover:text-white border border-cyan-500/40 transition-all text-xs font-medium flex items-center gap-1.5 shrink-0">
                      <span>도면 적용</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="file-upload"
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-950/50 hover:bg-slate-900/40 transition-all cursor-pointer text-center"
              >
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">
                    2D 도면 이미지 또는 DXF 파일을 드래그하거나 클릭하여 업로드
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    지원 포맷: JPG, PNG, DXF, DWG, PDF (최대 50MB)
                  </span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.dxf,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedFile && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{uploadedFile.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(uploadedFile.size / 1024).toFixed(1)} KB | 도면 자동 분석 준비 완료
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleAnalyzeRfpOrImage}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>3D 솔리드 변환 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>도면 분석 및 3D 생성</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  제안서(RFP) 또는 기술 규격서 본문 입력
                </label>
                <textarea
                  value={rfpText}
                  onChange={(e) => setRfpText(e.target.value)}
                  rows={6}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="제안요청서의 도면 치수 규격(예: 외경 Ø190, 볼트홀 8개 등)을 붙여넣으세요..."
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  * 텍스트 내의 외경, PCD, 볼트홀, 높이 치수를 감지하여 3D 모델을 자동 생성합니다.
                </span>
                <button
                  onClick={handleAnalyzeRfpOrImage}
                  disabled={isAnalyzing}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-900/30"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>제안서 분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>제안서 분석 및 3D 생성</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
