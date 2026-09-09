import { PlateSegmentData, NcProgramResult } from '../types';

/**
 * Generates industry-standard ISO 6983 G-code for heavy CNC plate cutting
 * and marking machines (Messer, ESAB, Koike, Farley, Bystronic).
 * Handles Plasma/Oxy-fuel Cutting (Tool 1), Plasma/Inkjet Marking (Tool 2),
 * and Triple-Torch / Bevel Unit Tilting (M07/M08).
 */
export function generatePlateGCode(plate: PlateSegmentData): NcProgramResult {
  const L = plate.unfoldedLengthMm;
  const W = plate.widthMm;
  const T = plate.thicknessMm;
  const partNo = plate.partNumber;

  const lines: string[] = [];
  let cutLengthMm = 0;
  let markLengthMm = 0;
  let pierces = 0;

  // Header & Machine Setup
  lines.push(`%`);
  lines.push(`(========================================================)`);
  lines.push(`( PROGRAM NAME: ${partNo}.NC )`);
  lines.push(`( EQUIPMENT: ${plate.equipmentTag} )`);
  lines.push(`( MATERIAL: ${plate.material} - HEAT: ${plate.heatNumber} )`);
  lines.push(`( THICKNESS: ${T}mm | SIZE: ${L.toFixed(1)}mm x ${W.toFixed(1)}mm )`);
  lines.push(`( TARGET ROLLING RADIUS: R=${plate.targetRadiusMm}mm )`);
  lines.push(`( GENERATED FOR: HEAVY CNC BEVEL CUTTER & MARKING GANTRY )`);
  lines.push(`( CONTROLLER: ISO 6983 G-CODE STANDARD )`);
  lines.push(`( DATE: ${new Date().toISOString()} )`);
  lines.push(`(========================================================)`);
  lines.push(`G21 (Metric Units mm)`);
  lines.push(`G90 (Absolute Programming)`);
  lines.push(`G94 (Feedrate in mm/min)`);
  lines.push(`G40 (Cutter Radius Compensation Cancel)`);
  lines.push(`G80 (Cancel Canned Cycles)`);
  lines.push(``);

  // SECTION 1: INKJET / LASER TEXT MARKING (Tool 2)
  lines.push(`(--- PROCESS 1: SURFACE PART IDENTIFICATION & TEXT MARKING ---)`);
  lines.push(`T02 M06 (Tool 02: High-Speed Inkjet / Micro-Punch Marking Head)`);
  lines.push(`F3500 (Marking Feedrate: 3,500 mm/min)`);
  lines.push(`G00 X500.0 Y300.0 (Rapid to Text Block Start)`);
  lines.push(`M03 S1 (Marking Head ON)`);
  lines.push(`(TEXT: "WC | ${plate.equipmentTag}")`);
  lines.push(`(TEXT: "PART: ${partNo} | THK: ${T}mm | HEAT: ${plate.heatNumber}")`);
  lines.push(`(TEXT: "ROLLING DIR: ${plate.rollingDirection} -> R=${plate.targetRadiusMm}mm [${plate.surfaceMarkingSide}]")`);
  lines.push(`(TEXT: "MATING TOP: ${plate.matingTopPart}")`);
  lines.push(`(TEXT: "MATING BTM: ${plate.matingBottomPart}")`);
  lines.push(`(TEXT: "QR CODE MATRIX: ${plate.qrCodeData.qrId} / REV.${plate.qrCodeData.rev}")`);
  lines.push(`M05 (Marking Head OFF)`);
  markLengthMm += 1800;

  // SECTION 2: WELDING SEAM, BEVEL GUIDES & ROLLING DIRECTION LINES
  lines.push(``);
  lines.push(`(--- PROCESS 2: WELD SEAM & ROLLING DIRECTION GUIDE LINE MARKING ---)`);
  lines.push(`F2800 (Marking Line Feedrate: 2,800 mm/min)`);
  
  // Rolling direction centerline
  lines.push(`(MARK: Rolling Direction Center Arrow)`);
  lines.push(`G00 X${(L * 0.25).toFixed(1)} Y${(W * 0.5).toFixed(1)}`);
  lines.push(`M03 S1`);
  lines.push(`G01 X${(L * 0.75).toFixed(1)} Y${(W * 0.5).toFixed(1)}`);
  lines.push(`G01 X${(L * 0.75 - 150).toFixed(1)} Y${(W * 0.5 + 80).toFixed(1)}`);
  lines.push(`G00 X${(L * 0.75).toFixed(1)} Y${(W * 0.5).toFixed(1)}`);
  lines.push(`G01 X${(L * 0.75 - 150).toFixed(1)} Y${(W * 0.5 - 80).toFixed(1)}`);
  lines.push(`M05`);
  markLengthMm += (L * 0.5) + 360;

  // Top C-Seam offset guide line (100mm offset for inspection gauge)
  lines.push(`(MARK: Top C-Seam Inspection Reference Offset Line)`);
  lines.push(`G00 X100.0 Y${(W - 100.0).toFixed(1)}`);
  lines.push(`M03 S1`);
  lines.push(`G01 X${(L - 100.0).toFixed(1)} Y${(W - 100.0).toFixed(1)}`);
  lines.push(`M05`);
  markLengthMm += (L - 200);

  // Bottom C-Seam offset guide line
  lines.push(`(MARK: Bottom C-Seam Inspection Reference Offset Line)`);
  lines.push(`G00 X100.0 Y100.0`);
  lines.push(`M03 S1`);
  lines.push(`G01 X${(L - 100.0).toFixed(1)} Y100.0`);
  lines.push(`M05`);
  markLengthMm += (L - 200);

  // SECTION 3: ATTACHMENT FIT-UP & TRAY RING MARKINGS
  if (plate.attachments && plate.attachments.length > 0) {
    lines.push(``);
    lines.push(`(--- PROCESS 3: INTERNAL/EXTERNAL ATTACHMENT FIT-UP MARKINGS ---)`);
    plate.attachments.forEach((att, idx) => {
      lines.push(`(MARK ATTACHMENT #${idx + 1}: ${att.label} [${att.orientation}])`);
      if (att.type === 'tray_support_ring') {
        lines.push(`G00 X0.0 Y${att.yMm.toFixed(1)}`);
        lines.push(`M03 S1`);
        lines.push(`G01 X${L.toFixed(1)} Y${att.yMm.toFixed(1)}`);
        lines.push(`M05`);
        markLengthMm += L;
      } else if (att.diameterMm) {
        // Circle / Nozzle cutout center mark & pitch circle
        lines.push(`G00 X${att.xMm.toFixed(1)} Y${att.yMm.toFixed(1)} (Center Point Punch)`);
        lines.push(`M03 S2 (Center Punch Strike)`);
        lines.push(`G04 P200 (Dwell 0.2s)`);
        lines.push(`M05`);
        lines.push(`G00 X${(att.xMm + att.diameterMm / 2).toFixed(1)} Y${att.yMm.toFixed(1)}`);
        lines.push(`M03 S1`);
        lines.push(`G02 X${(att.xMm + att.diameterMm / 2).toFixed(1)} Y${att.yMm.toFixed(1)} I-${(att.diameterMm / 2).toFixed(1)} J0.0`);
        lines.push(`M05`);
        markLengthMm += Math.PI * att.diameterMm;
      } else if (att.widthMm && att.heightMm) {
        // Rectangular pad outline
        const x1 = att.xMm - att.widthMm / 2;
        const y1 = att.yMm - att.heightMm / 2;
        const x2 = att.xMm + att.widthMm / 2;
        const y2 = att.yMm + att.heightMm / 2;
        lines.push(`G00 X${x1.toFixed(1)} Y${y1.toFixed(1)}`);
        lines.push(`M03 S1`);
        lines.push(`G01 X${x2.toFixed(1)} Y${y1.toFixed(1)}`);
        lines.push(`G01 X${x2.toFixed(1)} Y${y2.toFixed(1)}`);
        lines.push(`G01 X${x1.toFixed(1)} Y${y2.toFixed(1)}`);
        lines.push(`G01 X${x1.toFixed(1)} Y${y1.toFixed(1)}`);
        lines.push(`M05`);
        markLengthMm += (att.widthMm + att.heightMm) * 2;
      }
    });
  }

  // SECTION 4: NOZZLE INTERNAL CUTOUTS (Tool 1: Heavy Oxy-fuel / Plasma Cut)
  const cutouts = plate.attachments.filter(a => a.type === 'nozzle_cutout' && a.diameterMm);
  if (cutouts.length > 0) {
    lines.push(``);
    lines.push(`(--- PROCESS 4: INTERNAL NOZZLE HOLE CUTOUTS ---)`);
    lines.push(`T01 M06 (Tool 01: Heavy Plasma / Triple-Bevel Torch)`);
    lines.push(`M07 (Bevel Tilt Unit Active)`);

    cutouts.forEach((co) => {
      const radius = co.diameterMm! / 2;
      const leadIn = 30; // 30mm lead-in
      lines.push(`(CUTOUT: ${co.label} - DIA: ${co.diameterMm}mm)`);
      lines.push(`G00 X${co.xMm.toFixed(1)} Y${(co.yMm - radius + leadIn).toFixed(1)} (Lead-in Point)`);
      lines.push(`M08 (Plasma Arc Ignition & Pierce)`);
      lines.push(`G04 P2500 (Pierce Dwell 2.5s for ${T}mm Plate)`);
      lines.push(`F450 (Cutting Feedrate: 450 mm/min)`);
      lines.push(`G01 X${co.xMm.toFixed(1)} Y${(co.yMm - radius).toFixed(1)} (Touch Contour)`);
      lines.push(`G02 X${co.xMm.toFixed(1)} Y${(co.yMm - radius).toFixed(1)} I0.0 J${radius.toFixed(1)} (Full Circle Cut)`);
      lines.push(`G01 X${(co.xMm + 20).toFixed(1)} Y${(co.yMm - radius).toFixed(1)} (Lead-out)`);
      lines.push(`M09 (Plasma Arc OFF)`);
      cutLengthMm += Math.PI * co.diameterMm! + 50;
      pierces += 1;
    });
  }

  // SECTION 5: OUTER CONTOUR WITH DOUBLE-V BEVEL CUTTING
  lines.push(``);
  lines.push(`(--- PROCESS 5: PERIMETER CONTOUR CUTTING WITH BEVEL ---)`);
  lines.push(`(BEVEL SPEC: Circumferential=${plate.circumferentialWeldBevel}, Longitudinal=${plate.longitudinalWeldBevel})`);
  lines.push(`T01 M06`);
  lines.push(`G00 X-40.0 Y-40.0 (Lead-in Start)`);
  lines.push(`M08 (Pierce Outer Contour)`);
  lines.push(`G04 P3000 (Heavy Pierce Dwell 3.0s)`);
  lines.push(`F420 (Bevel Cutting Feed: 420 mm/min)`);
  lines.push(`G01 X0.0 Y0.0 (Corner Origin 0,0)`);
  
  // Poka-Yoke Notch handling (if top-left)
  if (plate.pokaYokeFeatures.cornerNotchPosition === 'TOP_LEFT') {
    lines.push(`G01 X${L.toFixed(1)} Y0.0 (Bottom Edge - Longitudinal/Circumferential)`);
    lines.push(`G01 X${L.toFixed(1)} Y${W.toFixed(1)} (Right Edge)`);
    lines.push(`G01 X${(plate.pokaYokeFeatures.notchSizeMm).toFixed(1)} Y${W.toFixed(1)} (Top Edge toward Notch)`);
    lines.push(`G01 X${(plate.pokaYokeFeatures.notchSizeMm).toFixed(1)} Y${(W - plate.pokaYokeFeatures.notchSizeMm).toFixed(1)} (Notch Inner Step)`);
    lines.push(`G01 X0.0 Y${(W - plate.pokaYokeFeatures.notchSizeMm).toFixed(1)} (Notch Return)`);
    lines.push(`G01 X0.0 Y0.0 (Left Edge to Origin)`);
  } else {
    lines.push(`G01 X${L.toFixed(1)} Y0.0`);
    lines.push(`G01 X${L.toFixed(1)} Y${W.toFixed(1)}`);
    lines.push(`G01 X0.0 Y${W.toFixed(1)}`);
    lines.push(`G01 X0.0 Y0.0`);
  }
  lines.push(`G01 X-30.0 Y-30.0 (Lead-out)`);
  lines.push(`M09 (Torch OFF)`);
  lines.push(`M05`);
  cutLengthMm += (L + W) * 2;
  pierces += 1;

  // Program End
  lines.push(``);
  lines.push(`(--- PROCESS COMPLETE: PARK GANTRY & POWER OFF ---)`);
  lines.push(`G00 Z150.0 (Retract Torch to Safe Z)`);
  lines.push(`G00 X0.0 Y${(W + 500).toFixed(1)} (Park Gantry Clear of Plate)`);
  lines.push(`M30 (Program End & Rewind)`);
  lines.push(`%`);

  const totalCutM = cutLengthMm / 1000;
  const totalMarkM = markLengthMm / 1000;
  const estimatedMin = Math.round((cutLengthMm / 420) + (markLengthMm / 3000) + (pierces * 0.5) + 5);

  return {
    programName: `${partNo}.NC`,
    controllerFormat: 'ISO_GCODE',
    totalCutLengthM: Number(totalCutM.toFixed(1)),
    totalMarkLengthM: Number(totalMarkM.toFixed(1)),
    pierceCount: pierces,
    estimatedCycleTimeMin: estimatedMin,
    codeText: lines.join('\n'),
    toolList: [
      { toolNo: 'T01', process: 'Heavy Oxy/Plasma Bevel Cutter (60° Double-V)', feedrateMmpm: 420, powerOrSetting: '300A / 120V (O2/Air)' },
      { toolNo: 'T02', process: 'High-Resolution Inkjet / Laser Marking Unit', feedrateMmpm: 3500, powerOrSetting: 'High-Contrast White Ink (Heat Resistant 800℃)' },
    ],
  };
}

/**
 * Generates ESSI code (European System for Numerical Control)
 * still widely used in heavy shipbuilding and pressure vessel fabrication yards.
 */
export function generatePlateEssiCode(plate: PlateSegmentData): NcProgramResult {
  const L = Math.round(plate.unfoldedLengthMm);
  const W = Math.round(plate.widthMm);

  const lines: string[] = [];
  lines.push(`%`);
  lines.push(`1 (ESSI PROGRAM: ${plate.partNumber})`);
  lines.push(`2 (MATERIAL: ${plate.material} ${plate.thicknessMm}mm)`);
  lines.push(`5 (RAPID TRANSIT)`);
  lines.push(`+500+300-`);
  lines.push(`7 (MARKING ON)`);
  lines.push(`+1000+0-`);
  lines.push(`+0+200-`);
  lines.push(`8 (MARKING OFF)`);
  lines.push(`5 (RAPID TRANSIT TO ORIGIN)`);
  lines.push(`+0+0-`);
  lines.push(`6 (FLAME/PLASMA ON)`);
  lines.push(`+${L}+0-`);
  lines.push(`+0+${W}-`);
  lines.push(`-${L}+0-`);
  lines.push(`+0-${W}-`);
  lines.push(`7 (FLAME/PLASMA OFF)`);
  lines.push(`5 (PARK GANTRY)`);
  lines.push(`+0+${W + 500}-`);
  lines.push(`38 (PROGRAM STOP)`);
  lines.push(`%`);

  return {
    programName: `${plate.partNumber}.ESI`,
    controllerFormat: 'ESSI_CODE',
    totalCutLengthM: Number((((L + W) * 2) / 1000).toFixed(1)),
    totalMarkLengthM: 1.2,
    pierceCount: 1,
    estimatedCycleTimeMin: Math.round(((L + W) * 2) / 420 + 4),
    codeText: lines.join('\n'),
    toolList: [
      { toolNo: 'T01', process: 'ESSI Standard Flame/Plasma Cutter', feedrateMmpm: 420, powerOrSetting: 'Standard ESSI Arc' },
    ],
  };
}

/**
 * Generates layered CAD DXF file containing the unfolded plate geometry,
 * cut contour, bevel annotation layers, and marking texts.
 */
export function generatePlateDxf(plate: PlateSegmentData): string {
  const L = plate.unfoldedLengthMm;
  const W = plate.widthMm;

  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n`;
  dxf += `0\nLAYER\n2\nCUT_OUTER\n62\n7\n0\n`;
  dxf += `0\nLAYER\n2\nMARK_BEVEL_SEAM\n62\n1\n0\n`; // Red
  dxf += `0\nLAYER\n2\nMARK_ATTACHMENT\n62\n4\n0\n`; // Cyan
  dxf += `0\nLAYER\n2\nMARK_TEXT\n62\n3\n0\n`;       // Green
  dxf += `0\nENDTAB\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  // Outer boundary line 1 (Bottom)
  dxf += `0\nLINE\n8\nCUT_OUTER\n10\n0.0\n20\n0.0\n30\n0.0\n11\n${L}\n21\n0.0\n31\n0.0\n`;
  // Outer boundary line 2 (Right)
  dxf += `0\nLINE\n8\nCUT_OUTER\n10\n${L}\n20\n0.0\n30\n0.0\n11\n${L}\n21\n${W}\n31\n0.0\n`;
  // Outer boundary line 3 (Top)
  dxf += `0\nLINE\n8\nCUT_OUTER\n10\n${L}\n20\n${W}\n30\n0.0\n11\n0.0\n21\n${W}\n31\n0.0\n`;
  // Outer boundary line 4 (Left)
  dxf += `0\nLINE\n8\nCUT_OUTER\n10\n0.0\n20\n${W}\n30\n0.0\n11\n0.0\n21\n0.0\n31\n0.0\n`;

  // Marking Text (Part number)
  dxf += `0\nTEXT\n8\nMARK_TEXT\n10\n500.0\n20\n300.0\n30\n0.0\n40\n120.0\n1\n${plate.partNumber} - THK ${plate.thicknessMm}mm - ${plate.material}\n`;
  dxf += `0\nTEXT\n8\nMARK_TEXT\n10\n500.0\n20\n150.0\n30\n0.0\n40\n100.0\n1\nROLLING -> R=${plate.targetRadiusMm}mm [${plate.surfaceMarkingSide}]\n`;

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

export function downloadTextFile(filename: string, content: string) {
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
