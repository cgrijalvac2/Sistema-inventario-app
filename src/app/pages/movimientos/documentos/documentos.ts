import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Transaccion } from '../../../core/models/modelos';
import { ESTADOS_CLASE, TIPOS_DOCUMENTO, inicioDeMes } from '../tipos';
import { DocumentoDetalleDialog } from './documento-detalle-dialog';

// Historial de todas las transacciones con filtros; desde aquí se ven y se anulan
@Component({
  selector: 'app-documentos',
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTooltipModule, MatProgressBarModule,
    ...PIPES_FORMATO,
  ],
  templateUrl: './documentos.html',
})
export class Documentos implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected tipos = TIPOS_DOCUMENTO;
  protected listaTipos = Object.entries(TIPOS_DOCUMENTO).map(([codigo, t]) => ({ codigo, texto: t.texto }));
  protected estados = ESTADOS_CLASE;
  protected columnas = ['NumeroDocumento', 'CodigoTipoTransaccion', 'Fecha', 'Tercero', 'Almacen', 'Total', 'Estado', 'acciones'];

  protected datos = new MatTableDataSource<Transaccion>([]);
  protected cargando = signal(false);

  // Filtros
  protected tipo = signal<string | null>(null);
  protected estado = signal<string | null>(null);
  protected desde = signal<Date | null>(inicioDeMes());
  protected hasta = signal<Date | null>(new Date());
  protected soloAlmacen = signal(true);

  protected totalRegistrado = signal(0);
  protected cantidad = signal(0);
  protected almacen = computed(() => this.auth.almacenActual()?.Nombre);

  ngOnInit(): void {
    this.datos.sortingDataAccessor = (fila, columna) =>
      columna === 'Tercero' ? (fila.Cliente ?? fila.Proveedor ?? '') : (fila as any)[columna];
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.get<Transaccion[]>('Transacciones', {
      tipo: this.tipo(),
      estado: this.estado(),
      desde: this.desde(),
      hasta: this.hasta(),
      idAlmacen: this.soloAlmacen() ? this.auth.idAlmacen() : null,
    }).subscribe({
      next: docs => {
        this.datos.data = docs;
        this.cantidad.set(docs.length);
        this.totalRegistrado.set(docs.filter(d => d.Estado === 'REGISTRADA').reduce((s, d) => s + d.Total, 0));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // Cada cambio de filtro vuelve a consultar al SP
  protected filtrar<T>(senal: { set(v: T): void }, valor: T): void {
    senal.set(valor);
    this.cargar();
  }

  protected infoTipo(doc: Transaccion) {
    return TIPOS_DOCUMENTO[doc.CodigoTipoTransaccion];
  }

  protected ver(doc: Transaccion): void {
    this.dialog.open(DocumentoDetalleDialog, { data: doc.ID_Transaccion, width: '760px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(cambio => {
        if (cambio) {
          this.cargar();
        }
      });
  }
}
