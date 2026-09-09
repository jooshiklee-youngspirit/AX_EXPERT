export type ViewMode = 'split' | '3d-only' | '2d-only';

export type CADMaterialType = 'steel' | 'sus316l' | 'bronze' | 'aluminum' | 'titanium' | 'sa516_70n' | 'clad_steel';

export type DisplayStyle = 'shaded' | 'wireframe' | 'edges' | 'xray';

export type PlantViewOrientation = 'transport-spmt' | 'vertical-erected' | 'section-cut' | 'turnroll-fabrication';

export type ThermalHeatmapMode = 'none' | 'haz-welding' | 'pwht-furnace';

export interface SelectedComponentInfo {
  id: string;
  type: 'nozzle' | 'manhole' | 'weld_c_seam' | 'tray_zone' | 'head' | 'skirt';
  label: string;
  tag: string;
  spec: string;
  locationMm?: number;
  position3D?: [number, number, number];
}

export interface CostSensitivityParams {
  platePricePerTonKrw: number;      // default 1,850,000 KRW
  wireGasFactor: number;            // default 1.0 (100%)
  laborRateFactor: number;          // default 1.0 (100%)
  spmtLogisticsFactor: number;      // default 1.0 (100%)
}

// Flange or Vessel component legacy compatibility params
export interface FlangeParams {
  outerDiameter: number;       // OD e.g. 190 mm
  pitchCircleDiameter: number; // PCD e.g. 160 mm
  boltHoleCount: number;       // e.g. 8
  boltHoleDiameter: number;    // e.g. 12 mm
  bossDiameter: number;        // e.g. 60 mm (hub/neck OD)
  innerDiameter: number;       // e.g. 40 mm (bore ID)
  totalHeight: number;         // e.g. 74 mm
  flangeThickness: number;     // e.g. 24 mm
  raisedFaceDiameter: number;  // e.g. 130 mm
  raisedFaceHeight: number;    // e.g. 2 mm
}

// WC Heavy Plant Equipment (Wash Tower / Column / Reactor / Pressure Vessel) Parameters
export interface VesselPlantParams {
  equipmentType: 'wash_tower' | 'distillation_column' | 'loop_reactor' | 'pressure_vessel' | 'heat_exchanger';
  equipmentTag: string;          // e.g. 'C-101' or 'WASH TOWER'
  projectName: string;           // e.g. 'UNITED EO/EG III PROJECT'
  client: string;                // e.g. 'SAMSUNG ENGINEERING / SABIC'
  fabricator: string;            // 'WC'
  
  // Primary Dimensions
  totalLengthM: number;          // e.g. 101.1 m (길이/전고)
  outerDiameterM: number;        // e.g. 10.8 m (직경)
  totalHeightM: number;          // e.g. 11.4 m (노즐/스커트 포함 최대 외측 폭)
  totalWeightTon: number;        // e.g. 1,926 Ton (총 자중)

  // Structural & Shell Details
  shellThicknessMm: number;      // e.g. 85 mm (쉘 두께, 50~130mm)
  headThicknessMm: number;       // e.g. 95 mm (2:1 경판 두께)
  shellCanCount: number;         // e.g. 28 개 (쉘 캔/링 분할 수)
  headType: 'ellipsoidal_2_1' | 'hemispherical' | 'torispherical';
  
  // Internals & Attachments
  trayCount: number;             // e.g. 84 단 (내부 트레이 서포트 링)
  nozzleCount: number;           // e.g. 42 개소 (인렛, 아웃렛, 리보일러 노즐)
  manholeCount: number;          // e.g. 14 개소 (점검용 맨웨이 Ø600~Ø900)
  skirtHeightM: number;          // e.g. 7.5 m (지지 스커트 높이)
  skirtThicknessMm: number;      // e.g. 55 mm
  
  // Design Operating Conditions
  designPressureMpa: number;     // e.g. 2.4 MPa (24 bar)
  designTempC: number;           // e.g. 220 ℃ (or -45℃)
  hydroTestPressureMpa: number;  // e.g. 3.6 MPa (1.5x)
  corrosionAllowanceMm: number;  // e.g. 3.0 mm

  // Welding Engineering Inputs
  weldGrooveType: 'Double-U' | 'Double-V' | 'Single-V' | 'Narrow-Gap';
  weldingProcessMain: 'SAW (Tandem)' | 'SAW (Single)' | 'FCAW' | 'GTAW/TIG';
  
  // Engineer Submitted vs Scientific Target
  engineerSubmittedDays: number; // e.g. 420 days (현장 용접엔지니어가 제출한 긴 납기)
  engineerSubmittedCostEok: number; // e.g. 185 억원
}

export interface WeldingLeadTimeAnalysis {
  // Calculated Weld Geometry
  totalCircumferentialWeldM: number; // C-Seam 둘레 용접 총 연장 (m)
  totalLongitudinalWeldM: number;    // L-Seam 길이 용접 총 연장 (m)
  totalNozzleWeldM: number;          // 노즐 및 맨홀 풀용입 용접 연장 (m)
  totalWeldLengthM: number;          // 총 용접 이음 길이 (m)

  // Weld Metal Deposition
  weldCrossSectionAreaCm2: number;   // 그루브 단면적 (cm²)
  totalWeldVolumeM3: number;         // 총 용착 금속 체적 (m³)
  totalWeldMetalWeightKg: number;    // 총 용접 금속 중량 (kg)

  // Pure Arc-on Hours & Crew Capacity
  pureArcHours: number;              // 순수 아크 타임 (hours)
  fitupAndPreheatHours: number;      // 핏업, 150℃ 예열 및 층간 가우징 공수 (hours)
  standardTotalManHours: number;     // 총 표준 용접/제관 M/H (Man-Hours)

  // Scientific Schedule (Work shifts & parallel stations)
  activeWeldingBays: number;         // 동시 병렬 가동 베이 수 (예: 4개 베이)
  shiftsPerDay: number;              // 일일 교대 (2교대, 16시간)
  weldPassDays: number;              // 순수 용접 일정 (일)
  ndtAndPwhtDays: number;            // 100% RT/PAUT 비파괴 및 PWHT 열처리 소요 (일)
  hydroTestAndPaintingDays: number;  // 수압시험, 세정, 도장, SPMT 적재 (일)
  
  // Final Lead Times
  scientificLeadTimeDays: number;    // 공학적 표준 최적 납기 (일)
  engineerSubmittedDays: number;     // 용접엔지니어 제출 납기 (일)
  slackDays: number;                 // 부풀려진 납기/태만 마진 일수 (일)
  slackPercentage: number;           // 납기 부풀림 비율 (%)
  slackSeverity: 'OPTIMAL' | 'MODERATE_PAD' | 'EXCESSIVE_SLACK' | 'CRITICAL_DELAY';
  slackCauses: {
    cause: string;
    delayDays: number;
    description: string;
    solution: string;
  }[];
}

export interface PlantCostBreakdown {
  rawMaterialCostKrw: number;        // 강재비 (중후판 원소재)
  weldingConsumablesCostKrw: number; // 용접봉, 와이어, 플럭스, 가스
  laborWeldingCostKrw: number;       // 용접 및 제관 표준 노무비
  ndtQualityCostKrw: number;         // RT, UT, PWHT 열처리 품질 검사비
  machiningAndInternalsCostKrw: number; // 트레이 가공 및 노즐 단조품
  transportSpmtCostKrw: number;      // SPMT 운송 및 항만 바지선 선적비
  overheadAndProfitKrw: number;      // 일반관리비 및 적정 이윤
  
  totalScientificCostKrw: number;    // AI 공학적 표준 견적가 (원)
  engineerSubmittedCostKrw: number;  // 현장 제출 견적가 (원)
  costDifferenceKrw: number;         // 절감 가능 금액 (원)
}

export interface QualityMatrixItem {
  id: string;
  stage: string;
  inspectionItem: string;
  acceptanceCriteria: string;
  frequency: string;
  method: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'ALERT';
  defectRateTarget: string;
  inspector: string;
}

export interface CostSensitivityParams {
  rawSteelPricePerTonUsd: number;      // e.g. 1,150 USD/ton
  welderHourlyRateKrw: number;         // e.g. 58,000 KRW/hr
  turnrollAutomationBoostPct: number;  // e.g. 0 ~ 40% lead time reduction
  ndtRejectionRatePct: number;         // e.g. 0.8% ~ 5.0%
}

export interface EpcBenchmarkComparison {
  company: string;
  country: string;
  leadTimeDays: number;
  costBillionKrw: number;
  weldingMethod: string;
  productivityIndex: number; // relative score (1.0 = baseline)
  isOurTarget?: boolean;
}

export interface BlueprintModel {
  id: string;
  name: string;
  category: string;
  description: string;
  params: FlangeParams;
  vesselParams?: VesselPlantParams;  // Wooyang HC Mega Plant Vessel Parameters
  material: CADMaterialType;
  surfaceFinish: string;
  standard: string;
  rfpTitle?: string;
  rfpClient?: string;
  rfpBudget?: string;
  photoRefUrl?: string;
}

export interface BomItem {
  id: string;
  partNo: string;
  name: string;
  standard: string;
  spec: string;
  material: string;
  quantity: number;
  unitWeightKg: number;
  totalWeightKg: number;
  unitPriceKrw: number;
  totalPriceKrw: number;
  process: string;
}

export interface RfpSpecification {
  title: string;
  client: string;
  projectCode: string;
  budget: string;
  deliveryPeriod: string;
  designPressure: string;
  designTemp: string;
  applicableStandards: string[];
  inspectionRequirements: string[];
  surfaceTreatment: string;
  weldingRequirements: string;
}

// ============================================================================
// PLATE SEGMENT CUTTING, SMART MARKING & NC TRANSMISSION INTERFACES
// ============================================================================

export interface PlateAttachmentMarking {
  id: string;
  type: 'tray_support_ring' | 'lifting_lug_pad' | 'nozzle_cutout' | 'pipe_clip' | 'ladder_bracket' | 'anchor_chair';
  label: string;
  xMm: number;
  yMm: number;
  widthMm?: number;
  heightMm?: number;
  diameterMm?: number;
  orientation: 'inside' | 'outside' | 'through';
  weldSpec: string;
  elevationMm?: number;
  azimuthDeg?: number;
}

export interface PlateSegmentData {
  id: string;
  partNumber: string;                 // e.g. "C101-CAN14-PL02"
  equipmentTag: string;               // e.g. "C-101 (WASH TOWER)"
  componentType: 'shell_can' | 'head_petal' | 'skirt_plate' | 'baffle_plate';
  canNumber?: number;                 // e.g. 14 (Can #14 of 28)
  segmentIndex: number;               // 2 of 3 plates
  totalSegmentsInCan: number;         // 3 plates per can
  
  // Material & Dimensions
  material: string;                   // e.g. "SA516-70N (POSCO Normalized Heavy Plate)"
  heatNumber: string;                 // e.g. "POSCO-H24-98421"
  thicknessMm: number;                // e.g. 85.0
  unfoldedLengthMm: number;           // e.g. 11309.7
  widthMm: number;                    // e.g. 3200 (Can height)
  weightTon: number;                  // e.g. 24.1
  
  // Rolling & Bending Markings
  targetRadiusMm: number;             // e.g. 5400 (Outer radius)
  rollingDirection: 'HORIZONTAL' | 'VERTICAL';
  surfaceMarkingSide: 'INSIDE_SURFACE' | 'OUTSIDE_SURFACE';
  neutralAxisRadiusMm: number;        // e.g. 5357.5 (R - t/2)
  
  // Welding Bevel & Seam Specs
  circumferentialWeldBevel: string;   // e.g. "Double-V 60° (Root face 3mm, Root gap 2mm)"
  longitudinalWeldBevel: string;      // e.g. "Double-V 60° (Submerged Arc Welding SAW)"
  preheatTempC: number;               // e.g. 150
  
  // Mating / Assembly Alignment Guides
  matingTopPart: string;              // e.g. "CAN-15 C-SEAM (▲ UP TO TOP HEAD)"
  matingBottomPart: string;           // e.g. "CAN-13 C-SEAM (▼ DOWN TO SKIRT)"
  matingLeftPart: string;             // e.g. "CAN-14-PL01 (◀ L-SEAM BUTT @ AZ 120°)"
  matingRightPart: string;            // e.g. "CAN-14-PL03 (▶ L-SEAM BUTT @ AZ 240°)"
  azimuthCoverage: string;            // e.g. "120° ~ 240°"
  
  // Poka-Yoke anti-error notches
  pokaYokeFeatures: {
    cornerNotchPosition: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
    notchSizeMm: number;
    punchMarks: string;
  };

  // Internal & External Attachments to Mark
  attachments: PlateAttachmentMarking[];

  // QR Code Payload
  qrCodeData: {
    qrId: string;
    serialNo: string;
    drawingNo: string;
    rev: string;
    targetElevationM: number;
    verificationUrl: string;
  };

  // Dimensional Inspection Tolerances (Approved vs As-Built)
  inspectionTolerances: {
    unfoldedLengthNominalMm: number;
    unfoldedLengthToleranceMm: number;
    widthNominalMm: number;
    widthToleranceMm: number;
    thicknessNominalMm: number;
    thicknessToleranceMinMm: number;
    thicknessToleranceMaxMm: number;
    diagonalNominalMm: number;
    diagonalToleranceMm: number;
    rollingOorMaxMm: number;            // Out of roundness max
  };
}

export interface NcProgramResult {
  programName: string;
  controllerFormat: 'ISO_GCODE' | 'ESSI_CODE';
  totalCutLengthM: number;
  totalMarkLengthM: number;
  pierceCount: number;
  estimatedCycleTimeMin: number;
  codeText: string;
  toolList: {
    toolNo: string;
    process: string;
    feedrateMmpm: number;
    powerOrSetting: string;
  }[];
}

