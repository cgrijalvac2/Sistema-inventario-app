import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Almacen, Movimiento } from '../../../core/models/modelos';
import { exportarExcel } from '../../../shared/exportar-excel';
import { inicioDeMes } from '../../movimientos/tipos';

// Registro de movimientos de entrada y salida de todos los productos
@Component({
  selector: 'app-movimientos',
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule, ...PIPES_FORMATO,
  ],
  templateUrl: './movimientos.html',
})
export class Movimientos implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected columnas = ['FechaRegistro', 'TipoMovimiento', 'Documento', 'Concepto', 'NombreProducto', 'Almacen', 'Cantidad', 'CostoUnitario', 'SaldoActual_Almacen', 'Usuario'];
  protected datos = new MatTableDataSource<Movimiento>([]);
  protected cargando = signal(false);
  protected almacenes = signal<Almacen[]>([]);

  protected tipo = signal<string | null>(null);
  protected idAlmacen = signal<number | null>(this.auth.idAlmacen());
  protected desde = signal<Date | null>(inicioDeMes());
  protected hasta = signal<Date | null>(new Date());
  protected lista = signal<Movimiento[]>([]);

  protected entradas = computed(() => this.lista().reduce((s, m) => s + m.Entrada, 0));
  protected salidas = computed(() => this.lista().reduce((s, m) => s + m.Salida, 0));

  ngOnInit(): void {
    this.api.get<Almacen[]>('Almacenes').subscribe(a => this.almacenes.set(a));
    this.datos.sortingDataAccessor = (m, columna) => (columna === 'Cantidad' ? m.Entrada || m.Salida : (m as any)[columna]);
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.get<Movimiento[]>('Inventario/movimientos', {
      tipoMovimiento: this.tipo(), idAlmacen: this.idAlmacen(), desde: this.desde(), hasta: this.hasta(),
    }).subscribe({
      next: lista => {
        this.lista.set(lista);
        this.datos.data = lista;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected exportar(): void {
    exportarExcel('entradas-y-salidas', this.lista(), [
      { titulo: 'Fecha', valor: m => m.FechaRegistro },
      { titulo: 'Tipo', valor: m => m.TipoMovimiento },
      { titulo: 'Documento', valor: m => m.Documento },
      { titulo: 'Concepto', valor: m => m.Concepto },
      { titulo: 'Código', valor: m => m.CodigoProducto },
      { titulo: 'Producto', valor: m => m.NombreProducto },
      { titulo: 'Almacén', valor: m => m.Almacen },
      { titulo: 'Cantidad', valor: m => m.Entrada || m.Salida },
      { titulo: 'Costo unitario', valor: m => m.CostoUnitario },
      { titulo: 'Saldo almacén', valor: m => m.SaldoActual_Almacen },
      { titulo: 'Usuario', valor: m => m.Usuario },
    ]);
  }
}
