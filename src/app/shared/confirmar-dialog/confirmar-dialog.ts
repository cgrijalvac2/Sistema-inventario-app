import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoAceptar?: string;
  peligro?: boolean;
  // Si se indica, pide un texto (ej: motivo de anulación). Con "requerido" no deja aceptar vacío
  pedirTexto?: { etiqueta: string; requerido?: boolean };
}

// Diálogo para confirmar acciones. Devuelve false si cancela, true (o el texto escrito) si acepta
@Component({
  selector: 'app-confirmar-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title class="titulo">
      <mat-icon [class.peligro]="datos.peligro">{{ datos.peligro ? 'warning' : 'help' }}</mat-icon>
      {{ datos.titulo }}
    </h2>
    <mat-dialog-content>
      <p>{{ datos.mensaje }}</p>
      @if (datos.pedirTexto) {
        <mat-form-field class="ancho-completo">
          <mat-label>{{ datos.pedirTexto.etiqueta }}</mat-label>
          <textarea matInput rows="3" maxlength="200" [ngModel]="texto()" (ngModelChange)="texto.set($event)"></textarea>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [class.boton-peligro]="datos.peligro"
              [disabled]="datos.pedirTexto?.requerido && !texto().trim()"
              (click)="aceptar()">
        {{ datos.textoAceptar ?? 'Aceptar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .titulo { display: flex; align-items: center; gap: 10px; }
    .titulo mat-icon { color: var(--app-primario); }
    .titulo mat-icon.peligro { color: var(--app-peligro); }
    p { margin-top: 0; color: var(--app-texto-suave); line-height: 1.5; }
    .boton-peligro { --mat-button-filled-container-color: var(--app-peligro); }
  `,
})
export class ConfirmarDialog {
  protected datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ConfirmarDialog>);
  protected texto = signal('');

  protected aceptar(): void {
    this.ref.close(this.datos.pedirTexto ? this.texto().trim() || true : true);
  }

  // Atajo: ConfirmarDialog.abrir(dialog, {...}).subscribe(respuesta => ...)
  static abrir(dialog: MatDialog, datos: DatosConfirmacion): Observable<string | boolean | undefined> {
    return dialog.open(ConfirmarDialog, { data: datos, width: '440px' }).afterClosed();
  }
}
