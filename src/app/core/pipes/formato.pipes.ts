import { Pipe, PipeTransform } from '@angular/core';

const formatoMoneda = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const formatoNumero = new Intl.NumberFormat('es-GT');
const formatoFecha = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
const formatoFechaHora = new Intl.DateTimeFormat('es-GT', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

// {{ 1250.5 | moneda }}  ->  Q1,250.50
@Pipe({ name: 'moneda' })
export class MonedaPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return formatoMoneda.format(valor ?? 0);
  }
}

// {{ 1250 | numero }}  ->  1,250
@Pipe({ name: 'numero' })
export class NumeroPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return formatoNumero.format(valor ?? 0);
  }
}

// {{ '2026-10-28T21:50:00' | fecha }} -> 28 oct 2026     {{ ... | fecha:true }} -> con hora
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, conHora = false): string {
    if (!valor) {
      return '—';
    }
    const fecha = valor instanceof Date ? valor : new Date(valor);
    return (conHora ? formatoFechaHora : formatoFecha).format(fecha);
  }
}

export const PIPES_FORMATO = [MonedaPipe, NumeroPipe, FechaPipe];
