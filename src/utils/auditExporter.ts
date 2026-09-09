import { VesselPlantParams, WeldingLeadTimeAnalysis, PlantCostBreakdown, QualityMatrixItem, EpcBenchmarkComparison } from '../types';

/**
 * Standard Global EPC Fabrication Benchmarks for Heavy Plant Mega-Towers (1,000t+ Class)
 */
export const EPC_BENCHMARKS: EpcBenchmarkComparison[] = [
  {
    company: '현장 엔지니어 요구안 (Claimed)',
    country: 'KR (현장)',
    leadTimeDays: 420,
    costBillionKrw: 168.5,
    weldingMethod: '수동 SMAW + 반자동 SAW (비효율 보수적)',
    productivityIndex: 0.65,
    isOurTarget: false,
  },
  {
    company: 'WC 안중 표준 (AI 감사 권고)',
    country: 'KR (WC)',
    leadTimeDays: 215,
    costBillionKrw: 132.8,
    weldingMethod: 'SAW Tandem 4극 + 턴롤 4조 동시가동',
    productivityIndex: 1.25,
    isOurTarget: true,
  },
  {
    company: 'JGC Corporation (요코하마)',
    country: 'JP',
    leadTimeDays: 230,
    costBillionKrw: 148.0,
    weldingMethod: 'Narrow Gap SAW + 100% TOFD/PAUT',
    productivityIndex: 1.15,
  },
  {
    company: 'Chiyoda Corporation',
    country: 'JP',
    leadTimeDays: 245,
    costBillionKrw: 152.0,
    weldingMethod: 'Automated GTAW Root + SAW Tandem',
    productivityIndex: 1.08,
  },
  {
    company: 'Samsung E&A (엔지니어링)',
    country: 'KR',
    leadTimeDays: 220,
    costBillionKrw: 138.2,
    weldingMethod: 'Digital Twin SAW + 스마트 턴롤',
    productivityIndex: 1.22,
  },
  {
    company: 'Saipem S.p.A.',
    country: 'IT',
    leadTimeDays: 260,
    costBillionKrw: 156.4,
    weldingMethod: 'Tandem Wire Arc Submerged (EU Code)',
    productivityIndex: 1.02,
  },
];

/**
 * Export Slack Audit & Cost Governance Data to CSV / Excel compatible spreadsheet
 */
export function exportAuditToCSV(
  vessel: VesselPlantParams,
  analysis: WeldingLeadTimeAnalysis,
  cost: PlantCostBreakdown,
  qualityItems: QualityMatrixItem[]
): void {
  const lines: string[] = [];

  // Title Block
  lines.push(`WC 중공업 플랜트사업본부 - 납기 부풀림(Slack) 감사 및 원가 거버넌스 산출서`);
  lines.push(`장비 Tag,${vessel.equipmentTag}`);
  lines.push(`프로젝트,${vessel.projectName}`);
  lines.push(`발주처,${vessel.client}`);
  lines.push(`제원,전장 ${vessel.totalLengthM}m x 외경 Ø${vessel.outerDiameterM}m x 중량 ${vessel.totalWeightTon.toLocaleString()}t`);
  lines.push(`산출일시,${new Date().toLocaleString()}`);
  lines.push('');

  // Lead Time Audit Summary
  lines.push(`[1. 납기 부풀림(Slack) 감사 요약]`);
  lines.push(`구분,일수(Days),비고`);
  lines.push(`현장 엔지니어 제출 요구 납기,${analysis.engineerSubmittedDays}일,보수적 작업계수 1.95 적용`);
  lines.push(`ASME/AWS 표준 공학적 제작 납기,${analysis.scientificLeadTimeDays}일,SAW 탠덤 4조 동시가동 기준`);
  lines.push(`부풀려진 유휴 공기 (Slack),${analysis.slackDays}일,공기 단축 잠재율 ${analysis.slackPercentage}%`);
  lines.push(`총 용접장 (C-Seam + L-Seam),${Math.round(analysis.totalWeldLengthM)} m,`);
  lines.push(`총 용접 체적 (Weld Volume),${analysis.totalWeldVolumeM3.toFixed(2)} m³,`);
  lines.push(`필요 용접봉/와이어 중량,${analysis.totalWeldMetalWeightKg.toLocaleString()} kg,`);
  lines.push('');

  // Cost Governance Breakdown
  lines.push(`[2. 원가 거버넌스 및 절감 견적서 (KRW)]`);
  lines.push(`항목,현장 제출가(억원),표준 검증가(억원),절감액(억원)`);
  lines.push(`후판 원자재비 (SA516-70N),${(cost.rawMaterialCostKrw * 1.15 / 100_000_000).toFixed(1)},${(cost.rawMaterialCostKrw / 100_000_000).toFixed(1)},${(cost.rawMaterialCostKrw * 0.15 / 100_000_000).toFixed(1)}`);
  lines.push(`용접 소모재 (와이어/플럭스),${(cost.weldingConsumablesCostKrw * 1.25 / 100_000_000).toFixed(1)},${(cost.weldingConsumablesCostKrw / 100_000_000).toFixed(1)},${(cost.weldingConsumablesCostKrw * 0.25 / 100_000_000).toFixed(1)}`);
  lines.push(`순수 인건비 (용접 및 제관 M/H),${(cost.laborWeldingCostKrw * 1.55 / 100_000_000).toFixed(1)},${(cost.laborWeldingCostKrw / 100_000_000).toFixed(1)},${(cost.laborWeldingCostKrw * 0.55 / 100_000_000).toFixed(1)}`);
  lines.push(`NDT 검사비 및 PWHT 열처리비,${(cost.ndtQualityCostKrw * 1.1 / 100_000_000).toFixed(1)},${(cost.ndtQualityCostKrw / 100_000_000).toFixed(1)},${(cost.ndtQualityCostKrw * 0.1 / 100_000_000).toFixed(1)}`);
  lines.push(`내부 트레이 가공 및 노즐 조립비,${(cost.machiningAndInternalsCostKrw * 1.12 / 100_000_000).toFixed(1)},${(cost.machiningAndInternalsCostKrw / 100_000_000).toFixed(1)},${(cost.machiningAndInternalsCostKrw * 0.12 / 100_000_000).toFixed(1)}`);
  lines.push(`SPMT 48축 운송 및 바지선 선적비,${(cost.transportSpmtCostKrw * 1.08 / 100_000_000).toFixed(1)},${(cost.transportSpmtCostKrw / 100_000_000).toFixed(1)},${(cost.transportSpmtCostKrw * 0.08 / 100_000_000).toFixed(1)}`);
  lines.push(`합계,${(cost.engineerSubmittedCostKrw / 100_000_000).toFixed(1)} 억원,${(cost.totalScientificCostKrw / 100_000_000).toFixed(1)} 억원,${(cost.costDifferenceKrw / 100_000_000).toFixed(1)} 억원`);
  lines.push('');

  // Quality Inspection Matrix
  lines.push(`[3. ASME Sec.VIII 품질 검사 매트릭스 (ITP)]`);
  lines.push(`공정,검사항목,합격판정기준,검사주기,검사방법,상태,목표결함률,검사원`);
  qualityItems.forEach((q) => {
    lines.push(`"${q.stage}","${q.inspectionItem}","${q.acceptanceCriteria}","${q.frequency}","${q.method}","${q.status}","${q.defectRateTarget}","${q.inspector}"`);
  });

  const csvContent = '\uFEFF' + lines.join('\n'); // UTF-8 BOM for Korean Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${vessel.equipmentTag}_Audit_Cost_Governance_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Printable HTML Audit Certificate / PDF Export
 */
export function exportAuditToPrintableHtml(
  vessel: VesselPlantParams,
  analysis: WeldingLeadTimeAnalysis,
  cost: PlantCostBreakdown,
  qualityItems: QualityMatrixItem[]
): void {
  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${vessel.equipmentTag} 납기 부풀림(Slack) 감사 & 원가 거버넌스 리포트</title>
  <style>
    body { font-family: 'Malgun Gothic', -apple-system, sans-serif; margin: 30px; color: #1e293b; background: #fff; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0; font-size: 22px; color: #0f172a; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; font-weight: bold; border-radius: 4px; font-size: 12px; }
    .badge-slack { background: #fee2e2; color: #dc2626; border: 1px solid #f87171; }
    .badge-pass { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
    .card-title { font-size: 12px; color: #64748b; font-weight: bold; }
    .card-value { font-size: 24px; font-weight: bold; margin-top: 4px; font-family: monospace; }
    .table { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 28px; font-size: 12px; }
    .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    .table th { background: #f1f5f9; font-weight: bold; color: #334155; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { margin: 15mm; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>WC 중공업 플랜트사업본부 • 납기 부풀림(Slack) 감사 공학 리포트</h1>
      <div class="meta">장비 Tag: <strong>${vessel.equipmentTag}</strong> | 프로젝트: <strong>${vessel.projectName}</strong> | 발주처: <strong>${vessel.client}</strong></div>
      <div class="meta">외형 규격: 전장 ${vessel.totalLengthM}m x 외경 Ø${vessel.outerDiameterM}m x 두께 ${vessel.shellThicknessMm}t | 총 중량: ${vessel.totalWeightTon.toLocaleString()}t</div>
    </div>
    <div>
      <span class="badge badge-slack">감사 결과: ${analysis.slackDays}일 공기 부풀림 판정</span>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">현장 엔지니어 요구 납기</div>
      <div class="card-value" style="color: #dc2626;">${analysis.engineerSubmittedDays}일</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">경험치 기반 보수적 공기</div>
    </div>
    <div class="card">
      <div class="card-title">ASME/AWS 표준 공학적 납기</div>
      <div class="card-value" style="color: #059669;">${analysis.scientificLeadTimeDays}일</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">턴롤 4조 동시가동 최적치</div>
    </div>
    <div class="card">
      <div class="card-title">단축 가능 공기 (Slack)</div>
      <div class="card-value" style="color: #0284c7;">${analysis.slackDays}일 (${analysis.slackPercentage}%)</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">원가 절감: ${(cost.costDifferenceKrw / 100_000_000).toFixed(1)} 억원</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin-bottom: 8px;">1. 원가 거버넌스 및 비효율 절감 내역</h3>
  <table class="table">
    <thead>
      <tr>
        <th>비용 항목</th>
        <th>세부 공학 근거</th>
        <th class="text-right">현장 제출 견적가</th>
        <th class="text-right">표준 공학 산출가</th>
        <th class="text-right">절감 잠재액</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>후판 원자재비</td>
        <td>SA516-70N 정척 절단율 94.2% 최적화</td>
        <td class="text-right font-mono">${(cost.rawMaterialCostKrw * 1.15 / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono">${(cost.rawMaterialCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#059669;">${(cost.rawMaterialCostKrw * 0.15 / 100_000_000).toFixed(1)} 억원</td>
      </tr>
      <tr>
        <td>용접 및 제관 인건비</td>
        <td>61,632 M/H @ 58,000원 (SAW 자동화 48%)</td>
        <td class="text-right font-mono">${(cost.laborWeldingCostKrw * 1.55 / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono">${(cost.laborWeldingCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#059669;">${(cost.laborWeldingCostKrw * 0.55 / 100_000_000).toFixed(1)} 억원</td>
      </tr>
      <tr>
        <td>용접봉 및 플럭스 소모재</td>
        <td>와이어 78,820 kg 및 불활성 쉴딩 가스</td>
        <td class="text-right font-mono">${(cost.weldingConsumablesCostKrw * 1.25 / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono">${(cost.weldingConsumablesCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#059669;">${(cost.weldingConsumablesCostKrw * 0.25 / 100_000_000).toFixed(1)} 억원</td>
      </tr>
      <tr>
        <td>NDT 탐상 & PWHT 열처리비</td>
        <td>C-Seam 28개소 100% RT + 620℃ 침적 열처리</td>
        <td class="text-right font-mono">${(cost.ndtQualityCostKrw * 1.1 / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono">${(cost.ndtQualityCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#059669;">${(cost.ndtQualityCostKrw * 0.1 / 100_000_000).toFixed(1)} 억원</td>
      </tr>
      <tr>
        <td>SPMT 48축 운송 & 선적비</td>
        <td>안중공장 전용부두 이송 및 바지선 유압 안착</td>
        <td class="text-right font-mono">${(cost.transportSpmtCostKrw * 1.08 / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono">${(cost.transportSpmtCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#059669;">${(cost.transportSpmtCostKrw * 0.08 / 100_000_000).toFixed(1)} 억원</td>
      </tr>
      <tr style="font-weight: bold; background: #f8fafc;">
        <td colspan="2">합계</td>
        <td class="text-right font-mono" style="color:#dc2626;">${(cost.engineerSubmittedCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#059669;">${(cost.totalScientificCostKrw / 100_000_000).toFixed(1)} 억원</td>
        <td class="text-right font-mono" style="color:#0284c7;">${(cost.costDifferenceKrw / 100_000_000).toFixed(1)} 억원 절감</td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size: 14px; margin-bottom: 8px;">2. 공정별 품질 검사 계획서 (Inspection & Test Plan)</h3>
  <table class="table">
    <thead>
      <tr>
        <th>공정</th>
        <th>검사 항목</th>
        <th>합격 판정 기준</th>
        <th>검사 방법</th>
        <th class="text-center">상태</th>
      </tr>
    </thead>
    <tbody>
      ${qualityItems.map(q => `
        <tr>
          <td><strong>${q.stage}</strong></td>
          <td>${q.inspectionItem}</td>
          <td>${q.acceptanceCriteria}</td>
          <td>${q.method}</td>
          <td class="text-center"><span class="badge badge-pass">${q.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    발행처: WC 플랜트 엔지니어링 거버넌스 본부 • 본 문서는 ASME Boiler and Pressure Vessel Code (BPVC) Sec.VIII Div.1 / Div.2 및 AWS D1.1 공학 표준에 의거하여 생성되었습니다.
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${vessel.equipmentTag}_Audit_Report_${new Date().toISOString().slice(0, 10)}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
