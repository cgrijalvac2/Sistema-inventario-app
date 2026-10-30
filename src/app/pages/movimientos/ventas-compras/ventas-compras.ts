import { AfterViewInit, Component, OnInit, computed, inject, input, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { Tercero, Transaccion } from '../../../core/models/modelos';
import { exportarCsv } from '../../../shared/exportar-csv';
import { DocumentoForm, DatosDocumentoModal } from '../documento-form/documento-form';
import { DocumentoDetalleDialog } from '../documentos/documento-detalle-dialog';
import { ESTADOS_CLASE, inicioDeMes } from '../tipos';

type Tipo = 'VENTA' | 'COMPRA';

const TEXTOS: Record<Tipo, { titulo: string; subtitulo: string; icono: string; nuevo: string; tercero: string; url: string; permiso: string }> = {
  VENTA: {
    titulo: 'Ventas', subtitulo: 'Ventas registradas: la mercadería sale del almacén', icono: 'point_of_sale',
    nuevo: 'Nueva venta', tercero: 'Cliente', url: 'Clientes', permiso: 'VENTAS',
  },
  COMPRA: {
    titulo: 'Compras', subtitulo: 'Compras a proveedores: la mercadería entra al almacén', icono: 'shopping_cart',
    nuevo: 'Nueva compra', tercero: 'Proveedor', url: 'Proveedores', permiso: 'COMPRAS',
  },
};

// Módulo de ventas o de compras: listado con filtros y totales + registrar en un modal
@Component({
  selector: 'app-ventas-compras',
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTooltipModule, MatProgressBarModule,
    ...PIPES_FORMATO,
  ],
  templateUrl: './ventas-compras.html',
  styleUrl: './ventas-compras.scss',
})
export class VentasCompras implements OnInit, AfterViewInit {
  // Viene del "data" de la ruta: VENTA o COMPRA
  tipo = input.required<Tipo>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected textos = computed(() => TEXTOS[this.tipo()]);
  protected estados = ESTADOS_CLASE;
  protected columnas = ['NumeroDocumento', 'Fecha', 'Tercero', 'Referencia', 'Subtotal', 'Impuesto', 'Total', 'Estado', 'acciones'];
  protected datos = new MatTableDataSource<Transaccion>([]);
  protected cargando = signal(false);
  protected terceros = signal<Tercero[]>([]);

  // Filtros
  protected desde = signal<Date | null>(inicioDeMes());
  protected hasta = signal<Date | null>(new Date());
  protected idTercero = signal<number | null>(null);
  protected estado = signal<string | null>(null);
  protected soloAlmacen = signal(true);
  protected buscar = signal('');

  // Totales del período (solo documentos registrados)
  protected lista = signal<Transaccion[]>([]);
  protected registradas = computed(() => this.lista().filter(d => d.Estado === 'REGISTRADA'));
  protected total = computed(() => this.registradas().reduce((s, d) => s + d.Total, 0));
  protected impuesto = computed(() => this.registradas().reduce((s, d) => s + d.Impuesto, 0));
  protected promedio = computed(() => (this.registradas().length ? this.total() / this.registradas().length : 0));
  protected anuladas = computed(() => this.lista().length - this.registradas().length);
  protected puedeRegistrar = computed(() => this.auth.tienePermiso(this.textos().permiso));

  ngOnInit(): void {
    this.datos.sortingDataAccessor = (fila, columna) =>
      columna === 'Tercero' ? (fila.Cliente ?? fila.Proveedor ?? '') : (fila as any)[columna];
    this.datos.filterPredicate = (fila, texto) =>
      `${fila.NumeroDocumento} ${fila.Cliente ?? ''} ${fila.Proveedor ?? ''} ${fila.Referencia ?? ''}`.toLowerCase().includes(texto);

    this.api.get<Tercero[]>(this.textos().url).subscribe(t => this.terceros.set(t));
    this.cargar();

    // Desde el inicio (?nueva=1) o desde "Recibir" de una orden de compra (?orden=5) se abre el modal directamente
    const parametros = this.route.snapshot.queryParamMap;
    if (parametros.has('nueva') || parametros.has('orden')) {
      const idOrden = Number(parametros.get('orden')) || undefined;
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.nuevo(idOrden);
    }
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cargar(): void {
    const esVenta = this.tipo() === 'VENTA';
    this.cargando.set(true);
    this.api.get<Transaccion[]>('Transacciones', {
      tipo: this.tipo(),
      desde: this.desde(),
      hasta: this.hasta(),
      estado: this.estado(),
      idCliente: esVenta ? this.idTercero() : null,
      idProveedor: esVenta ? null : this.idTercero(),
      idAlmacen: this.soloAlmacen() ? this.auth.idAlmacen() : null,
    }).subscribe({
      next: docs => {
        this.lista.set(docs);
        this.datos.data = docs;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected filtrar<T>(senal: { set(v: T): void }, valor: T): void {
    senal.set(valor);
    this.cargar();
  }

  protected buscarTexto(texto: string): void {
    this.buscar.set(texto);
    this.datos.filter = texto.trim().toLowerCase();
  }

  // Abre el formulario de venta/compra en un modal grande; al cerrarlo se actualiza el listado
  protected nuevo(idOrden?: number): void {
    const datos: DatosDocumentoModal = { modo: this.tipo(), idOrden };
    this.dialog.open(DocumentoForm, {
      data: datos,
      width: '1240px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'modal-documento',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(registro => {
      if (!registro) {
        return;
      }
      // Si el filtro termina antes de hoy, se amplía para que el documento recién registrado aparezca
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (this.hasta() && this.hasta()! < hoy) {
        this.hasta.set(new Date());
      }
      this.cargar();
    });
  }

  protected ver(doc: Transaccion): void {
    this.dialog.open(DocumentoDetalleDialog, { data: doc.ID_Transaccion, width: '760px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(cambio => cambio && this.cargar());
  }

  protected idDe(t: Tercero): number {
    return (t.ID_Cliente ?? t.ID_Proveedor)!;
  }

  protected exportar(): void {
    exportarCsv(this.textos().titulo.toLowerCase(), this.datos.filteredData, [
      { titulo: 'Número', valor: d => d.NumeroDocumento },
      { titulo: 'Fecha', valor: d => d.Fecha },
      { titulo: this.textos().tercero, valor: d => d.Cliente ?? d.Proveedor },
      { titulo: 'Referencia', valor: d => d.Referencia },
      { titulo: 'Almacén', valor: d => d.Almacen },
      { titulo: 'Subtotal', valor: d => d.Subtotal },
      { titulo: 'Descuento', valor: d => d.Descuento },
      { titulo: 'IVA', valor: d => d.Impuesto },
      { titulo: 'Total', valor: d => d.Total },
      { titulo: 'Estado', valor: d => d.Estado },
    ]);
  }
}
