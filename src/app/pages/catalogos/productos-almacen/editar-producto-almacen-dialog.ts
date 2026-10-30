import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Existencia } from '../../../core/models/modelos';

// Editar un producto del almacén: existencia (conteo físico) y límites de stock
@Component({
  selector: 'app-editar-producto-almacen-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ fila.NombreProducto }}</h2>
    <mat-dialog-content>
      <p class="texto-suave">{{ fila.CodigoProducto }} · {{ fila.Almacen }}</p>

      <mat-form-field class="ancho-completo">
        <mat-label>Existencia actual</mat-label>
        <input matInput type="number" min="0" [ngModel]="cantidad()" (ngModelChange)="cantidad.set($event)" />
        <span matTextSuffix>{{ fila.UnidadMedida }}</span>
        <mat-hint>En el sistema hay {{ fila.StockActual }}. Cámbiela si el conteo físico es distinto.</mat-hint>
      </mat-form-field>

      @if (diferencia() !== 0) {
        <div class="aviso" [class.salida]="diferencia() < 0">
          <mat-icon>{{ diferencia() > 0 ? 'add_box' : 'indeterminate_check_box' }}</mat-icon>
          <span>
            Se registrará un ajuste de {{ diferencia() > 0 ? 'entrada' : 'salida' }} de
            <strong>{{ diferencia() > 0 ? diferencia() : -diferencia() }}</strong> unidades (motivo: Diferencia en conteo físico).
          </span>
        </div>
      }

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
      <button mat-button mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button mat-flat-button [disabled]="guardando() || !valido()" (click)="guardar()">
        @if (guardando()) { <mat-spinner diameter="18" /> } @else { <mat-icon>save</mat-icon> }
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-form-field { margin-bottom: 12px; }
    .aviso { display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-bottom: 16px; border-radius: 10px;
             background: var(--app-exito-suave); color: var(--app-exito); font-size: 13px; }
    .aviso.salida { background: var(--app-peligro-suave); color: var(--app-peligro); }
  `,
})
export class EditarProductoAlmacenDialog {
  protected fila = inject<Existencia>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<EditarProductoAlmacenDialog>);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notificacion = inject(NotificacionService);

  protected cantidad = signal<number>(this.fila.StockActual);
  protected minimo = signal<number>(this.fila.StockMinimo);
  protected maximo = signal<number>(this.fila.StockMaximo);
  protected guardando = signal(false);

  protected diferencia = computed(() => (Number(this.cantidad()) || 0) - this.fila.StockActual);

  protected valido = computed(() => {
    const cantidad = Number(this.cantidad());
    const minimo = Number(this.minimo()) || 0;
    const maximo = Number(this.maximo()) || 0;
    return cantidad >= 0 && minimo >= 0 && maximo >= 0 && (maximo === 0 || minimo <= maximo);
  });

  protected guardar(): void {
    this.guardando.set(true);
    this.api.put(`InventarioAlmacen/${this.fila.ID_Almacen}/${this.fila.ID_Producto}`, {
      ID_Usuario: this.auth.idUsuario,
      StockMinimo: Number(this.minimo()) || 0,
      StockMaximo: Number(this.maximo()) || 0,
      // Solo se manda la existencia si cambió (si no, solo se actualizan los límites)
      CantidadActual: this.diferencia() !== 0 ? Number(this.cantidad()) : null,
    }).subscribe({
      next: () => {
        this.notificacion.exito(this.diferencia() !== 0 ? 'Existencia ajustada y límites guardados' : 'Límites guardados');
        this.ref.close(true);
      },
      error: () => this.guardando.set(false),
    });
  }
}
