import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { MonedaPipe } from '../../../core/pipes/formato.pipes';
import { Almacen, Producto } from '../../../core/models/modelos';

interface DatosAsignar {
  almacen: Almacen;
  productos: Producto[];      // productos activos que todavía NO están en el almacén
}

interface LineaAsignar {
  producto: Producto;
  Cantidad: number;           // existencia actual (se registra como ajuste de entrada)
  CostoUnitario: number;
  StockMinimo: number;
  StockMaximo: number;
}

// Elegir productos y agregarlos al almacén con su existencia actual, costo y límites de stock
@Component({
  selector: 'app-asignar-productos-dialog',
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatListModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule, MonedaPipe,
  ],
  templateUrl: './asignar-productos-dialog.html',
  styleUrl: './asignar-productos-dialog.scss',
})
export class AsignarProductosDialog {
  protected datos = inject<DatosAsignar>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<AsignarProductosDialog>);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notificacion = inject(NotificacionService);

  protected buscar = signal('');
  protected lineas = signal<LineaAsignar[]>([]);
  protected guardando = signal(false);

  protected filtrados = computed(() => {
    const texto = this.buscar().toLowerCase().trim();
    return this.datos.productos.filter(p =>
      !texto || `${p.CodigoProducto} ${p.NombreProducto} ${p.NombreCategoria}`.toLowerCase().includes(texto));
  });

  protected unidades = computed(() => this.lineas().reduce((s, l) => s + (l.Cantidad || 0), 0));
  protected valor = computed(() => this.lineas().reduce((s, l) => s + (l.Cantidad || 0) * (l.CostoUnitario || 0), 0));

  protected valido = computed(() =>
    this.lineas().length > 0 &&
    this.lineas().every(l =>
      l.Cantidad >= 0 && l.CostoUnitario >= 0 && l.StockMinimo >= 0 && l.StockMaximo >= 0 &&
      (l.StockMaximo === 0 || l.StockMinimo <= l.StockMaximo)));

  protected elegido(idProducto: number): boolean {
    return this.lineas().some(l => l.producto.ID_Producto === idProducto);
  }

  protected marcar(producto: Producto, marcado: boolean): void {
    this.lineas.update(lineas => marcado
      ? [...lineas.filter(l => l.producto.ID_Producto !== producto.ID_Producto),
         { producto, Cantidad: 0, CostoUnitario: producto.Costo, StockMinimo: 0, StockMaximo: 0 }]
      : lineas.filter(l => l.producto.ID_Producto !== producto.ID_Producto));
  }

  protected actualizar(linea: LineaAsignar, campo: 'Cantidad' | 'CostoUnitario' | 'StockMinimo' | 'StockMaximo', valor: number): void {
    this.lineas.update(lineas => lineas.map(l => (l === linea ? { ...l, [campo]: valor ?? 0 } : l)));
  }

  protected guardar(): void {
    this.guardando.set(true);
    this.api.post<{ agregados: number }>('InventarioAlmacen', {
      ID_Almacen: this.datos.almacen.ID_Almacen,
      ID_Usuario: this.auth.idUsuario,
      Productos: this.lineas().map(l => ({
        ID_Producto: l.producto.ID_Producto,
        Cantidad: Number(l.Cantidad) || 0,
        CostoUnitario: Number(l.CostoUnitario) || 0,
        StockMinimo: Number(l.StockMinimo) || 0,
        StockMaximo: Number(l.StockMaximo) || 0,
      })),
    }).subscribe({
      next: r => {
        const conExistencia = this.unidades() > 0 ? ' y se registró su existencia inicial' : '';
        this.notificacion.exito(`${r.agregados} productos agregados a ${this.datos.almacen.Nombre}${conExistencia}`);
        this.ref.close(true);
      },
      error: () => this.guardando.set(false),
    });
  }
}
