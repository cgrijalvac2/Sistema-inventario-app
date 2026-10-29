import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import {
  CodigoTipo, Existencia, MotivoAjuste, OrdenCompra, ParametroSistema, Producto, Tercero, Transaccion, TransaccionRequest,
} from '../../../core/models/modelos';
import { BuscadorProducto, ProductoBuscable } from '../../../shared/buscador-producto/buscador-producto';

type Modo = 'VENTA' | 'COMPRA' | 'NOTA_CLIENTE' | 'NOTA_PROVEEDOR' | 'AJUSTE';

interface Linea {
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Cantidad: number;
  PrecioUnitario: number;
  Descuento: number;
  ID_Motivo: number | null;
  Stock: number;
  Maximo: number | null;     // tope por orden de compra o documento de origen
}

// Textos y comportamiento de cada pantalla
const MODOS: Record<Modo, { titulo: string; subtitulo: string; icono: string; tercero: 'CLIENTE' | 'PROVEEDOR' | null }> = {
  VENTA: { titulo: 'Nueva venta', subtitulo: 'La mercadería sale del almacén', icono: 'point_of_sale', tercero: 'CLIENTE' },
  COMPRA: { titulo: 'Nueva compra', subtitulo: 'La mercadería entra al almacén y se recalcula el costo promedio', icono: 'shopping_cart', tercero: 'PROVEEDOR' },
  NOTA_CLIENTE: { titulo: 'Nota a cliente', subtitulo: 'Corrige una venta: devolución (crédito) o cargo adicional (débito)', icono: 'receipt_long', tercero: 'CLIENTE' },
  NOTA_PROVEEDOR: { titulo: 'Nota de proveedor', subtitulo: 'Corrige una compra: devolución al proveedor (crédito) o cargo adicional (débito)', icono: 'request_quote', tercero: 'PROVEEDOR' },
  AJUSTE: { titulo: 'Ajuste de inventario', subtitulo: 'Inventario inicial, sobrantes, mermas, daños o diferencias de conteo', icono: 'tune', tercero: null },
};

@Component({
  selector: 'app-documento-form',
  imports: [
    FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatButtonToggleModule,
    MatIconModule, MatTooltipModule, MatProgressSpinnerModule, BuscadorProducto, ...PIPES_FORMATO,
  ],
  templateUrl: './documento-form.html',
  styleUrl: './documento-form.scss',
})
export class DocumentoForm implements OnInit {
  // Viene del "data" de la ruta
  modo = input.required<Modo>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notificacion = inject(NotificacionService);
  private route = inject(ActivatedRoute);

  protected info = computed(() => MODOS[this.modo()]);
  protected almacen = this.auth.almacenActual;

  // Variante elegida en notas (crédito / débito) y ajustes (entrada / salida)
  protected tipoNota = signal<'NC' | 'ND'>('NC');
  protected tipoAjuste = signal<'ENTRADA' | 'SALIDA'>('ENTRADA');

  protected codigoTipo = computed<CodigoTipo>(() => {
    switch (this.modo()) {
      case 'VENTA': return 'VENTA';
      case 'COMPRA': return 'COMPRA';
      case 'NOTA_CLIENTE': return `${this.tipoNota()}_VENTA` as CodigoTipo;
      case 'NOTA_PROVEEDOR': return `${this.tipoNota()}_COMPRA` as CodigoTipo;
      default: return `AJUSTE_${this.tipoAjuste()}` as CodigoTipo;
    }
  });

  // ¿Este documento saca mercadería del almacén? (para avisar si no alcanza el stock)
  protected esSalida = computed(() => ['VENTA', 'NC_COMPRA', 'AJUSTE_SALIDA'].includes(this.codigoTipo()));
  protected esAjuste = computed(() => this.modo() === 'AJUSTE');
  protected esNota = computed(() => this.modo() === 'NOTA_CLIENTE' || this.modo() === 'NOTA_PROVEEDOR');
  protected etiquetaPrecio = computed(() =>
    this.modo() === 'COMPRA' || this.modo() === 'NOTA_PROVEEDOR' || this.esAjuste() ? 'Costo unit.' : 'Precio unit.');

  // ---------- Datos de apoyo ----------
  protected cargando = signal(true);
  protected guardando = signal(false);
  protected productos = signal<Producto[]>([]);
  protected stock = signal<Map<number, number>>(new Map());
  protected terceros = signal<Tercero[]>([]);
  protected motivos = signal<MotivoAjuste[]>([]);
  protected iva = signal(0);
  protected ordenes = signal<OrdenCompra[]>([]);
  protected documentosOrigen = signal<Transaccion[]>([]);

  // ---------- Formulario ----------
  protected idTercero = signal<number | null>(null);
  protected idOrden = signal<number | null>(null);
  protected idOrigen = signal<number | null>(null);
  protected origen = signal<Transaccion | null>(null);
  protected orden = signal<OrdenCompra | null>(null);
  protected referencia = signal('');
  protected observaciones = signal('');
  protected lineas = signal<Linea[]>([]);
  protected registrado = signal<Transaccion | null>(null);

  // Productos que se pueden agregar: los del documento de origen / orden, o todos los activos
  protected productosBuscables = computed<ProductoBuscable[]>(() => {
    const stock = this.stock();
    const origen = this.origen();
    const orden = this.orden();

    if (origen) {
      return origen.Detalles.map(d => ({
        ID_Producto: d.ID_Producto, CodigoProducto: d.CodigoProducto, NombreProducto: d.NombreProducto,
        Precio: d.PrecioUnitario, Stock: stock.get(d.ID_Producto) ?? 0,
      }));
    }
    if (orden) {
      return orden.Detalles.filter(d => d.CantidadPendiente > 0).map(d => ({
        ID_Producto: d.ID_Producto, CodigoProducto: d.CodigoProducto, NombreProducto: d.NombreProducto,
        Precio: d.CostoUnitario, Stock: stock.get(d.ID_Producto) ?? 0,
      }));
    }
    const usaCosto = this.etiquetaPrecio() === 'Costo unit.';
    return this.productos().map(p => ({
      ID_Producto: p.ID_Producto, CodigoProducto: p.CodigoProducto, NombreProducto: p.NombreProducto,
      Precio: usaCosto ? p.Costo : p.Precio, Stock: stock.get(p.ID_Producto) ?? 0,
    }));
  });

  // ---------- Totales (el cálculo oficial lo hace el SP; esto es la vista previa) ----------
  protected subtotal = computed(() => this.lineas().reduce((s, l) => s + l.Cantidad * l.PrecioUnitario, 0));
  protected descuento = computed(() => this.lineas().reduce((s, l) => s + (l.Descuento || 0), 0));
  protected porcentajeIva = computed(() => (this.esAjuste() ? 0 : this.iva()));
  protected impuesto = computed(() => Math.round((this.subtotal() - this.descuento()) * this.porcentajeIva()) / 100);
  protected total = computed(() => this.subtotal() - this.descuento() + this.impuesto());

  ngOnInit(): void {
    const idAlmacen = this.auth.idAlmacen();
    const tercero = this.info().tercero;

    forkJoin({
      productos: this.api.get<Producto[]>('Productos', { soloActivos: true }),
      existencias: this.api.get<Existencia[]>('Inventario/existencias', { idAlmacen }),
      parametros: this.api.get<ParametroSistema[]>('ParametrosSistema'),
      terceros: tercero === 'CLIENTE'
        ? this.api.get<Tercero[]>('Clientes', { soloActivos: true })
        : tercero === 'PROVEEDOR'
          ? this.api.get<Tercero[]>('Proveedores', { soloActivos: true })
          : of<Tercero[]>([]),   // los ajustes no llevan cliente ni proveedor
      motivos: this.api.get<MotivoAjuste[]>('MotivosAjuste', { soloActivos: true }),
    }).subscribe({
      next: r => {
        this.productos.set(r.productos);
        this.stock.set(new Map(r.existencias.map(e => [e.ID_Producto, e.StockActual])));
        this.terceros.set(r.terceros);
        this.motivos.set(r.motivos);

        // IVA: primero el del almacén, si no existe el global
        const ivas = r.parametros.filter(p => p.Clave === 'IVA_PORCENTAJE' && p.Estado);
        const iva = ivas.find(p => p.ID_Almacen === idAlmacen) ?? ivas.find(p => p.ID_Almacen === null);
        this.iva.set(Number(iva?.Valor ?? 0));

        this.cargando.set(false);
        this.leerOrdenDeLaUrl();
      },
      error: () => this.cargando.set(false),
    });
  }

  // Desde "Órdenes de compra > Recibir" se llega con ?orden=5
  private leerOrdenDeLaUrl(): void {
    const idOrden = Number(this.route.snapshot.queryParamMap.get('orden'));
    if (this.modo() !== 'COMPRA' || !idOrden) {
      return;
    }
    this.api.get<OrdenCompra>(`OrdenesCompra/${idOrden}`).subscribe(orden => {
      this.idTercero.set(orden.ID_Proveedor);
      this.ordenes.set([orden]);
      this.elegirOrden(orden.ID_OrdenCompra);
    });
  }

  // ---------- Eventos del formulario ----------

  protected cambiarTipoNota(tipo: 'NC' | 'ND'): void {
    this.tipoNota.set(tipo);
    this.lineas.set([]);
  }

  protected cambiarTipoAjuste(tipo: 'ENTRADA' | 'SALIDA'): void {
    this.tipoAjuste.set(tipo);
    this.lineas.set([]);
  }

  protected elegirTercero(id: number): void {
    this.idTercero.set(id);
    this.idOrden.set(null);
    this.orden.set(null);
    this.idOrigen.set(null);
    this.origen.set(null);
    this.lineas.set([]);

    const idAlmacen = this.auth.idAlmacen();

    if (this.modo() === 'COMPRA') {
      this.api.get<OrdenCompra[]>('OrdenesCompra', { idProveedor: id, idAlmacen }).subscribe(ordenes =>
        this.ordenes.set(ordenes.filter(o => o.Estado === 'PENDIENTE' || o.Estado === 'PARCIAL')));
    }

    if (this.esNota()) {
      const esCliente = this.modo() === 'NOTA_CLIENTE';
      this.api.get<Transaccion[]>('Transacciones', {
        tipo: esCliente ? 'VENTA' : 'COMPRA',
        idCliente: esCliente ? id : null,
        idProveedor: esCliente ? null : id,
        idAlmacen,
        estado: 'REGISTRADA',
      }).subscribe(documentos => this.documentosOrigen.set(documentos));
    }
  }

  // Al elegir la orden se cargan sus productos pendientes con el costo pactado
  protected elegirOrden(idOrden: number | null): void {
    this.idOrden.set(idOrden);
    this.orden.set(null);
    this.lineas.set([]);
    if (!idOrden) {
      return;
    }
    this.api.get<OrdenCompra>(`OrdenesCompra/${idOrden}`).subscribe(orden => {
      this.orden.set(orden);
      this.lineas.set(orden.Detalles.filter(d => d.CantidadPendiente > 0).map(d => ({
        ID_Producto: d.ID_Producto, CodigoProducto: d.CodigoProducto, NombreProducto: d.NombreProducto,
        Cantidad: d.CantidadPendiente, PrecioUnitario: d.CostoUnitario, Descuento: 0, ID_Motivo: null,
        Stock: this.stock().get(d.ID_Producto) ?? 0, Maximo: d.CantidadPendiente,
      })));
    });
  }

  // Al elegir el documento de origen de una nota, solo se pueden usar sus productos
  protected elegirOrigen(idOrigen: number): void {
    this.idOrigen.set(idOrigen);
    this.lineas.set([]);
    this.api.get<Transaccion>(`Transacciones/${idOrigen}`).subscribe(origen => this.origen.set(origen));
  }

  protected agregar(producto: ProductoBuscable): void {
    const existente = this.lineas().find(l => l.ID_Producto === producto.ID_Producto);
    if (existente) {
      this.actualizar(existente, 'Cantidad', existente.Cantidad + 1);
      return;
    }

    const lineaOrigen = this.origen()?.Detalles.find(d => d.ID_Producto === producto.ID_Producto);
    const lineaOrden = this.orden()?.Detalles.find(d => d.ID_Producto === producto.ID_Producto);
    const motivoInicial = this.esAjuste() ? (this.motivos()[0]?.ID_Motivo ?? null) : null;

    this.lineas.update(lineas => [...lineas, {
      ID_Producto: producto.ID_Producto,
      CodigoProducto: producto.CodigoProducto,
      NombreProducto: producto.NombreProducto,
      Cantidad: 1,
      PrecioUnitario: producto.Precio,
      Descuento: 0,
      ID_Motivo: motivoInicial,
      Stock: producto.Stock ?? 0,
      Maximo: lineaOrden?.CantidadPendiente ?? (this.tipoNota() === 'NC' ? lineaOrigen?.Cantidad ?? null : null),
    }]);
  }

  protected actualizar(linea: Linea, campo: 'Cantidad' | 'PrecioUnitario' | 'Descuento' | 'ID_Motivo', valor: number | null): void {
    this.lineas.update(lineas => lineas.map(l => (l === linea ? { ...l, [campo]: valor ?? 0 } : l)));
  }

  protected quitar(linea: Linea): void {
    this.lineas.update(lineas => lineas.filter(l => l !== linea));
  }

  protected faltaStock(linea: Linea): boolean {
    return this.esSalida() && linea.Cantidad > linea.Stock;
  }

  // ---------- Guardar ----------

  protected puedeGuardar = computed(() =>
    !this.guardando() &&
    !!this.almacen() &&
    this.lineas().length > 0 &&
    this.lineas().every(l => l.Cantidad > 0 && l.PrecioUnitario >= 0 && (!this.esAjuste() || l.ID_Motivo)) &&
    (this.info().tercero === null || !!this.idTercero()) &&
    (!this.esNota() || !!this.idOrigen())
  );

  protected guardar(): void {
    const esCliente = this.info().tercero === 'CLIENTE';
    const esProveedor = this.info().tercero === 'PROVEEDOR';

    const solicitud: TransaccionRequest = {
      CodigoTipoTransaccion: this.codigoTipo(),
      ID_Usuario: this.auth.idUsuario,
      ID_Almacen: this.auth.idAlmacen()!,
      ID_Cliente: esCliente ? this.idTercero() : null,
      ID_Proveedor: esProveedor ? this.idTercero() : null,
      ID_OrdenCompra: this.idOrden(),
      ID_TransaccionOrigen: this.idOrigen(),
      Referencia: this.referencia().trim() || null,
      Observaciones: this.observaciones().trim() || null,
      Detalles: this.lineas().map(l => ({
        ID_Producto: l.ID_Producto,
        Cantidad: l.Cantidad,
        PrecioUnitario: l.PrecioUnitario,
        Descuento: l.Descuento || 0,
        ID_Motivo: l.ID_Motivo,
      })),
    };

    this.guardando.set(true);
    this.api.post<Transaccion>('Transacciones', solicitud).subscribe({
      next: documento => {
        this.guardando.set(false);
        this.registrado.set(documento);
        this.notificacion.exito(`Documento ${documento.NumeroDocumento} registrado`);
      },
      error: () => this.guardando.set(false),
    });
  }

  // Deja la pantalla lista para otro documento (recarga existencias porque cambiaron)
  protected nuevo(): void {
    this.registrado.set(null);
    this.lineas.set([]);
    this.idTercero.set(null);
    this.idOrden.set(null);
    this.orden.set(null);
    this.idOrigen.set(null);
    this.origen.set(null);
    this.referencia.set('');
    this.observaciones.set('');
    this.ordenes.set([]);
    this.documentosOrigen.set([]);
    this.api.get<Existencia[]>('Inventario/existencias', { idAlmacen: this.auth.idAlmacen() })
      .subscribe(e => this.stock.set(new Map(e.map(x => [x.ID_Producto, x.StockActual]))));
  }

  protected nombreTercero(): string {
    return this.terceros().find(t => (t.ID_Cliente ?? t.ID_Proveedor) === this.idTercero())?.Nombre ?? '';
  }

  protected idDe(tercero: Tercero): number {
    return (tercero.ID_Cliente ?? tercero.ID_Proveedor)!;
  }
}
