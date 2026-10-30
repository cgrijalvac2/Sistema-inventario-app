import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Almacen, Movimiento, Producto } from '../../../core/models/modelos';
import { BuscadorProducto, ProductoBuscable } from '../../../shared/buscador-producto/buscador-producto';
import { exportarExcel } from '../../../shared/exportar-excel';

// Reportería general: todos los movimientos de HistorialMovimientos (transacciones, notas, ajustes y transferencias).
// Al elegir un producto muestra su kardex (entradas, salidas y saldo en orden cronológico)
@Component({
  selector: 'app-kardex',
  imports: [
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, BuscadorProducto, ...PIPES_FORMATO,
  ],
  templateUrl: './kardex.html',
  styleUrl: './kardex.scss',
})
export class Kardex implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  protected productos = signal<ProductoBuscable[]>([]);
  protected almacenes = signal<Almacen[]>([]);
  protected producto = signal<ProductoBuscable | null>(null);
  protected idAlmacen = signal<number | null>(this.auth.idAlmacen());
  protected desde = signal<Date | null>(null);
  protected hasta = signal<Date | null>(null);
  protected movimientos = signal<Movimiento[]>([]);
  protected cargando = signal(false);

  protected entradas = computed(() => this.movimientos().reduce((s, m) => s + m.Entrada, 0));
  protected salidas = computed(() => this.movimientos().reduce((s, m) => s + m.Salida, 0));
  protected saldoFinal = computed(() => {
    const lista = this.movimientos();
    if (lista.length === 0) {
      return 0;
    }
    const ultimo = lista[lista.length - 1];
    return this.idAlmacen() ? ultimo.SaldoActual_Almacen : ultimo.SaldoActual_Producto;
  });

  ngOnInit(): void {
    forkJoin({
      productos: this.api.get<Producto[]>('Productos'),
      almacenes: this.api.get<Almacen[]>('Almacenes'),
    }).subscribe(r => {
      this.productos.set(r.productos.map(p => ({ ...p, Stock: p.StockTotal })));
      this.almacenes.set(r.almacenes);
    });
    // Sin producto elegido se muestra la reportería general
    this.cargar();
  }

  protected elegir(producto: ProductoBuscable): void {
    this.producto.set(producto);
    this.cargar();
  }

  protected quitarProducto(): void {
    this.producto.set(null);
    this.cargar();
  }

  protected cargar(): void {
    const producto = this.producto();
    const filtros = { idAlmacen: this.idAlmacen(), desde: this.desde(), hasta: this.hasta() };

    this.cargando.set(true);
    const peticion = producto
      ? this.api.get<Movimiento[]>('Inventario/kardex', { idProducto: producto.ID_Producto, ...filtros })
      : this.api.get<Movimiento[]>('Inventario/movimientos', filtros);

    peticion.subscribe({
      next: lista => {
        this.movimientos.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected exportar(): void {
    const producto = this.producto();
    exportarExcel(producto ? `kardex-${producto.CodigoProducto}` : 'reporteria-general', this.movimientos(), [
      { titulo: 'Fecha', valor: m => m.FechaRegistro },
      { titulo: 'Documento', valor: m => m.Documento },
      { titulo: 'Producto', valor: m => `${m.CodigoProducto} ${m.NombreProducto}` },
      { titulo: 'Concepto', valor: m => m.Concepto },
      { titulo: 'Almacén', valor: m => m.Almacen },
      { titulo: 'Entrada', valor: m => m.Entrada },
      { titulo: 'Salida', valor: m => m.Salida },
      { titulo: 'Costo unitario', valor: m => m.CostoUnitario },
      { titulo: 'Saldo almacén', valor: m => m.SaldoActual_Almacen },
      { titulo: 'Saldo total', valor: m => m.SaldoActual_Producto },
      { titulo: 'Usuario', valor: m => m.Usuario },
    ]);
  }
}
