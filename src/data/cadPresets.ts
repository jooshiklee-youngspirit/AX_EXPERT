import { BlueprintModel, BomItem, RfpSpecification, VesselPlantParams } from '../types';

export const DEFAULT_RFP_SPEC: RfpSpecification = {
  title: 'DEMO CHEMICAL PLANT PROJECT - 초대형 워시 타워(Wash Tower) 제작 및 납기·품질 관리',
  client: '가상 EPC사 / 가상 발주사',
  projectCode: 'DEMO-EPC-PLANT-001',
  budget: '가상 예산 ₩16,500,000,000원',
  deliveryPeriod: '가상 기준공기 210일 이내 (가상 제출공기 390일 대비 검토)',
  designPressure: '2.2 MPa (수압시험 3.3 MPa)',
  designTemp: '-45 ℃ ~ +180 ℃ (극저온-고온 복합 사이클)',
  applicableStandards: [
    'ASME Boiler and Pressure Vessel Code Sec.VIII Div.1 / Div.2 (U / U2 Stamp)',
    'ASME Sec.IX (Welding and Brazing Qualifications - SAW/FCAW/GTAW)',
    'ASME B16.47 Series B (대구경 대형 플랜지 규격)',
    'API 650 / W Company Heavy Pressure Equipment Standard',
    'DEMO EPC Technical Specifications (GS-PV-001)'
  ],
  inspectionRequirements: [
    '방사선 투과 시험 (RT) 100% 전수 검사 (둘레 C-Seam 및 길이 L-Seam 이음부)',
    '위상배열 초음파 탐상 (PAUT/TOFD) 중후판 85mm 쉘 맞대기 용접부',
    '용접 후 열처리 (PWHT) 620℃ ± 10℃ 잔류응력 제거 소둔 (8.5시간 유지)',
    '수압 내압 시험 (Hydrostatic Test @ 3.6 MPa 120분 누설 제로 검증)',
    '페라이트 함량(FN 3~8) 및 휴대용 XRF(PMI) 재질 전수 합격 판정'
  ],
  surfaceTreatment: '외면 쇼트 블라스팅 SSPC-SP10 (Near-White), 징크 프라이머 75μm + 에폭시 타이코트 + 우레탄 상도 도장',
  weldingRequirements: '탠덤 SAW (2-Wire Submerged Arc Welding) 4개 턴롤 베이 병렬 가동, 예열 150℃ 항온 유지, 층간온도 250℃ 이하'
};

export const PRESET_BLUEPRINTS: BlueprintModel[] = [
  {
    id: 'demo-wash-tower-101m',
    name: 'W Company 96.0m 초대형 워시 타워 (DEMO CHEMICAL PLANT PROJECT)',
    category: '초대형 타워 / 컬럼 (W Company)',
    description: '가상 프로젝트를 위한 전장 96.0m, 외경 10.2m, 총중량 1,680톤 초대형 세척탑. 82mm 중후판 30캔 롤링, 2:1 타원형 경판, 트레이 84단, 노즐 42개소.',
    params: {
      outerDiameter: 10200,
      pitchCircleDiameter: 10400,
      boltHoleCount: 96,
      boltHoleDiameter: 48,
      bossDiameter: 3200,
      innerDiameter: 2400,
      totalHeight: 96000,
      flangeThickness: 120,
      raisedFaceDiameter: 4200,
      raisedFaceHeight: 10
    },
    vesselParams: {
      equipmentType: 'wash_tower',
      equipmentTag: 'DEMO-V-001 (WASH TOWER)',
      projectName: 'DEMO CHEMICAL PLANT PROJECT',
      client: 'DEMO EPC / DEMO CLIENT',
      fabricator: 'W Company',
      totalLengthM: 96.0,
      outerDiameterM: 10.8,
      totalHeightM: 11.4,
      totalWeightTon: 1680,
      shellThicknessMm: 82,
      headThicknessMm: 92,
      shellCanCount: 30,
      headType: 'ellipsoidal_2_1',
      trayCount: 72,
      nozzleCount: 36,
      manholeCount: 12,
      skirtHeightM: 7.5,
      skirtThicknessMm: 55,
      designPressureMpa: 2.2,
      designTempC: 180,
      hydroTestPressureMpa: 3.3,
      corrosionAllowanceMm: 3.0,
      weldGrooveType: 'Double-U',
      weldingProcessMain: 'SAW (Tandem)',
      engineerSubmittedDays: 390,
      engineerSubmittedCostEok: 165
    },
    material: 'sa516_70n',
    surfaceFinish: 'SSPC-SP10 Blast / Heavy-duty High Epoxy 300μm',
    standard: 'ASME Sec.VIII Div.1 & Div.2 / U2 Stamp',
    rfpTitle: DEFAULT_RFP_SPEC.title,
    rfpClient: DEFAULT_RFP_SPEC.client,
    rfpBudget: DEFAULT_RFP_SPEC.budget
  },
  {
    id: 'demo-eoeg-column-55m',
    name: 'W Company 55m 에틸렌 글리콜 분리탑 (Demo Distillation Column)',
    category: '정밀 증류 컬럼',
    description: 'W Company 대표 화공 분리 설비. 전장 55.0m, 직경 6.8m, 중량 780톤, 쉘 두께 65mm, 트레이 54단.',
    params: {
      outerDiameter: 6800,
      pitchCircleDiameter: 6500,
      boltHoleCount: 64,
      boltHoleDiameter: 36,
      bossDiameter: 2200,
      innerDiameter: 1600,
      totalHeight: 55000,
      flangeThickness: 90,
      raisedFaceDiameter: 2800,
      raisedFaceHeight: 8
    },
    vesselParams: {
      equipmentType: 'distillation_column',
      equipmentTag: 'DEMO-COL-002 (DEMO COLUMN)',
      projectName: 'DEMO REFINERY PROJECT B',
      client: 'DEMO EPC B / DEMO CLIENT B',
      fabricator: 'W Company',
      totalLengthM: 55.0,
      outerDiameterM: 6.8,
      totalHeightM: 7.4,
      totalWeightTon: 780,
      shellThicknessMm: 65,
      headThicknessMm: 75,
      shellCanCount: 18,
      headType: 'ellipsoidal_2_1',
      trayCount: 54,
      nozzleCount: 28,
      manholeCount: 8,
      skirtHeightM: 5.5,
      skirtThicknessMm: 45,
      designPressureMpa: 1.8,
      designTempC: 150,
      hydroTestPressureMpa: 2.7,
      corrosionAllowanceMm: 3.0,
      weldGrooveType: 'Double-V',
      weldingProcessMain: 'SAW (Tandem)',
      engineerSubmittedDays: 280,
      engineerSubmittedCostEok: 88
    },
    material: 'clad_steel',
    surfaceFinish: 'Internal Ra 0.8 μm / External Marine Paint',
    standard: 'ASME Sec.VIII Div.1 / KS B 6750'
  },
  {
    id: 'demo-loop-reactor-38m',
    name: 'W Company 고압 중후판 화학 반응기 (Heavy Loop Reactor)',
    category: '고압 화학 반응기',
    description: '셰일가스 및 폴리머 합성용 특수 초고압 반응기. 전장 38.5m, 직경 4.6m, 중량 920톤, 쉘 두께 135mm 초중후판 단조재 접합.',
    params: {
      outerDiameter: 4600,
      pitchCircleDiameter: 4300,
      boltHoleCount: 48,
      boltHoleDiameter: 42,
      bossDiameter: 1800,
      innerDiameter: 1200,
      totalHeight: 38500,
      flangeThickness: 160,
      raisedFaceDiameter: 2200,
      raisedFaceHeight: 12
    },
    vesselParams: {
      equipmentType: 'loop_reactor',
      equipmentTag: 'DEMO-RX-003 (LOOP REACTOR)',
      projectName: 'DEMO REACTOR PROJECT C',
      client: 'DEMO EPC C / DEMO CLIENT C',
      fabricator: 'W Company',
      totalLengthM: 38.5,
      outerDiameterM: 4.6,
      totalHeightM: 5.2,
      totalWeightTon: 920,
      shellThicknessMm: 135,
      headThicknessMm: 150,
      shellCanCount: 14,
      headType: 'hemispherical',
      trayCount: 12,
      nozzleCount: 36,
      manholeCount: 6,
      skirtHeightM: 4.8,
      skirtThicknessMm: 70,
      designPressureMpa: 5.8,
      designTempC: 280,
      hydroTestPressureMpa: 8.7,
      corrosionAllowanceMm: 4.0,
      weldGrooveType: 'Narrow-Gap',
      weldingProcessMain: 'SAW (Tandem)',
      engineerSubmittedDays: 320,
      engineerSubmittedCostEok: 125
    },
    material: 'sa516_70n',
    surfaceFinish: 'Internal Overlay 3.2mm Alloy 625 Clad',
    standard: 'ASME Sec.VIII Div.2 Class 2 (Heavy Wall Reactor)'
  },
  {
    id: 'demo-heat-exchanger-18m',
    name: 'W Company TEMA R 대형 쉘앤튜브 열교환기 (Heat Exchanger)',
    category: '대형 열교환기',
    description: 'API 660 규격 정유 플랜트용 대형 고압 열교환기. 전장 16.5m, 직경 2.8m, 중량 240톤, 튜브 2,800본, 튜브시트 중후판.',
    params: {
      outerDiameter: 2800,
      pitchCircleDiameter: 2600,
      boltHoleCount: 36,
      boltHoleDiameter: 32,
      bossDiameter: 1200,
      innerDiameter: 800,
      totalHeight: 16500,
      flangeThickness: 85,
      raisedFaceDiameter: 1500,
      raisedFaceHeight: 6
    },
    vesselParams: {
      equipmentType: 'heat_exchanger',
      equipmentTag: 'DEMO-HX-004 (HEAVY REBOILER EXCHANGER)',
      projectName: 'DEMO HEAT EXCHANGER PROJECT D',
      client: 'DEMO EPC D / DEMO CLIENT D',
      fabricator: 'W Company',
      totalLengthM: 16.5,
      outerDiameterM: 2.8,
      totalHeightM: 3.4,
      totalWeightTon: 240,
      shellThicknessMm: 48,
      headThicknessMm: 55,
      shellCanCount: 8,
      headType: 'torispherical',
      trayCount: 0,
      nozzleCount: 16,
      manholeCount: 2,
      skirtHeightM: 2.2,
      skirtThicknessMm: 30,
      designPressureMpa: 3.2,
      designTempC: 220,
      hydroTestPressureMpa: 4.8,
      corrosionAllowanceMm: 3.0,
      weldGrooveType: 'Double-V',
      weldingProcessMain: 'SAW (Tandem)',
      engineerSubmittedDays: 160,
      engineerSubmittedCostEok: 34
    },
    material: 'sus316l',
    surfaceFinish: 'Tube Sheet Precision CNC Drilled / Mill Ra 1.6',
    standard: 'TEMA Class R / API 660 / ASME Sec.VIII Div.1'
  },
  {
    id: 'flange-190',
    name: 'Weld Neck 노즐 플랜지 (KS 10K 100A / Demo Client Lab Nozzle)',
    category: '배관 및 노즐 단품',
    description: '타워 및 저장탱크 상부 인렛 노즐 플랜지. OD Ø190, PCD Ø160, 8-Ø12 볼트홀, 전체 높이 74mm',
    params: {
      outerDiameter: 190,
      pitchCircleDiameter: 160,
      boltHoleCount: 8,
      boltHoleDiameter: 12,
      bossDiameter: 60,
      innerDiameter: 38,
      totalHeight: 74,
      flangeThickness: 24,
      raisedFaceDiameter: 130,
      raisedFaceHeight: 2
    },
    material: 'sus316l',
    surfaceFinish: 'Ra 1.6 μm (가공면) / Ra 0.4 μm (내경 접액부)',
    standard: 'KS B 1503 / ASME B16.5 Class 150'
  }
];

export function calculateBOM(blueprint: BlueprintModel): BomItem[] {
  // If this is a W Company Mega Vessel
  if (blueprint.vesselParams) {
    const vp = blueprint.vesselParams;
    const steelPriceTon = vp.equipmentType === 'loop_reactor' ? 3_800_000 : 2_250_000;
    const rawSteelWeight = Math.round(vp.totalWeightTon * 1.08); // 8% cutting allowance

    return [
      {
        id: 'bom-vessel-1',
        partNo: 'DEMO-SHELL-PL-01',
        name: `${vp.equipmentTag} 쉘 및 2:1 타원형 경판 중후판 강재`,
        standard: 'ASME SA-516 Gr.70N / SA-240 316L Clad',
        spec: `두께 ${vp.shellThicknessMm}t ~ ${vp.headThicknessMm}t x 캔 ${vp.shellCanCount}개 롤벤딩재`,
        material: blueprint.material.toUpperCase(),
        quantity: 1,
        unitWeightKg: rawSteelWeight * 1000,
        totalWeightKg: rawSteelWeight * 1000,
        unitPriceKrw: rawSteelWeight * steelPriceTon,
        totalPriceKrw: rawSteelWeight * steelPriceTon,
        process: '초대형 4롤 벤딩(Rolling), CNC 개선 베벨 가공, 원형 성형'
      },
      {
        id: 'bom-vessel-2',
        partNo: 'DEMO-WELD-CONSUM-01',
        name: '용접봉, 탠덤 SAW 와이어 & 플럭스 (Lincoln/KOBELCO)',
        standard: 'AWS A5.17 / ASME SFA-5.17 F7A4-EH14',
        spec: `와이어 Ø4.0mm + 중성 소결 플럭스 (예상 용착량 비례)`,
        material: 'High-Toughness Low-Alloy / Low-Temp Spec',
        quantity: Math.round(vp.totalWeightTon * 12.5),
        unitWeightKg: 1,
        totalWeightKg: Math.round(vp.totalWeightTon * 12.5),
        unitPriceKrw: 14500,
        totalPriceKrw: Math.round(vp.totalWeightTon * 12.5 * 14500),
        process: '150℃ 항온 베이킹, 탠덤 SAW 자동 용접 및 FCAW 백가우징 충전'
      },
      {
        id: 'bom-vessel-3',
        partNo: 'DEMO-LABOR-WELD-01',
        name: 'ASME Sec.IX 공인 용접사 및 제관 조립 표준 공수 (M/H)',
        standard: 'ASME Sec.IX WPS/PQR 등록 공법',
        spec: `4개 베이 탠덤 SAW 회전 턴롤(Turn-roll) 연속 자동 용접`,
        material: 'Certified Welders',
        quantity: Math.round(vp.totalWeightTon * 32),
        unitWeightKg: 0,
        totalWeightKg: 0,
        unitPriceKrw: 58000,
        totalPriceKrw: Math.round(vp.totalWeightTon * 32 * 58000),
        process: '루트 TIG 백패스 + 탠덤 SAW 메인 캡패스 + 층간 백가우징'
      },
      {
        id: 'bom-vessel-4',
        partNo: 'DEMO-INTERNALS-01',
        name: `내부 부속물 (트레이 ${vp.trayCount}단 서포트 링 및 다운코머)`,
        standard: 'DEMO EPC GS-PV-001',
        spec: `외경 Ø${vp.outerDiameterM}m 316L 앵글 링 84개소 및 패킹 클램프`,
        material: 'SUS316L',
        quantity: vp.trayCount || 1,
        unitWeightKg: 350,
        totalWeightKg: (vp.trayCount || 1) * 350,
        unitPriceKrw: 12500000,
        totalPriceKrw: (vp.trayCount || 1) * 12500000,
        process: '레이저 정밀 절단, 트레이 레벨 공차 ±1.5mm 용접 취부'
      },
      {
        id: 'bom-vessel-5',
        partNo: 'DEMO-NDT-PWHT-01',
        name: '100% 방사선 투과(RT), PAUT 및 대형 노 내 소둔 열처리(PWHT)',
        standard: 'ASME Sec.VIII UCS-56 / ASME Sec.V',
        spec: `620℃ 균열 소둔 열처리 + 둘레/길이 심 전수 NDT 공인 검사`,
        material: 'Inspection & Heat Treatment',
        quantity: 1,
        unitWeightKg: 0,
        totalWeightKg: 0,
        unitPriceKrw: Math.round(vp.totalWeightTon * 380000),
        totalPriceKrw: Math.round(vp.totalWeightTon * 380000),
        process: '대형 밀폐로 8.5시간 침적 유지, 디지털 감마선 100% 탐상 판독'
      },
      {
        id: 'bom-vessel-6',
        partNo: 'DEMO-SPMT-LOGISTICS-01',
        name: '다축형 48축 유압식 SPMT 육상 운송 및 항만 바지선 선적',
        standard: 'W Company 데모 제작공장 전용 운송 프로토콜',
        spec: `${vp.totalWeightTon}톤급 모듈 트랜스포터 유압 밸런싱 및 바지선 바인딩`,
        material: 'Special Heavy Logistics',
        quantity: 1,
        unitWeightKg: 0,
        totalWeightKg: 0,
        unitPriceKrw: vp.totalWeightTon > 1500 ? 1450000000 : 650000000,
        totalPriceKrw: vp.totalWeightTon > 1500 ? 1450000000 : 650000000,
        process: '가상 항만 데모 제작공장 전용 부두 직선 이동 및 해상 선적 고정(Lashing)'
      }
    ];
  }

  // Fallback for smaller single flange items
  const p = blueprint.params;
  const rFlange = p.outerDiameter / 2 / 10;
  const rBoss = p.bossDiameter / 2 / 10;
  const rBore = p.innerDiameter / 2 / 10;
  const rBolt = p.boltHoleDiameter / 2 / 10;
  const tFlange = p.flangeThickness / 10;
  const hBoss = (p.totalHeight - p.flangeThickness) / 10;

  const flangeVol = Math.PI * (rFlange * rFlange - rBore * rBore) * tFlange - p.boltHoleCount * Math.PI * (rBolt * rBolt) * tFlange;
  const bossVol = Math.PI * (rBoss * rBoss - rBore * rBore) * hBoss;
  const totalVolCm3 = Math.max(10, flangeVol + bossVol);

  const density = blueprint.material === 'sus316l' ? 7.98 : 7.85;
  const weightKg = Number(((totalVolCm3 * density) / 1000).toFixed(2));

  return [
    {
      id: 'bom-1',
      partNo: 'MFG-WN-001',
      name: `${blueprint.name} 바디 단조재`,
      standard: blueprint.standard,
      spec: `OD Ø${p.outerDiameter} x ID Ø${p.innerDiameter} x H${p.totalHeight}`,
      material: blueprint.material.toUpperCase(),
      quantity: 1,
      unitWeightKg: weightKg,
      totalWeightKg: weightKg,
      unitPriceKrw: Math.round(weightKg * 28000 + 120000),
      totalPriceKrw: Math.round(weightKg * 28000 + 120000),
      process: 'CNC 정밀 선반 턴/밀 복합 가공, 내경 보링, 플랜지 페이싱'
    }
  ];
}
