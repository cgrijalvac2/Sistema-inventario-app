import { AfterViewInit, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { OrdenCompra } from '../../../core/models/modelos';
import { ConfirmarDialog } from '../../../shared/confirmar-dialog/confirmar-dialog';
import { exportarExcel } from '../../../shared/exportar-excel';
import { ESTADOS_CLASE } from '../tipos';

@Component({
  selector: 'app-ordenes-compra',
  imports: [
    RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatMenuModule, MatSlideToggleModule, MatProgressBarModule, ...PIPES_FORMATO,
  ],
  templateUrl: './ordenes-compra.html',
  styleUrl: './ordenes-compra.scss',
})
export class OrdenesCompra implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected estados = ESTADOS_CLASE;
  protected columnas = ['NumeroOrden', 'FechaOrden', 'Proveedor', 'FechaEsperada', 'Total', 'Estado', 'acciones'];
  protected datos = new MatTableDataSource<OrdenCompra>([]);
  protected cargando = signal(false);
  protected estado = signal<string | null>(null);
  protected soloAlmacen = signal(true);

  // Orden abierta en el panel de detalle
  protected detalle = signal<OrdenCompra | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.get<OrdenCompra[]>('OrdenesCompra', {
      estado: this.estado(),
      idAlmacen: this.soloAlmacen() ? this.auth.idAlmacen() : null,
    }).subscribe({
      next: ordenes => {
        this.datos.data = ordenes;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected verDetalle(orden: OrdenCompra): void {
    this.api.get<OrdenCompra>(`OrdenesCompra/${orden.ID_OrdenCompra}`).subscribe(o => this.detalle.set(o));
  }

  // Lleva a "Nueva compra" con la orden ya seleccionada
  protected recibir(orden: OrdenCompra): void {
    this.router.navigate(['/movimientos/compra'], { queryParams: { orden: orden.ID_OrdenCompra } });
  }

  protected cancelar(orden: OrdenCompra): void {
    ConfirmarDialog.abrir(this.dialog, {
      titulo: `Cancelar ${orden.NumeroOrden}`,
      mensaje: orden.Estado === 'PARCIAL'
        ? 'Lo que ya se recibió se queda en el inventario; se cancela solo lo pendiente.'
        : 'La orden quedará cancelada y ya no se podrá recibir.',
      textoAceptar: 'Cancelar orden',
      peligro: true,
    }).subscribe(acepto => {
      if (!acepto) {
        return;
      }
      this.api.post(`OrdenesCompra/${orden.ID_OrdenCompra}/cancelar`).subscribe(() => {
        this.notificacion.exito(`Orden ${orden.NumeroOrden} cancelada`);
        this.detalle.set(null);
        this.cargar();
      });
    });
  }

  // Exporta las órdenes filtradas en el orden de la tabla
  protected exportar(): void {
    const sort = this.sort();
    const filas = sort ? this.datos.sortData(this.datos.filteredData.slice(), sort) : this.datos.filteredData;
    exportarExcel('ordenes-de-compra', filas, [
      { titulo: 'Orden', valor: o => o.NumeroOrden },
      { titulo: 'Fecha', valor: o => o.FechaOrden },
      { titulo: 'Proveedor', valor: o => o.Proveedor },
      { titulo: 'Almacén', valor: o => o.Almacen },
      { titulo: 'Fecha esperada', valor: o => o.FechaEsperada },
      { titulo: 'Subtotal', valor: o => o.Subtotal },
      { titulo: 'IVA', valor: o => o.Impuesto },
      { titulo: 'Total', valor: o => o.Total },
      { titulo: 'Estado', valor: o => o.Estado },
      { titulo: 'Creada por', valor: o => o.Usuario },
      { titulo: 'Observaciones', valor: o => o.Observaciones },
    ]);
  }

  protected abierta(orden: OrdenCompra): boolean {
    return orden.Estado === 'PENDIENTE' || orden.Estado === 'PARCIAL';
  }

  protected avance(orden: OrdenCompra): number {
    const pedido = orden.Detalles.reduce((s, d) => s + d.CantidadPedida, 0);
    const recibido = orden.Detalles.reduce((s, d) => s + d.CantidadRecibida, 0);
    return pedido ? Math.round((recibido / pedido) * 100) : 0;
  }
}
