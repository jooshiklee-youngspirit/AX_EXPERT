import { VesselPlantParams, WeldingLeadTimeAnalysis, PlantCostBreakdown, QualityMatrixItem } from '../types';

/**
 * ASME Sec.VIII Div.1 / Div.2 and AWS D1.1 based Welding Engineering Calculator
 * Designed to scientifically evaluate weld deposition, standard man-hours (M/H),
 * and detect excessive lead time pads / engineer slacks in heavy vessel manufacturing.
 */
export function calculateWeldingAnalysis(params: VesselPlantParams): WeldingLeadTimeAnalysis {
  const D = params.outerDiameterM;
  const L = params.totalLengthM;
  const tMm = params.shellThicknessMm;
  const tM = tMm / 1000;
  const canCount = params.shellCanCount || Math.max(12, Math.round(L / 3.2));
  
  // 1. Circumferential Seams (C-Seams)
  // Joints between cans + 2 head attachment seams + skirt seam
  const cSeamCount = canCount + 2;
  const totalCSeamM = Math.PI * D * cSeamCount;

  // 2. Longitudinal Seams (L-Seams)
  // Large diameter (e.g. 10.2m) requires 2 to 3 rolled plates per can ring
  const platesPerRing = D > 8 ? 3 : D > 4 ? 2 : 1;
  const canLength = L / canCount;
  const totalLSeamM = canCount * platesPerRing * canLength;

  // 3. Nozzle & Manhole Full Penetration Attachment Welds
  const avgNozzleDiaM = 0.45; // average nozzle Ø450mm
  const avgManholeDiaM = 0.85; // manhole Ø850mm
  const totalNozzleM =
    params.nozzleCount * (Math.PI * avgNozzleDiaM) +
    params.manholeCount * (Math.PI * avgManholeDiaM);

  const totalWeldLengthM = totalCSeamM + totalLSeamM + totalNozzleM;

  // 4. Weld Cross-Section Area & Deposition Weight (ASME Double-U / Double-V groove)
  // For t = 85mm, Double-U groove includes 15 deg bevel, 2mm root face, 3mm gap, 2mm cap reinforcement
  const bevelAngleRad = (params.weldGrooveType === 'Narrow-Gap' ? 7 : 15) * (Math.PI / 180);
  const rootGapMm = 3;
  const rootFaceMm = 2;
  const reinforcementCapMm = 3;
  
  // Approximation of Double-U / Double-V cross section in cm2
  const grooveAreaMm2 =
    (tMm - rootFaceMm * 2) * (tMm / 2) * Math.tan(bevelAngleRad) +
    tMm * rootGapMm +
    (D * 1000 > 6000 ? 180 : 120); // cap & internal backing reinforcement
  const grooveAreaCm2 = grooveAreaMm2 / 100;
  const grooveAreaM2 = grooveAreaMm2 / 1_000_000;

  const steelDensityKgM3 = 7850;
  const totalWeldVolumeM3 = totalWeldLengthM * grooveAreaM2;
  const totalWeldMetalWeightKg = totalWeldVolumeM3 * steelDensityKgM3;

  // 5. Deposition Rates (kg/hour) and Arc Efficiency
  let depositionRateKgH = 9.5; // Tandem SAW (Submerged Arc Welding)
  let arcEfficiency = 0.65;    // 65% duty cycle

  if (params.weldingProcessMain === 'SAW (Single)') {
    depositionRateKgH = 5.2;
    arcEfficiency = 0.60;
  } else if (params.weldingProcessMain === 'FCAW') {
    depositionRateKgH = 3.8;
    arcEfficiency = 0.50;
  } else if (params.weldingProcessMain === 'GTAW/TIG') {
    depositionRateKgH = 1.4;
    arcEfficiency = 0.45;
  }

  // Pure Arc-on hours
  const pureArcHours = totalWeldMetalWeightKg / depositionRateKgH;

  // Preparation: Fit-up (20%), 150℃ Preheating (12%), Back Gouging & Grinding (15%), Interpass Cleaning (10%)
  const auxFactor = 1.57;
  const standardTotalManHours = Math.round((pureArcHours / arcEfficiency) * auxFactor);

  // 6. Scientific Production Scheduling
  // W Company Heavy Bay capacity: 4 parallel assembly/rolling stations, 2 shifts (16 hrs/day)
  const activeWeldingBays = 4;
  const shiftsPerDay = 2;
  const effectiveHoursPerDay = activeWeldingBays * shiftsPerDay * 7.5; // net hours/day

  const weldPassDays = Math.round(standardTotalManHours / effectiveHoursPerDay);

  // NDT (100% RT, PAUT/TOFD, MT/PT) & PWHT (Post Weld Heat Treatment 620℃ soaking)
  const ndtAndPwhtDays = Math.max(25, Math.round(weldPassDays * 0.28));

  // Hydrostatic Test (1.5x design pressure) + Internal Blast + Painting + SPMT Rigging
  const hydroTestAndPaintingDays = Math.max(18, Math.round(L > 80 ? 28 : 18));

  // Buffer & Contingency (Engineering standard is strictly 10~15%, NOT 100%)
  const standardBufferDays = Math.round((weldPassDays + ndtAndPwhtDays + hydroTestAndPaintingDays) * 0.12);

  const scientificLeadTimeDays =
    weldPassDays + ndtAndPwhtDays + hydroTestAndPaintingDays + standardBufferDays;

  // 7. Engineer Submitted Slack Detection
  const engineerSubmittedDays = params.engineerSubmittedDays || Math.round(scientificLeadTimeDays * 1.85);
  const slackDays = Math.max(0, engineerSubmittedDays - scientificLeadTimeDays);
  const slackPercentage = Math.round((slackDays / scientificLeadTimeDays) * 100);

  let slackSeverity: 'OPTIMAL' | 'MODERATE_PAD' | 'EXCESSIVE_SLACK' | 'CRITICAL_DELAY' = 'OPTIMAL';
  if (slackPercentage > 60) slackSeverity = 'CRITICAL_DELAY';
  else if (slackPercentage > 30) slackSeverity = 'EXCESSIVE_SLACK';
  else if (slackPercentage > 10) slackSeverity = 'MODERATE_PAD';

  const slackCauses = [
    {
      cause: '캔(Shell Can) 직렬 순차 조립 고집 (병렬화 미적용)',
      delayDays: Math.round(slackDays * 0.35),
      description: '4개 베이에서 캔 롤벤딩 및 C-Seam 선조립을 동시 병렬 진행하지 않고 순차 제작함',
      solution: 'Turn-roll 4개 베이 병렬 가동 및 블록 단위(3-Can Block) 선조립 공법 적용',
    },
    {
      cause: '탠덤(Tandem 2-Wire) 자동 SAW 미활용 및 단일 와이어 저속 운용',
      delayDays: Math.round(slackDays * 0.28),
      description: '용착량 9.5kg/h 가능한 탠덤 SAW 대신 단일 와이어(5kg/h)로 여유 있게 작업 편성',
      solution: 'C-Seam 웰딩 붐(Welding Boom) 탠덤 자동 용접 장비 100% 필수 투입 지시',
    },
    {
      cause: 'NDT(방사선 투과 RT) 야간 촬영 지연 및 필름 판독 큐 적체',
      delayDays: Math.round(slackDays * 0.18),
      description: '용접 완료 후 2~3일씩 검사 대기 발생, 주간 PAUT(초음파) 실시간 대체 미흡',
      solution: '디지털 RT(CR/DR) 및 위상배열초음파(PAUT) 도입으로 용접 직후 즉시 비파괴 검증',
    },
    {
      cause: '현장 용접엔지니어/기술팀의 과도한 업무 안전마진(Slack) 부풀림',
      delayDays: Math.round(slackDays * 0.19),
      description: '공정 리스크 핑계로 불필요한 공백 일수를 추가하여 납기 평가 회피 목적의 여유 일수 삽입',
      solution: 'WPS/PQR 기반 표준 M/H 실명제 및 일일 아크 타임(Arc-on) 모니터링 KPI 연계',
    },
  ];

  return {
    totalCircumferentialWeldM: Math.round(totalCSeamM * 10) / 10,
    totalLongitudinalWeldM: Math.round(totalLSeamM * 10) / 10,
    totalNozzleWeldM: Math.round(totalNozzleM * 10) / 10,
    totalWeldLengthM: Math.round(totalWeldLengthM * 10) / 10,
    weldCrossSectionAreaCm2: Math.round(grooveAreaCm2 * 10) / 10,
    totalWeldVolumeM3: Math.round(totalWeldVolumeM3 * 100) / 100,
    totalWeldMetalWeightKg: Math.round(totalWeldMetalWeightKg),
    pureArcHours: Math.round(pureArcHours),
    fitupAndPreheatHours: Math.round(standardTotalManHours - pureArcHours),
    standardTotalManHours,
    activeWeldingBays,
    shiftsPerDay,
    weldPassDays,
    ndtAndPwhtDays,
    hydroTestAndPaintingDays,
    scientificLeadTimeDays,
    engineerSubmittedDays,
    slackDays,
    slackPercentage,
    slackSeverity,
    slackCauses,
  };
}

/**
 * Calculates scientific production cost breakdown for W Company mega plant equipment
 */
export function calculatePlantCost(
  params: VesselPlantParams,
  analysis: WeldingLeadTimeAnalysis
): PlantCostBreakdown {
  const weightTon = params.totalWeightTon;

  // 1. Raw Steel Plate Cost (SA516-70N / Clad heavy plate @ ~2,200,000 KRW/ton + cutting allowance 10%)
  const steelUnitPricePerTon =
    params.equipmentType === 'loop_reactor' ? 3_800_000 : 2_250_000;
  const rawMaterialCostKrw = weightTon * 1.08 * steelUnitPricePerTon;

  // 2. Welding Consumables (Wire, flux, shielding gas Ar/CO2) @ ~14,000 KRW/kg of weld metal
  const weldingConsumablesCostKrw = analysis.totalWeldMetalWeightKg * 14_500;

  // 3. Labor Cost: Standard Man-Hours @ 58,000 KRW/M-H (Certified ASME IX Welder + Fitter)
  const laborWeldingCostKrw = analysis.standardTotalManHours * 58_000;

  // 4. NDT Quality & PWHT Heat Treatment
  // PWHT furnace energy & thermocouple setup + RT/PAUT scan fees
  const pwhtCost = weightTon * 280_000; // ~280k KRW / ton
  const ndtScanCost = analysis.totalWeldLengthM * 95_000; // ~95k KRW / meter of weld
  const ndtQualityCostKrw = pwhtCost + ndtScanCost;

  // 5. Machining & Internals (Trays, deflector plates, forged flange necks)
  const trayCost = (params.trayCount || 0) * 14_500_000;
  const nozzleForgingsCost = (params.nozzleCount + params.manholeCount) * 4_800_000;
  const machiningAndInternalsCostKrw = trayCost + nozzleForgingsCost;

  // 6. Transport SPMT & Ocean Barge Rigging
  // Multi-axle SPMT rental (Generic Multi-Axle 48-axle lines) + jetty load-out
  const spmtCost = weightTon > 1500 ? 1_450_000_000 : 650_000_000;
  const transportSpmtCostKrw = spmtCost;

  // 7. General Overhead & Reasonable Profit (12%)
  const subtotal =
    rawMaterialCostKrw +
    weldingConsumablesCostKrw +
    laborWeldingCostKrw +
    ndtQualityCostKrw +
    machiningAndInternalsCostKrw +
    transportSpmtCostKrw;
  const overheadAndProfitKrw = subtotal * 0.12;

  const totalScientificCostKrw = Math.round(subtotal + overheadAndProfitKrw);

  // Engineer submitted inflated cost
  const submittedEok = params.engineerSubmittedCostEok || (totalScientificCostKrw / 100_000_000) * 1.32;
  const engineerSubmittedCostKrw = Math.round(submittedEok * 100_000_000);
  const costDifferenceKrw = Math.max(0, engineerSubmittedCostKrw - totalScientificCostKrw);

  return {
    rawMaterialCostKrw: Math.round(rawMaterialCostKrw),
    weldingConsumablesCostKrw: Math.round(weldingConsumablesCostKrw),
    laborWeldingCostKrw: Math.round(laborWeldingCostKrw),
    ndtQualityCostKrw: Math.round(ndtQualityCostKrw),
    machiningAndInternalsCostKrw: Math.round(machiningAndInternalsCostKrw),
    transportSpmtCostKrw: Math.round(transportSpmtCostKrw),
    overheadAndProfitKrw: Math.round(overheadAndProfitKrw),
    totalScientificCostKrw,
    engineerSubmittedCostKrw,
    costDifferenceKrw,
  };
}

/**
 * Quality Inspection Matrix for W Company Heavy Pressure Equipment
 */
export function getStandardQualityMatrix(params: VesselPlantParams): QualityMatrixItem[] {
  return [
    {
      id: 'QM-01',
      stage: '소재 입고 검사',
      inspectionItem: '중후판 모재(SA516-70N) 초음파 탐상(UT) 및 화학성분 PMI',
      acceptanceCriteria: 'ASME SA-578 Level B, Mill Sheet 화학성분 및 충격치 합격',
      frequency: '플레이트 100% 전수',
      method: 'UT 탐상기 & 휴대용 XRF 분광기',
      status: 'COMPLETED',
      defectRateTarget: '< 0.05%',
      inspector: '품질책임자 (W Company QA)',
    },
    {
      id: 'QM-02',
      stage: '개선 가공 및 핏업',
      inspectionItem: 'C-Seam / L-Seam 그루브 베벨 각도(Double-U), 루트 간격 및 단차',
      acceptanceCriteria: '단차 Misalignment ≤ 2.0mm, 각도 15° ± 1°',
      frequency: '모든 이음부 100%',
      method: '테이퍼 게이지 & 디지털 버니어',
      status: 'COMPLETED',
      defectRateTarget: '< 0.10%',
      inspector: '제관책임자 (제관반장)',
    },
    {
      id: 'QM-03',
      stage: '용접 중 관리',
      inspectionItem: '예열온도(150℃ 유지) 및 층간온도(250℃ 이하), 탠덤 SAW 전압/전류',
      acceptanceCriteria: 'WPS-DEMO-SAW-01 관리 규격 범위 내',
      frequency: '상시 실시간 모니터링',
      method: '적외선 표면온도계 & 디지털 데이터로거',
      status: 'IN_PROGRESS',
      defectRateTarget: '< 0.15%',
      inspector: '용접책임자 (IWE 용접기술사)',
    },
    {
      id: 'QM-04',
      stage: '용접 완료 비파괴',
      inspectionItem: '100% 방사선 투과(RT) 및 위상배열 초음파(PAUT) 전수 검사',
      acceptanceCriteria: 'ASME Sec.VIII Div.1 UW-51 전수 합격 (기포, 용입불량 불가)',
      frequency: 'C-Seam, L-Seam 100% 전수',
      method: 'Ir-192 감마선 RT & Olympus OmniScan PAUT',
      status: 'IN_PROGRESS',
      defectRateTarget: '< 0.25% (현재 0.16%)',
      inspector: '가상 NDT 검사기관',
    },
    {
      id: 'QM-05',
      stage: '열처리 (PWHT)',
      inspectionItem: '용접 후 잔류응력 제거 소둔 열처리 (620℃ ± 10℃, 8.5시간 유지)',
      acceptanceCriteria: 'ASME Sec.VIII UCS-56 승온/강온 속도 규격 만족',
      frequency: '완성 쉘 전 구간',
      method: '열전대 36채널 자동 기록 차트',
      status: 'SCHEDULED',
      defectRateTarget: '0% 허용 불가',
      inspector: '열처리 전담 감리원',
    },
    {
      id: 'QM-06',
      stage: '최종 내압 시험',
      inspectionItem: '수압 시험 (Hydrostatic Test, 설계압력의 1.5배인 3.6 MPa 가압)',
      acceptanceCriteria: '가압 후 120분 유지 시 압력 강하 및 누설 제로(0)',
      frequency: '완성 기기 100%',
      method: '디지털 압력 기록계 & 수압 펌프',
      status: 'SCHEDULED',
      defectRateTarget: '누설 0건',
      inspector: '공인 검사 역할 (Demo Authorized Inspector)',
    },
  ];
}
