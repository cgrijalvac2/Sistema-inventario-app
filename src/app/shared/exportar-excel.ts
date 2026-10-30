// Descarga una lista como archivo de Excel (.xlsx) sin librerías externas.
// Los números quedan como números (se pueden sumar), las fechas como fechas y el encabezado en negrita.

export interface ColumnaExcel<T> {
  titulo: string;
  valor: (fila: T) => unknown;
}

export interface HojaExcel<T = any> {
  nombre: string;
  filas: T[];
  columnas: ColumnaExcel<T>[];
}

// Un archivo con una sola hoja
export function exportarExcel<T>(nombreArchivo: string, filas: T[], columnas: ColumnaExcel<T>[]): void {
  exportarLibroExcel(nombreArchivo, [{ nombre: nombreArchivo, filas, columnas }]);
}

// Un archivo con varias hojas (ej: el resumen del Inicio)
export function exportarLibroExcel(nombreArchivo: string, hojas: HojaExcel[]): void {
  // Nombres de hoja: máximo 31 caracteres, sin []:*?/\ y sin repetirse
  const nombres: string[] = [];
  for (const hoja of hojas) {
    const base = hoja.nombre.replace(/[\[\]:*?/\\]/g, ' ').slice(0, 28) || 'Datos';
    let nombre = base;
    for (let n = 2; nombres.some(x => x.toLowerCase() === nombre.toLowerCase()); n++) {
      nombre = `${base} ${n}`;
    }
    nombres.push(nombre);
  }

  const archivos: Record<string, string> = {
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      hojas.map((_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      nombres.map((nombre, i) => `<sheet name="${xml(nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
      '</sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      hojas.map((_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
      `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>',
    'xl/styles.xml': ESTILOS,
  };
  hojas.forEach((hoja, i) => {
    archivos[`xl/worksheets/sheet${i + 1}.xml`] = crearHoja(hoja.filas, hoja.columnas);
  });

  const archivo = new Blob([crearZip(archivos)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `${nombreArchivo}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

// Estilos: 0 normal, 1 encabezado (negrita con fondo), 2 fecha y hora, 3 número con 2 decimales, 4 entero con miles
const ESTILOS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/></numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFE8EAF6"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="5">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '</cellXfs></styleSheet>';

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/;

function crearHoja<T>(filas: T[], columnas: ColumnaExcel<T>[]): string {
  const anchos = columnas.map(c => c.titulo.length);
  const encabezado = columnas.map((c, i) => celda(i, 1, c.titulo, 1)).join('');

  const cuerpo = filas.map((fila, f) => {
    const numeroFila = f + 2;
    const celdas = columnas.map((columna, i) => {
      const valor = columna.valor(fila);
      if (valor === null || valor === undefined || valor === '') {
        return '';
      }
      if (typeof valor === 'number' && isFinite(valor)) {
        anchos[i] = Math.max(anchos[i], valor.toFixed(2).length + 2);
        return `<c r="${ref(i, numeroFila)}" s="${Number.isInteger(valor) ? 4 : 3}"><v>${valor}</v></c>`;
      }
      if (typeof valor === 'boolean') {
        return celda(i, numeroFila, valor ? 'Sí' : 'No', 0);
      }
      if (valor instanceof Date || (typeof valor === 'string' && FECHA_ISO.test(valor))) {
        anchos[i] = Math.max(anchos[i], 16);
        return `<c r="${ref(i, numeroFila)}" s="2"><v>${serialFecha(valor instanceof Date ? valor : new Date(valor))}</v></c>`;
      }
      const texto = String(valor);
      anchos[i] = Math.max(anchos[i], texto.length);
      return celda(i, numeroFila, texto, 0);
    });
    return `<row r="${numeroFila}">${celdas.join('')}</row>`;
  });

  const cols = anchos.map((a, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(a + 3, 60)}" customWidth="1"/>`).join('');

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    // Encabezado fijo al desplazarse
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `<cols>${cols}</cols>` +
    `<sheetData><row r="1">${encabezado}</row>${cuerpo.join('')}</sheetData>` +
    (filas.length > 0 ? `<autoFilter ref="A1:${ref(columnas.length - 1, filas.length + 1)}"/>` : '') +
    '</worksheet>';
}

function celda(columna: number, fila: number, texto: string, estilo: number): string {
  return `<c r="${ref(columna, fila)}" t="inlineStr" s="${estilo}"><is><t xml:space="preserve">${xml(texto)}</t></is></c>`;
}

// Columna 0, fila 1 -> "A1"; columna 27 -> "AB"
function ref(columna: number, fila: number): string {
  let letras = '';
  for (let n = columna + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letras = String.fromCharCode(65 + ((n - 1) % 26)) + letras;
  }
  return `${letras}${fila}`;
}

// Excel guarda las fechas como días desde el 30/12/1899 (con la hora local)
function serialFecha(fecha: Date): number {
  const local = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), fecha.getHours(), fecha.getMinutes(), fecha.getSeconds());
  return (local - Date.UTC(1899, 11, 30)) / 86400000;
}

function xml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // Caracteres de control que no se permiten en XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

// ---------- ZIP (un .xlsx es un .zip con archivos XML; se guardan sin comprimir) ----------

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(datos: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of datos) {
    crc = TABLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crearZip(archivos: Record<string, string>): Uint8Array<ArrayBuffer> {
  const codificador = new TextEncoder();
  const partes: Uint8Array[] = [];
  const directorio: Uint8Array[] = [];
  let posicion = 0;

  for (const [nombre, contenido] of Object.entries(archivos)) {
    const nombreBytes = codificador.encode(nombre);
    const datos = codificador.encode(contenido);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);    // firma de archivo local
    local.setUint16(4, 20, true);            // versión necesaria
    local.setUint16(8, 0, true);             // sin compresión
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombreBytes.length, true);
    partes.push(new Uint8Array(local.buffer), nombreBytes, datos);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);  // firma del directorio central
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(10, 0, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, datos.length, true);
    central.setUint32(24, datos.length, true);
    central.setUint16(28, nombreBytes.length, true);
    central.setUint32(42, posicion, true);   // dónde empieza el archivo local
    directorio.push(new Uint8Array(central.buffer), nombreBytes);

    posicion += 30 + nombreBytes.length + datos.length;
  }

  const tamanoDirectorio = directorio.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);        // fin del directorio central
  fin.setUint16(8, Object.keys(archivos).length, true);
  fin.setUint16(10, Object.keys(archivos).length, true);
  fin.setUint32(12, tamanoDirectorio, true);
  fin.setUint32(16, posicion, true);

  const todo = [...partes, ...directorio, new Uint8Array(fin.buffer)];
  const resultado = new Uint8Array(todo.reduce((s, p) => s + p.length, 0));
  let desplazamiento = 0;
  for (const parte of todo) {
    resultado.set(parte, desplazamiento);
    desplazamiento += parte.length;
  }
  return resultado;
}
