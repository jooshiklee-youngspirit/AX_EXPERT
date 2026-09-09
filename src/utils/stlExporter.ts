import * as THREE from 'three';

export function exportMeshToSTL(mesh: THREE.Mesh, filename: string = 'model.stl'): void {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);

  // Ensure non-indexed for easy facet generation
  const nonIndexed = geometry.toNonIndexed();
  const position = nonIndexed.getAttribute('position');

  let output = 'solid CAD_Model\n';
  const normal = new THREE.Vector3();
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 3) {
    pA.fromBufferAttribute(position, i);
    pB.fromBufferAttribute(position, i + 1);
    pC.fromBufferAttribute(position, i + 2);

    cb.subVectors(pC, pB);
    ab.subVectors(pA, pB);
    cb.cross(ab).normalize();
    normal.copy(cb);

    output += `  facet normal ${normal.x.toExponential()} ${normal.y.toExponential()} ${normal.z.toExponential()}\n`;
    output += '    outer loop\n';
    output += `      vertex ${pA.x.toExponential()} ${pA.y.toExponential()} ${pA.z.toExponential()}\n`;
    output += `      vertex ${pB.x.toExponential()} ${pB.y.toExponential()} ${pB.z.toExponential()}\n`;
    output += `      vertex ${pC.x.toExponential()} ${pC.y.toExponential()} ${pC.z.toExponential()}\n`;
    output += '    endloop\n';
    output += '  endfacet\n';
  }

  output += 'endsolid CAD_Model\n';

  const blob = new Blob([output], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMeshToOBJ(mesh: THREE.Mesh, filename: string = 'model.obj'): void {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  const nonIndexed = geometry.toNonIndexed();
  const position = nonIndexed.getAttribute('position');

  let output = '# Wavefront OBJ Exported from RFP to 2D/3D/BOM Studio\n';
  output += `o CAD_Object\n`;

  for (let i = 0; i < position.count; i++) {
    output += `v ${position.getX(i).toFixed(4)} ${position.getY(i).toFixed(4)} ${position.getZ(i).toFixed(4)}\n`;
  }

  for (let i = 1; i <= position.count; i += 3) {
    output += `f ${i} ${i + 1} ${i + 2}\n`;
  }

  const blob = new Blob([output], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
