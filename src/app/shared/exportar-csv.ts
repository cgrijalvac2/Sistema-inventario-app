// Descarga una lista como archivo .csv (se abre en Excel)
export function exportarCsv<T>(nombreArchivo: string, filas: T[], columnas: { titulo: string; valor: (fila: T) => unknown }[]): void {
  const escapar = (valor: unknown) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

  const lineas = [
    columnas.map(c => escapar(c.titulo)).join(','),
    ...filas.map(fila => columnas.map(c => escapar(c.valor(fila))).join(',')),
  ];

  // El BOM (﻿) hace que Excel respete las tildes
  const archivo = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `${nombreArchivo}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}
