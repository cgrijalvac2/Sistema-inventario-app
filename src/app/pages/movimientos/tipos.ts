import { CodigoTipo } from '../../core/models/modelos';

// Nombres cortos, colores y permiso necesario para anular cada tipo de documento
export const TIPOS_DOCUMENTO: Record<CodigoTipo, { texto: string; clase: string; permiso: string }> = {
  VENTA: { texto: 'Venta', clase: 'exito', permiso: 'VENTAS' },
  COMPRA: { texto: 'Compra', clase: 'primario', permiso: 'COMPRAS' },
  NC_VENTA: { texto: 'NC cliente', clase: 'alerta', permiso: 'VENTAS' },
  ND_VENTA: { texto: 'ND cliente', clase: 'info', permiso: 'VENTAS' },
  NC_COMPRA: { texto: 'NC proveedor', clase: 'alerta', permiso: 'COMPRAS' },
  ND_COMPRA: { texto: 'ND proveedor', clase: 'info', permiso: 'COMPRAS' },
  AJUSTE_ENTRADA: { texto: 'Ajuste +', clase: '', permiso: 'AJUSTES' },
  AJUSTE_SALIDA: { texto: 'Ajuste −', clase: 'peligro', permiso: 'AJUSTES' },
};

export const ESTADOS_CLASE: Record<string, string> = {
  REGISTRADA: 'exito',
  ANULADA: 'peligro',
  PENDIENTE: 'alerta',
  PARCIAL: 'info',
  COMPLETADA: 'exito',
  CANCELADA: 'peligro',
  ENVIADA: 'alerta',
  RECIBIDA: 'exito',
  RECHAZADA: 'peligro',
};

export function inicioDeMes(): Date {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
}
