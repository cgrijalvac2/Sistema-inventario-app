import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';

import { forkJoin } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Almacen, Existencia, Producto } from '../../../core/models/modelos';
import { ConfirmarDialog } from '../../../shared/confirmar-dialog/confirmar-dialog';
import { AsignarProductosDialog } from './asignar-productos-dialog';
import { EditarProductoAlmacenDialog } from './editar-producto-almacen-dialog';

// Mantenimiento de InventarioAlmacen: qué productos maneja cada almacén y sus límites de stock
@Component({
  selector: 'app-productos-almacen',
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatProgressBarModule, ...PIPES_FORMATO,
  ],
  templateUrl: './productos-almacen.html',
  styleUrl: './productos-almacen.scss',
})
export class ProductosAlmacen implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notificacion = inject(NotificacionService);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected columnas = ['CodigoProducto', 'NombreProducto', 'Categoria', 'StockActual', 'StockMinimo', 'StockMaximo', 'Alerta', 'acciones'];
  protected datos = new MatTableDataSource<Existencia>([]);
  protected cargando = signal(false);
  protected almacenes = signal<Almacen[]>([]);
  protected productos = signal<Producto[]>([]);
  protected idAlmacen = signal<number | null>(this.auth.idAlmacen());
  protected buscar = signal('');
  protected asignados = signal(0);

  protected almacen = computed(() => this.almacenes().find(a => a.ID_Almacen === this.idAlmacen()) ?? null);

  ngOnInit(): void {
    this.datos.filterPredicate = (fila, texto) =>
      `${fila.CodigoProducto} ${fila.NombreProducto} ${fila.Categoria}`.toLowerCase().includes(texto);

    forkJoin({
      almacenes: this.api.get<Almacen[]>('Almacenes', { soloActivos: true }),
      productos: this.api.get<Producto[]>('Productos', { soloActivos: true }),
    }).subscribe(r => {
      this.almacenes.set(r.almacenes);
      this.productos.set(r.productos);
      if (!this.almacen() && r.almacenes.length > 0) {
        this.idAlmacen.set(r.almacenes[0].ID_Almacen);
      }
      this.cargar();
    });
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cambiarAlmacen(idAlmacen: number): void {
    this.idAlmacen.set(idAlmacen);
    this.cargar();
  }

  protected cargar(): void {
    if (!this.idAlmacen()) {
      return;
    }
    this.cargando.set(true);
    this.api.get<Existencia[]>('InventarioAlmacen', { idAlmacen: this.idAlmacen() }).subscribe({
      next: filas => {
        this.datos.data = filas;
        this.asignados.set(filas.length);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected filtrar(texto: string): void {
    this.buscar.set(texto);
    this.datos.filter = texto.toLowerCase().trim();
  }

  protected agregar(): void {
    const yaAsignados = new Set(this.datos.data.map(f => f.ID_Producto));
    this.dialog.open(AsignarProductosDialog, {
      data: { almacen: this.almacen(), productos: this.productos().filter(p => !yaAsignados.has(p.ID_Producto)) },
      width: '820px',
      maxWidth: '95vw',
    }).afterClosed().subscribe(guardado => guardado && this.cargar());
  }

  protected editar(fila: Existencia): void {
    this.dialog.open(EditarProductoAlmacenDialog, { data: fila, width: '460px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(guardado => guardado && this.cargar());
  }

  protected quitar(fila: Existencia): void {
    ConfirmarDialog.abrir(this.dialog, {
      titulo: 'Quitar producto del almacén',
      mensaje: `"${fila.NombreProducto}" ya no se manejará en ${fila.Almacen}. Su historial (kardex) se conserva.`,
      textoAceptar: 'Quitar',
      peligro: true,
    }).subscribe(acepto => {
      if (!acepto) {
        return;
      }
      this.api.delete(`InventarioAlmacen/${fila.ID_Almacen}/${fila.ID_Producto}`).subscribe(() => {
        this.notificacion.exito(`${fila.NombreProducto} quitado de ${fila.Almacen}`);
        this.cargar();
      });
    });
  }

  protected claseAlerta(alerta: string): string {
    return alerta === 'BAJO' ? 'peligro' : alerta === 'EXCESO' ? 'alerta' : 'exito';
  }
}
