import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Almacen, Existencia, Transferencia } from '../../../core/models/modelos';
import { BuscadorProducto, ProductoBuscable } from '../../../shared/buscador-producto/buscador-producto';

interface LineaTransferencia {
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Cantidad: number;
  Stock: number;
}

// Envía mercadería del almacén actual a otro almacén
@Component({
  selector: 'app-transferencia-form',
  imports: [
    FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule, BuscadorProducto, ...PIPES_FORMATO,
  ],
  templateUrl: './transferencia-form.html',
  styleUrl: '../documento-form/documento-form.scss',
})
export class TransferenciaForm implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  protected origen = this.auth.almacenActual;
  protected guardando = signal(false);
  protected destinos = signal<Almacen[]>([]);
  protected disponibles = signal<ProductoBuscable[]>([]);

  protected idDestino = signal<number | null>(null);
  protected observaciones = signal('');
  protected lineas = signal<LineaTransferencia[]>([]);

  protected unidades = computed(() => this.lineas().reduce((s, l) => s + l.Cantidad, 0));
  protected nombreDestino = computed(() => this.destinos().find(a => a.ID_Almacen === this.idDestino())?.Nombre ?? '—');

  protected puedeGuardar = computed(() =>
    !this.guardando() && !!this.origen() && !!this.idDestino() && this.lineas().length > 0 &&
    this.lineas().every(l => l.Cantidad > 0 && l.Cantidad <= l.Stock));

  ngOnInit(): void {
    const idAlmacen = this.auth.idAlmacen();

    forkJoin({
      almacenes: this.api.get<Almacen[]>('Almacenes', { soloActivos: true }),
      existencias: this.api.get<Existencia[]>('Inventario/existencias', { idAlmacen, soloConStock: true }),
    }).subscribe(r => {
      this.destinos.set(r.almacenes.filter(a => a.ID_Almacen !== idAlmacen));
      // Solo se puede enviar lo que hay en existencia
      this.disponibles.set(r.existencias.map(e => ({
        ID_Producto: e.ID_Producto, CodigoProducto: e.CodigoProducto, NombreProducto: e.NombreProducto,
        Precio: e.Costo, Stock: e.StockActual,
      })));
    });
  }

  protected agregar(producto: ProductoBuscable): void {
    if (this.lineas().some(l => l.ID_Producto === producto.ID_Producto)) {
      return;
    }
    this.lineas.update(ls => [...ls, {
      ID_Producto: producto.ID_Producto, CodigoProducto: producto.CodigoProducto, NombreProducto: producto.NombreProducto,
      Cantidad: 1, Stock: producto.Stock ?? 0,
    }]);
  }

  protected actualizar(linea: LineaTransferencia, cantidad: number): void {
    this.lineas.update(ls => ls.map(l => (l === linea ? { ...l, Cantidad: cantidad ?? 0 } : l)));
  }

  protected quitar(linea: LineaTransferencia): void {
    this.lineas.update(ls => ls.filter(l => l !== linea));
  }

  protected guardar(): void {
    this.guardando.set(true);
    this.api.post<Transferencia>('Transferencias', {
      ID_AlmacenOrigen: this.auth.idAlmacen(),
      ID_AlmacenDestino: this.idDestino(),
      ID_Usuario: this.auth.idUsuario,
      Observaciones: this.observaciones().trim() || null,
      Detalles: this.lineas().map(l => ({ ID_Producto: l.ID_Producto, Cantidad: l.Cantidad })),
    }).subscribe({
      next: t => {
        this.notificacion.exito(`Transferencia ${t.NumeroTransferencia} enviada a ${t.AlmacenDestino}`);
        this.router.navigate(['/movimientos/transferencias']);
      },
      error: () => this.guardando.set(false),
    });
  }
}
