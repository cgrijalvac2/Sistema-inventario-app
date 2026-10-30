import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PIPES_FORMATO } from '../../core/pipes/formato.pipes';
import { Existencia, Indicadores, TopProducto, VentaDia } from '../../core/models/modelos';
import { exportarLibroExcel } from '../../shared/exportar-excel';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatButtonToggleModule, MatProgressBarModule, ...PIPES_FORMATO],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);

  protected cargando = signal(true);
  protected soloAlmacen = signal(true);   // true = almacén actual, false = todos
  protected indicadores = signal<Indicadores | null>(null);
  protected ventasDia = signal<VentaDia[]>([]);
  protected top = signal<TopProducto[]>([]);
  protected stockBajo = signal<Existencia[]>([]);   // los primeros 6 (los que se muestran)
  private stockBajoCompleto: Existencia[] = [];     // todos (para exportar)

  protected saludo = computed(() => {
    const hora = new Date().getHours();
    const nombre = this.auth.sesion()?.NombreCompleto.split(' ')[0] ?? '';
    return `${hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'}, ${nombre}`;
  });

  // Altura de cada barra de la gráfica en porcentaje respecto al día con más ventas
  protected barras = computed(() => {
    const dias = this.ventasDia();
    const maximo = Math.max(...dias.map(d => d.Total), 1);
    return dias.map(d => ({
      ...d,
      altura: Math.max((d.Total / maximo) * 100, d.Total > 0 ? 4 : 1),
      etiqueta: new Intl.DateTimeFormat('es-GT', { weekday: 'short', day: 'numeric' }).format(new Date(d.Fecha)),
    }));
  });

  protected totalSemana = computed(() => this.ventasDia().reduce((suma, d) => suma + d.Total, 0));
  protected maximoTop = computed(() => Math.max(...this.top().map(t => t.Cantidad), 1));

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarAlcance(soloAlmacen: boolean): void {
    this.soloAlmacen.set(soloAlmacen);
    this.cargar();
  }

  protected cargar(): void {
    const filtro = { idAlmacen: this.soloAlmacen() ? this.auth.idAlmacen() : null };
    this.cargando.set(true);

    forkJoin({
      indicadores: this.api.get<Indicadores>('Dashboard/indicadores', filtro),
      ventas: this.api.get<VentaDia[]>('Dashboard/ventas-por-dia', { ...filtro, dias: 7 }),
      top: this.api.get<TopProducto[]>('Dashboard/top-productos', filtro),
      stockBajo: this.api.get<Existencia[]>('Inventario/stock-bajo', filtro),
    }).subscribe({
      next: r => {
        this.indicadores.set(r.indicadores);
        this.ventasDia.set(r.ventas);
        this.top.set(r.top);
        this.stockBajoCompleto = r.stockBajo;
        this.stockBajo.set(r.stockBajo.slice(0, 6));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // Exporta el resumen en un archivo con una hoja por sección
  protected exportar(): void {
    const i = this.indicadores();
    if (!i) {
      return;
    }
    const alcance = this.soloAlmacen() ? (this.auth.almacenActual()?.Nombre ?? 'Almacén actual') : 'Todos los almacenes';
    const indicadores: [string, unknown][] = [
      ['Alcance', alcance],
      ['Ventas de hoy', i.VentasHoy],
      ['Ventas del mes', i.VentasMes],
      ['Cantidad de ventas del mes', i.CantidadVentasMes],
      ['Compras del mes', i.ComprasMes],
      ['Productos activos', i.ProductosActivos],
      ['Productos con stock bajo', i.ProductosStockBajo],
      ['Valor del inventario', i.ValorInventario],
      ['Transferencias por recibir', i.TransferenciasPorRecibir],
      ['Órdenes de compra pendientes', i.OrdenesPendientes],
    ];

    exportarLibroExcel('resumen-inicio', [
      { nombre: 'Indicadores', filas: indicadores, columnas: [
        { titulo: 'Indicador', valor: (f: [string, unknown]) => f[0] },
        { titulo: 'Valor', valor: (f: [string, unknown]) => f[1] },
      ] },
      { nombre: 'Ventas por día', filas: this.ventasDia(), columnas: [
        { titulo: 'Fecha', valor: (v: VentaDia) => v.Fecha },
        { titulo: 'Total', valor: (v: VentaDia) => v.Total },
      ] },
      { nombre: 'Más vendidos del mes', filas: this.top(), columnas: [
        { titulo: 'Código', valor: (t: TopProducto) => t.CodigoProducto },
        { titulo: 'Producto', valor: (t: TopProducto) => t.NombreProducto },
        { titulo: 'Cantidad', valor: (t: TopProducto) => t.Cantidad },
        { titulo: 'Total', valor: (t: TopProducto) => t.Total },
      ] },
      { nombre: 'Stock bajo', filas: this.stockBajoCompleto, columnas: [
        { titulo: 'Almacén', valor: (e: Existencia) => e.Almacen },
        { titulo: 'Código', valor: (e: Existencia) => e.CodigoProducto },
        { titulo: 'Producto', valor: (e: Existencia) => e.NombreProducto },
        { titulo: 'Existencia', valor: (e: Existencia) => e.StockActual },
        { titulo: 'Stock mínimo', valor: (e: Existencia) => e.StockMinimo },
      ] },
    ]);
  }
}
