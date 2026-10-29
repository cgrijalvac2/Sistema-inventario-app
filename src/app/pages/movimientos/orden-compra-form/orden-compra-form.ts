import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, fechaIso } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { OrdenCompra, ParametroSistema, Producto, Tercero } from '../../../core/models/modelos';
import { BuscadorProducto, ProductoBuscable } from '../../../shared/buscador-producto/buscador-producto';

interface LineaOrden {
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Cantidad: number;
  CostoUnitario: number;
  Descuento: number;
}

// Crear o editar (mientras esté PENDIENTE) una orden de compra
@Component({
  selector: 'app-orden-compra-form',
  imports: [
    FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatProgressSpinnerModule, BuscadorProducto, ...PIPES_FORMATO,
  ],
  templateUrl: './orden-compra-form.html',
  styleUrl: '../documento-form/documento-form.scss',
})
export class OrdenCompraForm implements OnInit {
  // Parámetro :id de la ruta (no viene cuando es nueva)
  id = input<string>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  protected esNueva = computed(() => !this.id());
  protected almacen = this.auth.almacenActual;
  protected guardando = signal(false);
  protected proveedores = signal<Tercero[]>([]);
  protected productos = signal<ProductoBuscable[]>([]);
  protected iva = signal(0);
  protected numero = signal('');

  protected idProveedor = signal<number | null>(null);
  protected fechaEsperada = signal<Date | null>(null);
  protected observaciones = signal('');
  protected lineas = signal<LineaOrden[]>([]);

  protected subtotal = computed(() => this.lineas().reduce((s, l) => s + l.Cantidad * l.CostoUnitario - (l.Descuento || 0), 0));
  protected impuesto = computed(() => Math.round(this.subtotal() * this.iva()) / 100);
  protected total = computed(() => this.subtotal() + this.impuesto());

  protected puedeGuardar = computed(() =>
    !this.guardando() && !!this.idProveedor() && !!this.almacen() && this.lineas().length > 0 &&
    this.lineas().every(l => l.Cantidad > 0 && l.CostoUnitario >= 0));

  ngOnInit(): void {
    const idAlmacen = this.auth.idAlmacen();

    forkJoin({
      proveedores: this.api.get<Tercero[]>('Proveedores', { soloActivos: true }),
      productos: this.api.get<Producto[]>('Productos', { soloActivos: true }),
      parametros: this.api.get<ParametroSistema[]>('ParametrosSistema'),
    }).subscribe(r => {
      this.proveedores.set(r.proveedores);
      // En compras se sugiere el costo actual del producto
      this.productos.set(r.productos.map(p => ({ ...p, Precio: p.Costo })));
      const ivas = r.parametros.filter(p => p.Clave === 'IVA_PORCENTAJE' && p.Estado);
      this.iva.set(Number((ivas.find(p => p.ID_Almacen === idAlmacen) ?? ivas.find(p => p.ID_Almacen === null))?.Valor ?? 0));
    });

    if (this.id()) {
      this.api.get<OrdenCompra>(`OrdenesCompra/${this.id()}`).subscribe(orden => {
        this.numero.set(orden.NumeroOrden);
        this.idProveedor.set(orden.ID_Proveedor);
        this.fechaEsperada.set(orden.FechaEsperada ? new Date(orden.FechaEsperada) : null);
        this.observaciones.set(orden.Observaciones ?? '');
        this.lineas.set(orden.Detalles.map(d => ({
          ID_Producto: d.ID_Producto, CodigoProducto: d.CodigoProducto, NombreProducto: d.NombreProducto,
          Cantidad: d.CantidadPedida, CostoUnitario: d.CostoUnitario, Descuento: d.Descuento,
        })));
      });
    }
  }

  protected agregar(producto: ProductoBuscable): void {
    if (this.lineas().some(l => l.ID_Producto === producto.ID_Producto)) {
      this.lineas.update(ls => ls.map(l => (l.ID_Producto === producto.ID_Producto ? { ...l, Cantidad: l.Cantidad + 1 } : l)));
      return;
    }
    this.lineas.update(ls => [...ls, {
      ID_Producto: producto.ID_Producto, CodigoProducto: producto.CodigoProducto, NombreProducto: producto.NombreProducto,
      Cantidad: 1, CostoUnitario: producto.Precio, Descuento: 0,
    }]);
  }

  protected actualizar(linea: LineaOrden, campo: 'Cantidad' | 'CostoUnitario' | 'Descuento', valor: number): void {
    this.lineas.update(ls => ls.map(l => (l === linea ? { ...l, [campo]: valor ?? 0 } : l)));
  }

  protected quitar(linea: LineaOrden): void {
    this.lineas.update(ls => ls.filter(l => l !== linea));
  }

  protected guardar(): void {
    const solicitud = {
      ID_Proveedor: this.idProveedor(),
      ID_Almacen: this.auth.idAlmacen(),
      ID_Usuario: this.auth.idUsuario,
      FechaEsperada: this.fechaEsperada() ? fechaIso(this.fechaEsperada()!) : null,
      Observaciones: this.observaciones().trim() || null,
      Detalles: this.lineas().map(l => ({
        ID_Producto: l.ID_Producto, Cantidad: l.Cantidad, CostoUnitario: l.CostoUnitario, Descuento: l.Descuento || 0,
      })),
    };

    this.guardando.set(true);
    const peticion = this.esNueva()
      ? this.api.post<OrdenCompra>('OrdenesCompra', solicitud)
      : this.api.put(`OrdenesCompra/${this.id()}`, solicitud);

    peticion.subscribe({
      next: (orden: any) => {
        this.notificacion.exito(this.esNueva() ? `Orden ${orden.NumeroOrden} creada` : 'Orden actualizada');
        this.router.navigate(['/movimientos/ordenes-compra']);
      },
      error: () => this.guardando.set(false),
    });
  }
}
