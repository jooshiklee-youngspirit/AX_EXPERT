/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ViewMode, BlueprintModel, FlangeParams, RfpSpecification, SelectedComponentInfo } from './types';
import { PRESET_BLUEPRINTS, DEFAULT_RFP_SPEC } from './data/cadPresets';
import { generateArbitraryBlueprint, verify3DConversion } from './utils/blueprintGenerator';
import { Header } from './components/Header';
import { RfpBanner } from './components/RfpBanner';
import { Blueprint2D } from './components/Blueprint2D';
import { CadViewer3D } from './components/CadViewer3D';
import { RfpSpecModal } from './components/RfpSpecModal';
import { BomModal } from './components/BomModal';
import { ImportModal } from './components/ImportModal';
import { PresetSelectorModal } from './components/PresetSelectorModal';
import { ConversionVerificationModal } from './components/ConversionVerificationModal';
import { WeldingSlackAuditModal } from './components/WeldingSlackAuditModal';
import { PlateMarkingModal } from './components/PlateMarkingModal';
import { exportParamsToDXF, exportSvgElement } from './utils/dxfExporter';
import { CheckCircle2, ShieldCheck, Sparkles, X, ShieldAlert, Split, Smartphone, Cpu } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [splitRatio, setSplitRatio] = useState<'50-50' | '35-65' | '65-35'>('50-50');
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponentInfo | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'2d' | '3d'>('3d');
  const [blueprint, setBlueprint] = useState<BlueprintModel>(PRESET_BLUEPRINTS[0]);
  const [rfpSpec, setRfpSpec] = useState<RfpSpecification>(DEFAULT_RFP_SPEC);

  // Modals state
  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [isBomOpen, setIsBomOpen] = useState(false);
  const [importMode, setImportMode] = useState<'rfp' | 'blueprint' | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isPlateMarkingOpen, setIsPlateMarkingOpen] = useState(false);
  const [isFullscreen3D, setIsFullscreen3D] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);

  // Generate Arbitrary 2D Blueprint & Transform to 3D
  const handleGenerateArbitrary = () => {
    const newBp = generateArbitraryBlueprint();
    setBlueprint(newBp);
    setToastMessage({
      title: '임의 2D 도면 생성 ➔ 3D 파라메트릭 솔리드 실시간 변환 성공',
      subtitle: `${newBp.name} (OD Ø${newBp.params.outerDiameter}mm / ${newBp.params.boltHoleCount}-Ø${newBp.params.boltHoleDiameter}) • 3D 지오메트리 100% 정합`,
    });
    setTimeout(() => {
      setToastMessage(null);
    }, 6500);
  };

  // Update CAD Parameters in real-time
  const handleUpdateParams = (newParams: Partial<FlangeParams>) => {
    setBlueprint((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        ...newParams,
      },
    }));
  };

  // Custom blueprint from AI/RFP analysis
  const handleCustomBlueprint = (params: FlangeParams, name: string) => {
    setBlueprint((prev) => ({
      ...prev,
      id: 'custom-' + Date.now(),
      name,
      params,
    }));
  };

  // Top header downloads
  const handleDownload2D = () => {
    exportParamsToDXF(blueprint.params, `${blueprint.id}_2D_drawing.dxf`);
  };

  const handleDownload3D = () => {
    // Triggers click on the 3D viewer's export or executes direct download
    const exportBtn = document.getElementById('btn-export-3d');
    if (exportBtn) {
      exportBtn.click();
    }
  };

  const verificationReport = verify3DConversion(blueprint);

  const handleUpdateEngineerDays = (days: number) => {
    if (blueprint.vesselParams) {
      setBlueprint((prev) => ({
        ...prev,
        vesselParams: prev.vesselParams
          ? {
              ...prev.vesselParams,
              engineerSubmittedDays: days,
            }
          : undefined,
      }));
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenRfpInput={() => setImportMode('rfp')}
        onOpen2dInput={() => setImportMode('blueprint')}
        onGenerateArbitrary={handleGenerateArbitrary}
        onOpenVerification={() => setIsVerifyModalOpen(true)}
        onDownload2d={handleDownload2D}
        onDownload3d={handleDownload3D}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenPlateMarking={() => setIsPlateMarkingOpen(true)}
      />

      {/* RFP Notification Banner */}
      <RfpBanner
        rfpSpec={rfpSpec}
        onOpenSpec={() => setIsSpecOpen(true)}
        onOpenBom={() => setIsBomOpen(true)}
        onSwitchRfp={() => setImportMode('rfp')}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
      />

      {/* Main CAD Workspace Viewport */}
      <main className="flex-1 p-2 sm:p-3 overflow-hidden flex flex-col min-h-0">
        {/* Workspace Sub-Toolbar: Split Ratio Controls (Desktop) & Mobile View Switcher */}
        {viewMode === 'split' && (
          <div className="flex items-center justify-between pb-2 text-xs">
            {/* Desktop Ratio Adjuster */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg">
              <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                <Split className="w-3.5 h-3.5 text-slate-400" />
                화면 분할비:
              </span>
              <button
                onClick={() => setSplitRatio('50-50')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  splitRatio === '50-50'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="2D 50% : 3D 50% 균등 분할"
              >
                50:50
              </button>
              <button
                onClick={() => setSplitRatio('35-65')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  splitRatio === '35-65'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="2D 35% : 3D 65% (3D 집중 뷰)"
              >
                35:65 (3D↑)
              </button>
              <button
                onClick={() => setSplitRatio('65-35')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  splitRatio === '65-35'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="2D 65% : 3D 35% (도면 집중 뷰)"
              >
                65:35 (2D↑)
              </button>
            </div>

            {/* Mobile View Toggle Buttons (< lg) */}
            <div className="flex lg:hidden items-center justify-between w-full gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 px-1">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>모바일 뷰:</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMobileActiveTab('2d')}
                  className={`px-3 py-1.5 min-h-[36px] rounded text-xs font-semibold transition-colors cursor-pointer ${
                    mobileActiveTab === '2d'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  2D 도면
                </button>
                <button
                  onClick={() => setMobileActiveTab('3d')}
                  className={`px-3 py-1.5 min-h-[36px] rounded text-xs font-semibold transition-colors cursor-pointer ${
                    mobileActiveTab === '3d'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  3D 모델
                </button>
              </div>
            </div>

            {/* Bi-directional Highlighting Indicator */}
            {selectedComponent && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>2D-3D 연동 선택: <strong>{selectedComponent.tag}</strong></span>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Viewport Content */}
        <div className="flex-1 h-full min-h-0">
          {viewMode === 'split' && (
            <div className="h-full">
              {/* Desktop View: Responsive grid with split ratios */}
              <div className="hidden lg:grid grid-cols-12 gap-3 h-full">
                {/* Left Section: 2D Blueprint Source */}
                <div
                  className={`h-full min-h-0 transition-all duration-200 ${
                    splitRatio === '50-50'
                      ? 'col-span-6'
                      : splitRatio === '35-65'
                      ? 'col-span-4'
                      : 'col-span-8'
                  }`}
                >
                  <Blueprint2D
                    blueprint={blueprint}
                    onUpdateParams={handleUpdateParams}
                    onOpenImport={() => setImportMode('blueprint')}
                    onOpenSpec={() => setIsSpecOpen(true)}
                    onOpenPresetSelector={() => setIsPresetModalOpen(true)}
                    onGenerateArbitrary={handleGenerateArbitrary}
                    onOpenVerification={() => setIsVerifyModalOpen(true)}
                    onOpenAuditModal={() => setIsAuditModalOpen(true)}
                    onOpenPlateMarking={() => setIsPlateMarkingOpen(true)}
                    selectedComponent={selectedComponent}
                    onSelectComponent={setSelectedComponent}
                  />
                </div>

                {/* Right Section: 3D Parametric Solid Model */}
                <div
                  className={`h-full min-h-0 transition-all duration-200 ${
                    splitRatio === '50-50'
                      ? 'col-span-6'
                      : splitRatio === '35-65'
                      ? 'col-span-8'
                      : 'col-span-4'
                  }`}
                >
                  <CadViewer3D
                    blueprint={blueprint}
                    isFullscreen={isFullscreen3D}
                    onToggleFullscreen={() => setViewMode('3d-only')}
                    onOpenAuditModal={() => setIsAuditModalOpen(true)}
                    selectedComponent={selectedComponent}
                    onSelectComponent={setSelectedComponent}
                  />
                </div>
              </div>

              {/* Mobile View (< lg): Controlled by mobileActiveTab */}
              <div className="lg:hidden h-full">
                {mobileActiveTab === '2d' ? (
                  <div className="h-full min-h-0">
                    <Blueprint2D
                      blueprint={blueprint}
                      onUpdateParams={handleUpdateParams}
                      onOpenImport={() => setImportMode('blueprint')}
                      onOpenSpec={() => setIsSpecOpen(true)}
                      onOpenPresetSelector={() => setIsPresetModalOpen(true)}
                      onGenerateArbitrary={handleGenerateArbitrary}
                      onOpenVerification={() => setIsVerifyModalOpen(true)}
                      onOpenAuditModal={() => setIsAuditModalOpen(true)}
                      onOpenPlateMarking={() => setIsPlateMarkingOpen(true)}
                      selectedComponent={selectedComponent}
                      onSelectComponent={setSelectedComponent}
                    />
                  </div>
                ) : (
                  <div className="h-full min-h-0">
                    <CadViewer3D
                      blueprint={blueprint}
                      isFullscreen={isFullscreen3D}
                      onToggleFullscreen={() => setViewMode('3d-only')}
                      onOpenAuditModal={() => setIsAuditModalOpen(true)}
                      selectedComponent={selectedComponent}
                      onSelectComponent={setSelectedComponent}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === '3d-only' && (
            <div className="h-full w-full">
              <CadViewer3D
                blueprint={blueprint}
                isFullscreen={true}
                onToggleFullscreen={() => setViewMode('split')}
                onOpenAuditModal={() => setIsAuditModalOpen(true)}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
              />
            </div>
          )}

          {viewMode === '2d-only' && (
            <div className="h-full w-full">
              <Blueprint2D
                blueprint={blueprint}
                onUpdateParams={handleUpdateParams}
                onOpenImport={() => setImportMode('blueprint')}
                onOpenSpec={() => setIsSpecOpen(true)}
                onOpenPresetSelector={() => setIsPresetModalOpen(true)}
                onGenerateArbitrary={handleGenerateArbitrary}
                onOpenVerification={() => setIsVerifyModalOpen(true)}
                onOpenAuditModal={() => setIsAuditModalOpen(true)}
                onOpenPlateMarking={() => setIsPlateMarkingOpen(true)}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Dedicated NC Studio Launcher Widget */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          id="btn-floating-nc-studio"
          onClick={() => setIsPlateMarkingOpen(true)}
          className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/95 hover:bg-slate-900 text-white font-bold shadow-2xl shadow-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 transition-all transform hover:-translate-y-0.5 cursor-pointer backdrop-blur-md"
          title="NC 철판 절단기 마킹 데이터(G-Code) & 스마트 QR 검증 전용 별도 창 열기"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold tracking-tight flex items-center gap-1.5 text-white">
              <span>NC 절단기 마킹 위젯</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            </div>
            <div className="text-[10px] text-cyan-300/80 font-mono font-medium">
              G-Code CAM • QR 실물 검증 창 열기 ➔
            </div>
          </div>
        </button>
      </div>

      {/* Floating Conversion Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-40 max-w-md p-4 rounded-xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{toastMessage.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  PASS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {toastMessage.subtitle}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="text-xs px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>검증 리포트 확인</span>
                </button>
                <button
                  onClick={handleGenerateArbitrary}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  다른 임의 도면 생성
                </button>
              </div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2D to 3D Conversion Verification Modal */}
      <ConversionVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        report={verificationReport}
        blueprint={blueprint}
        onGenerateAnother={handleGenerateArbitrary}
        onView3DOnly={() => setViewMode('3d-only')}
      />

      {/* Fabrication Specification Modal */}
      <RfpSpecModal
        isOpen={isSpecOpen}
        onClose={() => setIsSpecOpen(false)}
        rfpSpec={rfpSpec}
      />

      {/* BOM Table Modal */}
      <BomModal
        isOpen={isBomOpen}
        onClose={() => setIsBomOpen(false)}
        blueprint={blueprint}
      />

      {/* 2D / RFP Input Modal */}
      <ImportModal
        isOpen={importMode !== null}
        onClose={() => setImportMode(null)}
        mode={importMode || 'blueprint'}
        onSelectBlueprint={(bp) => setBlueprint(bp)}
        onCustomParams={handleCustomBlueprint}
      />

      {/* Blueprint Preset Selector Modal */}
      <PresetSelectorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        currentId={blueprint.id}
        onSelect={(bp) => setBlueprint(bp)}
      />

      {/* Welding Engineer Slack Audit & Quality Control Modal */}
      {blueprint.vesselParams && (
        <WeldingSlackAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          vesselParams={blueprint.vesselParams}
          onUpdateEngineerDays={handleUpdateEngineerDays}
        />
      )}

      {/* Plate Marking & NC Steel Plate Cutting Machine Transmission Modal */}
      <PlateMarkingModal
        isOpen={isPlateMarkingOpen}
        onClose={() => setIsPlateMarkingOpen(false)}
      />
    </div>
  );
}
