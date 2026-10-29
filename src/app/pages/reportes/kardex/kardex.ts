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
import { exportarCsv } from '../../../shared/exportar-csv';

// Historial (entradas, salidas y saldo) de un producto
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
  }

  protected elegir(producto: ProductoBuscable): void {
    this.producto.set(producto);
    this.cargar();
  }

  protected cargar(): void {
    const producto = this.producto();
    if (!producto) {
      return;
    }
    this.cargando.set(true);
    this.api.get<Movimiento[]>('Inventario/kardex', {
      idProducto: producto.ID_Producto, idAlmacen: this.idAlmacen(), desde: this.desde(), hasta: this.hasta(),
    }).subscribe({
      next: lista => {
        this.movimientos.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected exportar(): void {
    exportarCsv(`kardex-${this.producto()?.CodigoProducto}`, this.movimientos(), [
      { titulo: 'Fecha', valor: m => m.FechaRegistro },
      { titulo: 'Documento', valor: m => m.Documento },
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
