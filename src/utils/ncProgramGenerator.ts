import { PlateSegmentData, NcProgramResult } from '../types';

/**
 * Generates ISO/EIA 6983 G-Code for CNC Heavy Plate Gantry Cutting & Marking Machines
 * (Compatible with Messer, ESAB Vision, Koike, Daito, Tanaka controllers)
 */
export function generateIsoGCode(plate: PlateSegmentData): NcProgramResult {
  const lines: string[] = [];
  const pNo = plate.partNumber.replace(/[^A-Za-z0-9]/g, '');
  const L = plate.unfoldedLengthMm;
  const W = plate.widthMm;
  const T = plate.thicknessMm;

  let totalCutMm = 0;
  let totalMarkMm = 0;
  let pierceCount = 0;

  // Feeds
  const cutFeed = 1200; // mm/min for 85mm heavy steel (Oxy-fuel / High-def Plasma)
  const markFeed = 3800; // mm/min for Zinc powder / Laser marking head
  const rapidFeed = 15000; // mm/min

  // 1. Program Header
  lines.push(`%`);
  lines.push(`O${pNo.slice(-4) || '1001'} (WC HEAVY PLANT CNC CUTTING & SMART MARKING PROGRAM)`);
  lines.push(`(PART NO: ${plate.partNumber})`);
  lines.push(`(EQUIPMENT: ${plate.equipmentTag})`);
  lines.push(`(MATERIAL: ${plate.material} / HEAT NO: ${plate.heatNumber})`);
  lines.push(`(PLATE BLANK SIZE: ${L.toFixed(1)} x ${W.toFixed(1)} x ${T.toFixed(1)} mm / ${plate.weightTon} TON)`);
  lines.push(`(GENERATED AT: ${new Date().toISOString()})`);
  lines.push(`(CONTROLLER TARGET: ISO/EIA 6983 GANTRY CUTTER - MESSER / ESAB / KOIKE)`);
  lines.push(``);

  // 2. Machine Safe Initialization
  lines.push(`(========================================================)`);
  lines.push(`(STAGE 0: INITIALIZATION & COORDINATE SYSTEM CONFIG)`);
  lines.push(`(========================================================)`);
  lines.push(`G21 (Metric Units - Millimeters)`);
  lines.push(`G90 (Absolute Programming Coordinates)`);
  lines.push(`G92 X0.000 Y0.000 (Set Machine Work Coordinate System WCS)`);
  lines.push(`G40 (Cancel Cutter Radius Compensation)`);
  lines.push(`G80 (Cancel Canned Cycles)`);
  lines.push(`M05 (Torch / Spindle Off)`);
  lines.push(`M15 (Marking Tool Off)`);
  lines.push(``);

  // 3. Tool T02: SMART MARKING CYCLE (Zinc Powder / Inkjet / Laser Scoring)
  lines.push(`(========================================================)`);
  lines.push(`(STAGE 1: HIGH-SPEED VECTOR & TEXT SMART MARKING)`);
  lines.push(`(TOOL T02: ZINC POWDER / LASER SCORING HEAD)`);
  lines.push(`(========================================================)`);
  lines.push(`T02 M06 (Select Marking Tool)`);
  lines.push(`S1000 (Marking Intensity Setting)`);
  lines.push(`F${markFeed} (Marking Feedrate ${markFeed} mm/min)`);
  lines.push(``);

  // 3.1 Marking C-Seam Bevel Guidelines (Top edge offset 50mm, Bottom edge offset 50mm)
  lines.push(`(MARKING: C-SEAM WELD GUIDELINES & BEVEL INDICATION)`);
  lines.push(`G00 X50.000 Y50.000`);
  lines.push(`M14 (Marking Tool ON)`);
  lines.push(`G01 X${(L - 50).toFixed(3)} Y50.000 F${markFeed}`);
  lines.push(`M15 (Marking Tool OFF)`);
  totalMarkMm += (L - 100);

  lines.push(`G00 X50.000 Y${(W - 50).toFixed(3)}`);
  lines.push(`M14 (Marking Tool ON)`);
  lines.push(`G01 X${(L - 50).toFixed(3)} Y${(W - 50).toFixed(3)} F${markFeed}`);
  lines.push(`M15 (Marking Tool OFF)`);
  totalMarkMm += (L - 100);

  // 3.2 Marking L-Seam Butt Joint Guidelines (Left edge offset 50mm, Right edge offset 50mm)
  lines.push(`(MARKING: L-SEAM BUTT JOINT LINES)`);
  lines.push(`G00 X50.000 Y50.000`);
  lines.push(`M14`);
  lines.push(`G01 X50.000 Y${(W - 50).toFixed(3)}`);
  lines.push(`M15`);
  totalMarkMm += (W - 100);

  lines.push(`G00 X${(L - 50).toFixed(3)} Y50.000`);
  lines.push(`M14`);
  lines.push(`G01 X${(L - 50).toFixed(3)} Y${(W - 50).toFixed(3)}`);
  lines.push(`M15`);
  totalMarkMm += (W - 100);

  // 3.3 Marking Rolling Direction Arrows & Text
  lines.push(`(MARKING: BENDING / ROLLING DIRECTION ARROW & RADIUS)`);
  const arrowY = W * 0.75;
  const arrowXStart = L * 0.35;
  const arrowXEnd = L * 0.65;
  lines.push(`G00 X${arrowXStart.toFixed(3)} Y${arrowY.toFixed(3)}`);
  lines.push(`M14`);
  lines.push(`G01 X${arrowXEnd.toFixed(3)} Y${arrowY.toFixed(3)}`);
  lines.push(`G01 X${(arrowXEnd - 120).toFixed(3)} Y${(arrowY + 60).toFixed(3)}`);
  lines.push(`G00 X${arrowXEnd.toFixed(3)} Y${arrowY.toFixed(3)}`);
  lines.push(`G01 X${(arrowXEnd - 120).toFixed(3)} Y${(arrowY - 60).toFixed(3)}`);
  lines.push(`M15`);
  totalMarkMm += (arrowXEnd - arrowXStart) + 268;

  // Stamped Text instructions (M28 / Text Marking cycle in CNC controllers)
  lines.push(`(CNC TEXT STAMP: "ROLLING DIRECTION ➔ R=${plate.targetRadiusMm}mm - ${plate.surfaceMarkingSide}")`);
  lines.push(`G00 X${(arrowXStart + 50).toFixed(3)} Y${(arrowY + 80).toFixed(3)}`);
  lines.push(`(TEXT: MATING GUIDE TOP: "${plate.matingTopPart}")`);
  lines.push(`G00 X${(L * 0.3).toFixed(3)} Y${(W - 120).toFixed(3)}`);
  lines.push(`(TEXT: MATING GUIDE BOTTOM: "${plate.matingBottomPart}")`);
  lines.push(`G00 X${(L * 0.3).toFixed(3)} Y100.000`);
  lines.push(`(TEXT: MATING GUIDE LEFT: "${plate.matingLeftPart}")`);
  lines.push(`G00 X100.000 Y${(W * 0.5).toFixed(3)}`);
  lines.push(`(TEXT: MATING GUIDE RIGHT: "${plate.matingRightPart}")`);
  lines.push(`G00 X${(L - 600).toFixed(3)} Y${(W * 0.5).toFixed(3)}`);

  // 3.4 Marking Attachments (Tray Support Rings, Lifting Lug Pads, Pipe Clips)
  if (plate.attachments && plate.attachments.length > 0) {
    lines.push(``);
    lines.push(`(MARKING: INTERNAL / EXTERNAL ATTACHMENT FIT-UP BOUNDARIES)`);
    plate.attachments.forEach((att) => {
      lines.push(`(ATTACHMENT: ${att.label} - ${att.weldSpec})`);
      if (att.type === 'tray_support_ring') {
        lines.push(`G00 X50.000 Y${att.yMm.toFixed(3)}`);
        lines.push(`M14`);
        lines.push(`G01 X${(L - 50).toFixed(3)} Y${att.yMm.toFixed(3)}`);
        lines.push(`M15`);
        totalMarkMm += (L - 100);
      } else if (att.type === 'lifting_lug_pad' && att.widthMm && att.heightMm) {
        const x1 = att.xMm - att.widthMm / 2;
        const x2 = att.xMm + att.widthMm / 2;
        const y1 = att.yMm - att.heightMm / 2;
        const y2 = att.yMm + att.heightMm / 2;
        lines.push(`G00 X${x1.toFixed(3)} Y${y1.toFixed(3)}`);
        lines.push(`M14`);
        lines.push(`G01 X${x2.toFixed(3)} Y${y1.toFixed(3)}`);
        lines.push(`G01 X${x2.toFixed(3)} Y${y2.toFixed(3)}`);
        lines.push(`G01 X${x1.toFixed(3)} Y${y2.toFixed(3)}`);
        lines.push(`G01 X${x1.toFixed(3)} Y${y1.toFixed(3)}`);
        lines.push(`M15`);
        totalMarkMm += (att.widthMm + att.heightMm) * 2;
      } else if (att.diameterMm) {
        // Cutout Center-cross marking
        lines.push(`G00 X${(att.xMm - 100).toFixed(3)} Y${att.yMm.toFixed(3)}`);
        lines.push(`M14`);
        lines.push(`G01 X${(att.xMm + 100).toFixed(3)} Y${att.yMm.toFixed(3)}`);
        lines.push(`M15`);
        lines.push(`G00 X${att.xMm.toFixed(3)} Y${(att.yMm - 100).toFixed(3)}`);
        lines.push(`M14`);
        lines.push(`G01 X${att.xMm.toFixed(3)} Y${(att.yMm + 100).toFixed(3)}`);
        lines.push(`M15`);
        totalMarkMm += 400;
      }
    });
  }

  // 3.5 Marking QR Code Identification Block (Bottom-Right Corner)
  lines.push(``);
  lines.push(`(MARKING: QR CODE IDENTIFICATION & SERIAL BLOCK)`);
  const qrX = L - 400;
  const qrY = 150;
  lines.push(`G00 X${qrX.toFixed(3)} Y${qrY.toFixed(3)}`);
  lines.push(`M14`);
  lines.push(`G01 X${(qrX + 250).toFixed(3)} Y${qrY.toFixed(3)}`);
  lines.push(`G01 X${(qrX + 250).toFixed(3)} Y${(qrY + 250).toFixed(3)}`);
  lines.push(`G01 X${qrX.toFixed(3)} Y${(qrY + 250).toFixed(3)}`);
  lines.push(`G01 X${qrX.toFixed(3)} Y${qrY.toFixed(3)}`);
  lines.push(`M15`);
  totalMarkMm += 1000;
  lines.push(`(TEXT: QR SERIAL "${plate.qrCodeData.serialNo}")`);
  lines.push(`(TEXT: PART ID "${plate.qrCodeData.qrId}")`);
  lines.push(``);

  // 4. Tool T03: INTERNAL CUTOUTS & NOZZLE HOLE PIERCING
  const cutouts = plate.attachments.filter((a) => a.diameterMm && a.diameterMm > 0);
  if (cutouts.length > 0) {
    lines.push(`(========================================================)`);
    lines.push(`(STAGE 2: INTERNAL CUTOUT PIERCING & HOLE CUTTING)`);
    lines.push(`(TOOL T03: INTERNAL CUTTING TORCH)`);
    lines.push(`(========================================================)`);
    lines.push(`T03 M06 (Select Internal Cutting Torch)`);
    lines.push(`F${cutFeed} (Cutting Feedrate ${cutFeed} mm/min)`);
    lines.push(``);

    cutouts.forEach((cut, idx) => {
      const r = (cut.diameterMm || 200) / 2;
      const pierceX = cut.xMm;
      const pierceY = cut.yMm;
      const startX = cut.xMm + r;
      const startY = cut.yMm;

      lines.push(`(CUTOUT #${idx + 1}: ${cut.label} - DIAMETER ${cut.diameterMm}mm)`);
      lines.push(`G00 X${pierceX.toFixed(3)} Y${pierceY.toFixed(3)} (Move to Pierce Center)`);
      lines.push(`M07 (Preheat & Pierce Cycle Start - SA516-70N ${T}mm)`);
      lines.push(`G04 P3.5 (Pierce Dwell 3.5 Seconds for 85mm Steel)`);
      lines.push(`M08 (Cutting Oxygen / Plasma Gas ON)`);
      pierceCount++;

      // Lead-in line to perimeter
      lines.push(`G01 X${startX.toFixed(3)} Y${startY.toFixed(3)} F${cutFeed} (Lead-in to Cut Contour)`);
      // Full circle CCW
      lines.push(`G03 X${startX.toFixed(3)} Y${startY.toFixed(3)} I-${r.toFixed(3)} J0.000 (Cut Hole 360 Deg)`);
      // Lead-out
      lines.push(`G01 X${(startX - 20).toFixed(3)} Y${(startY + 20).toFixed(3)} (Lead-out)`);
      lines.push(`M09 (Cutting Torch OFF)`);
      lines.push(``);

      totalCutMm += 2 * Math.PI * r + r + 28;
    });
  }

  // 5. Tool T01: EXTERNAL CONTOUR CUTTING & BEVEL GROOVE PREPARATION
  lines.push(`(========================================================)`);
  lines.push(`(STAGE 3: OUTER CONTOUR & BEVEL GROOVE CUTTING)`);
  lines.push(`(TOOL T01: HEAVY GANTRY BEVEL TORCH - DOUBLE-V 60 DEG)`);
  lines.push(`(========================================================)`);
  lines.push(`T01 M06 (Select Outer Bevel Cutting Torch)`);
  lines.push(`F${cutFeed}`);
  lines.push(`A30.0 B0.0 (Tilt Torch A=30 deg for 60 deg Double-V Bevel)`);
  lines.push(``);

  // Outer Perimeter Cutting with Lead-in at Bottom-Left
  const leadInX = -30;
  const leadInY = -30;
  lines.push(`G00 X${leadInX.toFixed(3)} Y${leadInY.toFixed(3)} (Move to External Pierce Position)`);
  lines.push(`M07 (Pierce Start for Plate Outer Perimeter)`);
  lines.push(`G04 P3.8 (Pierce Dwell 3.8s)`);
  lines.push(`M08 (Cutting Gas ON)`);
  pierceCount++;

  // Lead-in to Origin (0,0)
  lines.push(`G01 X0.000 Y0.000 F${cutFeed} (Lead-in Arc to Corner)`);

  // Path: Bottom Edge (0,0) -> (L, 0)
  lines.push(`G01 X${L.toFixed(3)} Y0.000 (Bottom Circumferential C-Seam Edge)`);
  totalCutMm += L;

  // Right Edge (L, 0) -> (L, W)
  lines.push(`G01 X${L.toFixed(3)} Y${W.toFixed(3)} (Right Longitudinal L-Seam Edge)`);
  totalCutMm += W;

  // Top Edge with Poka-Yoke Notch if at Top-Left
  if (plate.pokaYokeFeatures.cornerNotchPosition === 'TOP_LEFT') {
    const notch = plate.pokaYokeFeatures.notchSizeMm;
    lines.push(`G01 X${notch.toFixed(3)} Y${W.toFixed(3)} (Top Circumferential C-Seam Edge)`);
    lines.push(`G01 X${notch.toFixed(3)} Y${(W - notch).toFixed(3)} (Poka-Yoke Anti-Error Notch Y)`);
    lines.push(`G01 X0.000 Y${(W - notch).toFixed(3)} (Poka-Yoke Anti-Error Notch X)`);
    totalCutMm += L + notch * 2;
  } else {
    lines.push(`G01 X0.000 Y${W.toFixed(3)} (Top Circumferential C-Seam Edge)`);
    totalCutMm += L;
  }

  // Left Edge -> Back to (0,0)
  lines.push(`G01 X0.000 Y0.000 (Left Longitudinal L-Seam Edge)`);
  totalCutMm += W;

  // Lead-out past corner
  lines.push(`G01 X-25.000 Y-10.000 (Lead-out Overcut)`);
  lines.push(`M09 (Torch OFF)`);
  lines.push(``);

  // 6. Program End & Safe Retract
  lines.push(`(========================================================)`);
  lines.push(`(STAGE 4: PROGRAM COMPLETE & GANTRY HOME RETRACT)`);
  lines.push(`(========================================================)`);
  lines.push(`G00 Z150.000 (Retract Torch to Safe Z Clearance)`);
  lines.push(`G00 X0.000 Y0.000 (Rapid Return to Gantry Home X0 Y0)`);
  lines.push(`M30 (End of Program & Rewind)`);
  lines.push(`%`);

  // Estimated Machining Time Calculation
  const cutTimeMin = (totalCutMm / cutFeed);
  const markTimeMin = (totalMarkMm / markFeed);
  const pierceTimeMin = (pierceCount * 3.6) / 60;
  const rapidAndToolChangeMin = 4.5;
  const estimatedCycleTimeMin = Math.round((cutTimeMin + markTimeMin + pierceTimeMin + rapidAndToolChangeMin) * 10) / 10;

  return {
    programName: `${plate.partNumber}.nc`,
    controllerFormat: 'ISO_GCODE',
    totalCutLengthM: Math.round((totalCutMm / 1000) * 10) / 10,
    totalMarkLengthM: Math.round((totalMarkMm / 1000) * 10) / 10,
    pierceCount,
    estimatedCycleTimeMin,
    codeText: lines.join('\n'),
    toolList: [
      {
        toolNo: 'T01',
        process: `Heavy Gantry Bevel Torch (Double-V 60° Bevel for ${T}mm Plate)`,
        feedrateMmpm: cutFeed,
        powerOrSetting: 'Oxy-Propane 3-Torch Heavy Rig / 400A Plasma',
      },
      {
        toolNo: 'T02',
        process: 'High-Speed Zinc-Powder / Laser Surface Scoring Marker',
        feedrateMmpm: markFeed,
        powerOrSetting: 'Zinc Flux 1.8 bar / Fiber Laser 50W',
      },
      {
        toolNo: 'T03',
        process: 'Internal Cutout Torch (Nozzle Penetration Holes)',
        feedrateMmpm: cutFeed,
        powerOrSetting: 'Preheat 3.5s / 350A HD Plasma',
      },
    ],
  };
}

/**
 * Generates ESSI Code for European/Japanese Shipbuilding & Heavy Gantry Cutters
 */
export function generateEssiCode(plate: PlateSegmentData): NcProgramResult {
  const lines: string[] = [];
  const L = Math.round(plate.unfoldedLengthMm);
  const W = Math.round(plate.widthMm);

  lines.push(`% (ESSI CUTTING & MARKING DATA - ${plate.partNumber})`);
  lines.push(`1 (PROGRAM START)`);
  lines.push(`38 (UNIT: MILLIMETERS)`);
  lines.push(`5 (RAPID TRAVERSE ON)`);
  lines.push(`+0+0+ (ORIGIN)`);

  // Tool 2 Marking
  lines.push(`63 (TOOL SELECT: MARKING)`);
  lines.push(`5 (RAPID)`);
  lines.push(`+50+50+`);
  lines.push(`7 (TOOL ON)`);
  lines.push(`6 (LINE CUT/MARK)`);
  lines.push(`+${L - 100}+0+`);
  lines.push(`8 (TOOL OFF)`);

  // Outer Contour Cut
  lines.push(`62 (TOOL SELECT: MAIN CUTTING TORCH)`);
  lines.push(`5 (RAPID)`);
  lines.push(`-30-30+`);
  lines.push(`17 (PIERCE CYCLE ON)`);
  lines.push(`7 (CUTTING OXYGEN ON)`);
  lines.push(`6 (LINE)`);
  lines.push(`+30+30+`);
  lines.push(`+${L}+0+`);
  lines.push(`+0+${W}+`);
  lines.push(`-${L}+0+`);
  lines.push(`+0-${W}+`);
  lines.push(`8 (TORCH OFF)`);
  lines.push(`5 (RAPID HOME)`);
  lines.push(`-0-0+`);
  lines.push(`0 (PROGRAM STOP & END)`);

  return {
    programName: `${plate.partNumber}.esi`,
    controllerFormat: 'ESSI_CODE',
    totalCutLengthM: Math.round(((L * 2 + W * 2) / 1000) * 10) / 10,
    totalMarkLengthM: Math.round((L / 1000) * 10) / 10,
    pierceCount: 1,
    estimatedCycleTimeMin: 28.5,
    codeText: lines.join('\n'),
    toolList: [
      {
        toolNo: 'ESSI-62',
        process: 'Oxy-Fuel / Plasma Main Cutting Torch',
        feedrateMmpm: 1200,
        powerOrSetting: 'Standard ESSI Heavy Cutting',
      },
      {
        toolNo: 'ESSI-63',
        process: 'ESSI Powder / Inkjet Marking',
        feedrateMmpm: 3500,
        powerOrSetting: 'Pneumatic Marking Unit',
      },
    ],
  };
}

/**
 * Generates Layered DXF String for CNC Nesting Software (SigmaNEST, ProNest, FastCAM, Lantek)
 */
export function generateNestingDxf(plate: PlateSegmentData): string {
  const L = plate.unfoldedLengthMm;
  const W = plate.widthMm;

  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
6
0
LAYER
2
0_OUTER_CUT
70
0
62
1
6
CONTINUOUS
0
LAYER
2
1_INNER_CUT
70
0
62
3
6
CONTINUOUS
0
LAYER
2
2_MARKING_WELD
70
0
62
4
6
DASHED
0
LAYER
2
3_MARKING_ATTACHMENT
70
0
62
5
6
CONTINUOUS
0
LAYER
2
4_MARKING_TEXT
70
0
62
7
6
CONTINUOUS
0
LAYER
2
5_QR_CODE
70
0
62
2
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // 1. Outer Cutting Contour (Layer 0_OUTER_CUT)
  const addLine = (layer: string, x1: number, y1: number, x2: number, y2: number) => {
    return `0
LINE
8
${layer}
10
${x1.toFixed(2)}
20
${y1.toFixed(2)}
30
0.0
11
${x2.toFixed(2)}
21
${y2.toFixed(2)}
31
0.0
`;
  };

  const addCircle = (layer: string, cx: number, cy: number, r: number) => {
    return `0
CIRCLE
8
${layer}
10
${cx.toFixed(2)}
20
${cy.toFixed(2)}
30
0.0
40
${r.toFixed(2)}
`;
  };

  const addText = (layer: string, x: number, y: number, height: number, text: string) => {
    return `0
TEXT
8
${layer}
10
${x.toFixed(2)}
20
${y.toFixed(2)}
30
0.0
40
${height}
1
${text}
`;
  };

  // Outer Rectangle
  dxf += addLine('0_OUTER_CUT', 0, 0, L, 0);
  dxf += addLine('0_OUTER_CUT', L, 0, L, W);
  dxf += addLine('0_OUTER_CUT', L, W, 0, W);
  dxf += addLine('0_OUTER_CUT', 0, W, 0, 0);

  // Weld Seam Markings
  dxf += addLine('2_MARKING_WELD', 50, 50, L - 50, 50);
  dxf += addLine('2_MARKING_WELD', 50, W - 50, L - 50, W - 50);
  dxf += addLine('2_MARKING_WELD', 50, 50, 50, W - 50);
  dxf += addLine('2_MARKING_WELD', L - 50, 50, L - 50, W - 50);

  // Text Markings
  dxf += addText('4_MARKING_TEXT', L * 0.35, W * 0.75, 80, `ROLLING DIRECTION --> R=${plate.targetRadiusMm}mm (${plate.surfaceMarkingSide})`);
  dxf += addText('4_MARKING_TEXT', L * 0.3, W - 140, 60, plate.matingTopPart);
  dxf += addText('4_MARKING_TEXT', L * 0.3, 100, 60, plate.matingBottomPart);
  dxf += addText('4_MARKING_TEXT', 120, W * 0.5, 60, plate.matingLeftPart);
  dxf += addText('4_MARKING_TEXT', L - 800, W * 0.5, 60, plate.matingRightPart);

  // Attachments & Cutouts
  if (plate.attachments) {
    plate.attachments.forEach((att) => {
      if (att.type === 'tray_support_ring') {
        dxf += addLine('3_MARKING_ATTACHMENT', 50, att.yMm, L - 50, att.yMm);
        dxf += addText('4_MARKING_TEXT', L * 0.4, att.yMm + 30, 50, att.label);
      } else if (att.type === 'lifting_lug_pad' && att.widthMm && att.heightMm) {
        const x1 = att.xMm - att.widthMm / 2;
        const x2 = att.xMm + att.widthMm / 2;
        const y1 = att.yMm - att.heightMm / 2;
        const y2 = att.yMm + att.heightMm / 2;
        dxf += addLine('3_MARKING_ATTACHMENT', x1, y1, x2, y1);
        dxf += addLine('3_MARKING_ATTACHMENT', x2, y1, x2, y2);
        dxf += addLine('3_MARKING_ATTACHMENT', x2, y2, x1, y2);
        dxf += addLine('3_MARKING_ATTACHMENT', x1, y2, x1, y1);
        dxf += addText('4_MARKING_TEXT', x1, y2 + 30, 40, att.label);
      } else if (att.diameterMm) {
        dxf += addCircle('1_INNER_CUT', att.xMm, att.yMm, att.diameterMm / 2);
        dxf += addText('4_MARKING_TEXT', att.xMm - 200, att.yMm - att.diameterMm / 2 - 50, 50, att.label);
      }
    });
  }

  // QR Code Block
  const qx = L - 400;
  const qy = 150;
  dxf += addLine('5_QR_CODE', qx, qy, qx + 250, qy);
  dxf += addLine('5_QR_CODE', qx + 250, qy, qx + 250, qy + 250);
  dxf += addLine('5_QR_CODE', qx + 250, qy + 250, qx, qy + 250);
  dxf += addLine('5_QR_CODE', qx, qy + 250, qx, qy);
  dxf += addText('5_QR_CODE', qx, qy - 40, 35, `QR: ${plate.qrCodeData.serialNo}`);

  dxf += `0
ENDSEC
0
EOF`;

  return dxf;
}

/**
 * Downloads a generated NC code text file to the client browser
 */
export function downloadNcFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
