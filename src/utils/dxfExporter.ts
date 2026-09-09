import { FlangeParams } from '../types';

export function exportParamsToDXF(params: FlangeParams, filename: string = 'drawing.dxf'): void {
  const { outerDiameter, pitchCircleDiameter, boltHoleCount, boltHoleDiameter, innerDiameter, bossDiameter, totalHeight, flangeThickness } = params;
  
  // Minimal ASCII DXF generator for top view and section view
  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
ADEMO-V0015
0
ENDSEC
0
SECTION
2
TABLES
0
ENDSEC
0
SECTION
2
BLOCKS
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Top view circles (centered at 0, 0)
  // OD circle
  dxf += `0\nCIRCLE\n8\n0\n10\n0.0\n20\n0.0\n30\n0.0\n40\n${outerDiameter / 2}\n`;
  // PCD circle (dashed / center line layer)
  dxf += `0\nCIRCLE\n8\nCENTER\n10\n0.0\n20\n0.0\n30\n0.0\n40\n${pitchCircleDiameter / 2}\n`;
  // Inner Bore
  dxf += `0\nCIRCLE\n8\n0\n10\n0.0\n20\n0.0\n30\n0.0\n40\n${innerDiameter / 2}\n`;
  // Boss circle
  dxf += `0\nCIRCLE\n8\n0\n10\n0.0\n20\n0.0\n30\n0.0\n40\n${bossDiameter / 2}\n`;

  // Bolt holes
  const angleStep = (2 * Math.PI) / boltHoleCount;
  for (let i = 0; i < boltHoleCount; i++) {
    const angle = i * angleStep;
    const hx = (pitchCircleDiameter / 2) * Math.cos(angle);
    const hy = (pitchCircleDiameter / 2) * Math.sin(angle);
    dxf += `0\nCIRCLE\n8\n0\n10\n${hx.toFixed(2)}\n20\n${hy.toFixed(2)}\n30\n0.0\n40\n${boltHoleDiameter / 2}\n`;
  }

  // Section view (placed at offset X = outerDiameter * 1.5)
  const offsetX = outerDiameter * 1.5;
  // Flange rectangle left & right
  const rFlange = outerDiameter / 2;
  const rBoss = bossDiameter / 2;
  const rBore = innerDiameter / 2;

  // Flange bottom line
  dxf += `0\nLINE\n8\n0\n10\n${(offsetX - rFlange).toFixed(2)}\n20\n0.0\n30\n0.0\n11\n${(offsetX + rFlange).toFixed(2)}\n21\n0.0\n31\n0.0\n`;
  // Total height top line
  dxf += `0\nLINE\n8\n0\n10\n${(offsetX - rBoss).toFixed(2)}\n20\n${totalHeight}\n30\n0.0\n11\n${(offsetX + rBoss).toFixed(2)}\n21\n${totalHeight}\n31\n0.0\n`;

  dxf += `0\nENDSEC\n0\nEOF\n`;

  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSvgElement(svgId: string, filename: string = 'drawing.svg'): void {
  const svgEl = document.getElementById(svgId);
  if (!svgEl) return;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
