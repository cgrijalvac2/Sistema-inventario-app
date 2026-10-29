import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Existencia } from '../../../core/models/modelos';

// Stock mínimo (para la alerta de reabastecimiento) y máximo de un producto en un almacén
@Component({
  selector: 'app-limites-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Límites de stock</h2>
    <mat-dialog-content>
      <p class="texto-suave">{{ fila.NombreProducto }} · {{ fila.Almacen }} · existencia actual <strong>{{ fila.StockActual }}</strong></p>
      <div class="rejilla">
        <mat-form-field>
          <mat-label>Stock mínimo</mat-label>
          <input matInput type="number" min="0" [ngModel]="minimo()" (ngModelChange)="minimo.set($event)" />
          <mat-hint>0 = sin alerta</mat-hint>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Stock máximo</mat-label>
          <input matInput type="number" min="0" [ngModel]="maximo()" (ngModelChange)="maximo.set($event)" />
          <mat-hint>0 = sin límite</mat-hint>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class LimitesDialog {
  protected fila = inject<Existencia>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<LimitesDialog>);
  private api = inject(ApiService);
  private notificacion = inject(NotificacionService);

  protected minimo = signal(this.fila.StockMinimo);
  protected maximo = signal(this.fila.StockMaximo);

  protected guardar(): void {
    this.api.put(`Inventario/limites/${this.fila.ID_Almacen}/${this.fila.ID_Producto}`, {
      StockMinimo: Number(this.minimo()) || 0,
      StockMaximo: Number(this.maximo()) || 0,
    }).subscribe(() => {
      this.notificacion.exito('Límites actualizados');
      this.ref.close(true);
    });
  }
}
