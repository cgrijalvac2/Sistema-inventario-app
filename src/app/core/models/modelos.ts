// Interfaces con la misma forma que los DTOs de la API (los nombres coinciden con las propiedades de C#)

// ---------- Seguridad ----------
export interface AlmacenSimple {
  ID_Almacen: number;
  Codigo: string;
  Nombre: string;
}

export interface Sesion {
  ID_Usuario: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  ID_Rol: number;
  NombreRol: string;
  Permisos: string[];
  Almacenes: AlmacenSimple[];
}

// ---------- Catálogos ----------
export interface Producto {
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Descripcion: string | null;
  ID_Categoria: number;
  NombreCategoria: string;
  ID_UnidadMedida: number;
  UnidadMedida: string;
  Costo: number;
  Precio: number;
  StockTotal: number;
  Estado: boolean;
}

export interface Tercero {
  ID_Cliente?: number;
  ID_Proveedor?: number;
  Nombre: string;
  NIT: string;
  Estado: boolean;
}

export interface MotivoAjuste {
  ID_Motivo: number;
  Descripcion: string;
  Estado: boolean;
}

export interface Almacen {
  ID_Almacen: number;
  Codigo: string;
  Nombre: string;
  Estado: boolean;
}

export interface Categoria {
  ID_Categoria: number;
  NombreCategoria: string;
  Estado: boolean;
}

export interface ParametroSistema {
  ID_Parametro: number;
  ID_Almacen: number | null;
  Clave: string;
  Valor: string;
  Estado: boolean;
}

// ---------- Movimientos ----------
export type CodigoTipo =
  | 'COMPRA' | 'VENTA' | 'NC_VENTA' | 'NC_COMPRA' | 'ND_VENTA' | 'ND_COMPRA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA';

export interface TransaccionDetalle {
  ID_Detalle: number;
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  ID_Motivo: number | null;
  Motivo: string | null;
  Cantidad: number;
  PrecioUnitario: number;
  CostoUnitario: number;
  Descuento: number;
  Total: number;
}

export interface Transaccion {
  ID_Transaccion: number;
  NumeroDocumento: string;
  CodigoTipoTransaccion: CodigoTipo;
  TipoTransaccion: string;
  Fecha: string;
  ID_Almacen: number;
  Almacen: string;
  ID_Usuario: number;
  Usuario: string;
  ID_Cliente: number | null;
  Cliente: string | null;
  ID_Proveedor: number | null;
  Proveedor: string | null;
  ID_OrdenCompra: number | null;
  NumeroOrden: string | null;
  ID_TransaccionOrigen: number | null;
  DocumentoOrigen: string | null;
  Referencia: string | null;
  Subtotal: number;
  Descuento: number;
  Impuesto: number;
  Total: number;
  Estado: 'REGISTRADA' | 'ANULADA';
  Observaciones: string | null;
  FechaAnulacion: string | null;
  Detalles: TransaccionDetalle[];
}

export interface TransaccionDetalleRequest {
  ID_Producto: number;
  Cantidad: number;
  PrecioUnitario: number | null;
  Descuento: number;
  ID_Motivo: number | null;
}

export interface TransaccionRequest {
  CodigoTipoTransaccion: CodigoTipo;
  ID_Usuario: number;
  ID_Almacen: number;
  ID_Cliente: number | null;
  ID_Proveedor: number | null;
  ID_OrdenCompra: number | null;
  ID_TransaccionOrigen: number | null;
  Referencia: string | null;
  Observaciones: string | null;
  Detalles: TransaccionDetalleRequest[];
}

export interface OrdenCompraDetalle {
  ID_DetalleOC: number;
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  CantidadPedida: number;
  CantidadRecibida: number;
  CantidadPendiente: number;
  CostoUnitario: number;
  Descuento: number;
  Total: number;
}

export interface OrdenCompra {
  ID_OrdenCompra: number;
  NumeroOrden: string;
  ID_Proveedor: number;
  Proveedor: string;
  ID_Almacen: number;
  Almacen: string;
  Usuario: string;
  FechaOrden: string;
  FechaEsperada: string | null;
  Estado: 'PENDIENTE' | 'PARCIAL' | 'COMPLETADA' | 'CANCELADA';
  Subtotal: number;
  Impuesto: number;
  Total: number;
  Observaciones: string | null;
  Detalles: OrdenCompraDetalle[];
}

export interface Transferencia {
  ID_Transferencia: number;
  NumeroTransferencia: string;
  ID_AlmacenOrigen: number;
  AlmacenOrigen: string;
  ID_AlmacenDestino: number;
  AlmacenDestino: string;
  UsuarioEnvia: string;
  FechaEnvio: string;
  UsuarioRecibe: string | null;
  FechaRecepcion: string | null;
  MotivoRechazo: string | null;
  Estado: 'ENVIADA' | 'RECIBIDA' | 'RECHAZADA';
  Observaciones: string | null;
  Detalles: { ID_DetalleTransferencia: number; ID_Producto: number; CodigoProducto: string; NombreProducto: string; Cantidad: number }[];
}

// ---------- Reportes ----------
export interface Existencia {
  ID_Almacen: number;
  Almacen: string;
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Categoria: string;
  UnidadMedida: string;
  StockActual: number;
  StockMinimo: number;
  StockMaximo: number;
  Costo: number;
  Precio: number;          // precio de venta
  ValorInventario: number;
  Alerta: 'BAJO' | 'NORMAL' | 'EXCESO';
}

export interface Movimiento {
  ID_Movimiento: number;
  FechaRegistro: string;
  TipoMovimiento: 'ENTRADA' | 'SALIDA';
  Concepto: string;
  Documento: string;
  ID_Almacen: number;
  Almacen: string;
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Entrada: number;
  Salida: number;
  CostoUnitario: number;
  SaldoAnterior_Almacen: number;
  SaldoActual_Almacen: number;
  SaldoActual_Producto: number;
  Usuario: string;
}

export interface ResumenAlmacen {
  ID_Almacen: number;
  Almacen: string;
  Productos: number;
  Unidades: number;
  ValorInventario: number;
}

export interface Indicadores {
  VentasHoy: number;
  VentasMes: number;
  CantidadVentasMes: number;
  ComprasMes: number;
  ProductosActivos: number;
  ProductosStockBajo: number;
  ValorInventario: number;
  TransferenciasPorRecibir: number;
  OrdenesPendientes: number;
}

export interface VentaDia {
  Fecha: string;
  Total: number;
}

export interface TopProducto {
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Cantidad: number;
  Total: number;
}
