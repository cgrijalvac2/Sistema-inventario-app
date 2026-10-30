import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Almacen, Categoria, Existencia, ResumenAlmacen } from '../../../core/models/modelos';
import { exportarExcel } from '../../../shared/exportar-excel';
import { LimitesDialog } from './limites-dialog';

// Listado de existencias por almacén con alertas de stock bajo / exceso
@Component({
  selector: 'app-existencias',
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatSlideToggleModule, MatTooltipModule, MatProgressBarModule, ...PIPES_FORMATO,
  ],
  templateUrl: './existencias.html',
  styleUrl: './existencias.scss',
})
export class Existencias implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected columnas = ['CodigoProducto', 'NombreProducto', 'Categoria', 'Almacen', 'StockActual', 'StockMinimo', 'Costo', 'Precio', 'Alerta', 'acciones'];
  protected datos = new MatTableDataSource<Existencia>([]);
  protected cargando = signal(false);
  protected almacenes = signal<Almacen[]>([]);
  protected categorias = signal<Categoria[]>([]);
  protected resumen = signal<ResumenAlmacen[]>([]);

  // Filtros (el almacén y la categoría se consultan al SP; el texto y las alertas se filtran aquí)
  protected idAlmacen = signal<number | null>(this.auth.idAlmacen());
  protected idCategoria = signal<number | null>(null);
  protected buscar = signal('');
  protected soloConStock = signal(false);
  protected alerta = signal<string | null>(null);

  protected valorTotal = signal(0);
  protected bajos = signal(0);

  protected resumenFiltrado = computed(() =>
    this.idAlmacen() ? this.resumen().filter(r => r.ID_Almacen === this.idAlmacen()) : this.resumen());

  ngOnInit(): void {
    this.datos.filterPredicate = (fila, filtro) => {
      const { texto, alerta } = JSON.parse(filtro);
      const coincide = `${fila.CodigoProducto} ${fila.NombreProducto}`.toLowerCase().includes(texto);
      return coincide && (!alerta || fila.Alerta === alerta);
    };

    forkJoin({
      almacenes: this.api.get<Almacen[]>('Almacenes', { soloActivos: true }),
      categorias: this.api.get<Categoria[]>('Categorias', { soloActivos: true }),
    }).subscribe(r => {
      this.almacenes.set(r.almacenes);
      this.categorias.set(r.categorias);
    });

    this.cargar();
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cargar(): void {
    this.cargando.set(true);
    forkJoin({
      existencias: this.api.get<Existencia[]>('Inventario/existencias', {
        idAlmacen: this.idAlmacen(), idCategoria: this.idCategoria(), soloConStock: this.soloConStock(),
      }),
      resumen: this.api.get<ResumenAlmacen[]>('Inventario/resumen'),
    }).subscribe({
      next: r => {
        this.datos.data = r.existencias;
        this.resumen.set(r.resumen);
        this.valorTotal.set(r.existencias.reduce((s, e) => s + e.ValorInventario, 0));
        this.bajos.set(r.existencias.filter(e => e.Alerta === 'BAJO').length);
        this.aplicarFiltro();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected aplicarFiltro(): void {
    this.datos.filter = JSON.stringify({ texto: this.buscar().toLowerCase().trim(), alerta: this.alerta() });
  }

  protected limites(fila: Existencia): void {
    this.dialog.open(LimitesDialog, { data: fila, width: '420px' })
      .afterClosed()
      .subscribe(guardado => guardado && this.cargar());
  }

  protected exportar(): void {
    exportarExcel('existencias', this.datos.filteredData, [
      { titulo: 'Almacén', valor: e => e.Almacen },
      { titulo: 'Código', valor: e => e.CodigoProducto },
      { titulo: 'Producto', valor: e => e.NombreProducto },
      { titulo: 'Categoría', valor: e => e.Categoria },
      { titulo: 'Unidad', valor: e => e.UnidadMedida },
      { titulo: 'Existencia', valor: e => e.StockActual },
      { titulo: 'Mínimo', valor: e => e.StockMinimo },
      { titulo: 'Máximo', valor: e => e.StockMaximo },
      { titulo: 'Costo', valor: e => e.Costo },
      { titulo: 'Valor', valor: e => e.Precio },
      { titulo: 'Alerta', valor: e => e.Alerta },
    ]);
  }

  protected claseAlerta(alerta: string): string {
    return alerta === 'BAJO' ? 'peligro' : alerta === 'EXCESO' ? 'alerta' : 'exito';
  }
}
