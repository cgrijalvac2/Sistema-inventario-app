import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { CampoMantenimiento, ConfigMantenimiento, Opcion } from './mantenimiento.models';

interface DatosFormulario {
  config: ConfigMantenimiento;
  fila: any | null;               // null = nuevo registro
  opciones: Record<string, Opcion[]>;
}

// Formulario que se arma solo a partir de la lista de campos de la configuración
@Component({
  selector: 'app-formulario-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './formulario-dialog.html',
  styles: `
    .titulo { display: flex; align-items: center; gap: 10px; }
    .titulo mat-icon { color: var(--app-primario); }
    .checkbox { padding: 4px 0 12px; }
    mat-form-field { margin-bottom: 4px; }
  `,
})
export class FormularioDialog {
  protected datos = inject<DatosFormulario>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<FormularioDialog>);
  private api = inject(ApiService);
  private notificacion = inject(NotificacionService);

  protected esNuevo = this.datos.fila === null;
  protected guardando = signal(false);

  // Campos que se muestran según sea nuevo o edición
  protected campos = this.datos.config.campos.filter(c => (this.esNuevo ? !c.soloEditar : !c.soloCrear));

  protected form = new FormGroup(
    Object.fromEntries(this.campos.map(campo => [campo.nombre, this.crearControl(campo)]))
  );

  private crearControl(campo: CampoMantenimiento): FormControl {
    const fila = this.datos.fila;
    let valor: unknown;

    if (fila) {
      valor = campo.valorInicial ? campo.valorInicial(fila) : fila[campo.nombre];
    } else {
      valor = campo.valorDefecto ?? (campo.tipo === 'checkbox' ? true : campo.tipo === 'multiselect' ? [] : null);
    }

    const validadores: ValidatorFn[] = [];
    // Validators.required también marca como vacío un arreglo sin elementos (multiselect)
    if (campo.requerido || (campo.requeridoAlCrear && this.esNuevo)) {
      validadores.push(Validators.required);
    }
    if (campo.maxLength) validadores.push(Validators.maxLength(campo.maxLength));
    if (campo.minLength) validadores.push(Validators.minLength(campo.minLength));
    if (campo.tipo === 'email') validadores.push(Validators.email);
    if (campo.tipo === 'numero' || campo.tipo === 'decimal') validadores.push(Validators.min(0));

    return new FormControl({ value: valor, disabled: !!(campo.deshabilitadoAlEditar && fila) }, validadores);
  }

  protected opcionesDe(campo: CampoMantenimiento): Opcion[] {
    return this.datos.opciones[campo.nombre] ?? [];
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const config = this.datos.config;
    const valores: Record<string, unknown> = { ...this.form.value };

    for (const campo of this.campos) {
      const valor = valores[campo.nombre];
      if (campo.mayusculas && typeof valor === 'string') {
        valores[campo.nombre] = valor.toUpperCase();
      }
      if (typeof valor === 'string' && valor.trim() === '') {
        valores[campo.nombre] = null;   // los textos vacíos se envían como null
      }
      if ((campo.tipo === 'numero' || campo.tipo === 'decimal') && valor !== null && valor !== '') {
        valores[campo.nombre] = Number(valor);
      }
    }

    this.guardando.set(true);

    // Al editar se envía la fila original con los cambios encima (así viajan también la llave y el estado)
    const peticion = this.esNuevo
      ? this.api.post(config.url, valores)
      : this.api.put(`${config.url}/${this.datos.fila[config.id]}`, { ...this.datos.fila, ...valores });

    peticion.subscribe({
      next: () => {
        this.notificacion.exito(this.esNuevo ? `Se creó el ${config.nombreSingular}` : 'Cambios guardados');
        this.ref.close(true);
      },
      error: () => this.guardando.set(false),
    });
  }
}
