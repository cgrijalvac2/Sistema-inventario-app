import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Transaccion } from '../../../core/models/modelos';
import { ConfirmarDialog } from '../../../shared/confirmar-dialog/confirmar-dialog';
import { ESTADOS_CLASE, TIPOS_DOCUMENTO } from '../tipos';

// Muestra un documento completo (encabezado, productos y totales) y permite anularlo
@Component({
  selector: 'app-documento-detalle-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule, ...PIPES_FORMATO],
  templateUrl: './documento-detalle-dialog.html',
  styleUrl: './documento-detalle-dialog.scss',
})
export class DocumentoDetalleDialog {
  private id = inject<number>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<DocumentoDetalleDialog>);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notificacion = inject(NotificacionService);

  protected doc = signal<Transaccion | null>(null);
  protected tipos = TIPOS_DOCUMENTO;
  protected estados = ESTADOS_CLASE;

  constructor() {
    this.api.get<Transaccion>(`Transacciones/${this.id}`).subscribe(doc => this.doc.set(doc));
  }

  protected puedeAnular(doc: Transaccion): boolean {
    return doc.Estado === 'REGISTRADA' && this.auth.tienePermiso(TIPOS_DOCUMENTO[doc.CodigoTipoTransaccion].permiso);
  }

  protected anular(doc: Transaccion): void {
    ConfirmarDialog.abrir(this.dialog, {
      titulo: `Anular ${doc.NumeroDocumento}`,
      mensaje: 'El documento quedará ANULADO y se generarán los movimientos contrarios en el inventario. Esta acción no se puede deshacer.',
      textoAceptar: 'Anular documento',
      peligro: true,
      pedirTexto: { etiqueta: 'Motivo de la anulación', requerido: true },
    }).subscribe(motivo => {
      if (typeof motivo !== 'string') {
        return;
      }
      this.api.post(`Transacciones/${doc.ID_Transaccion}/anular`, { ID_Usuario: this.auth.idUsuario, Motivo: motivo })
        .subscribe(() => {
          this.notificacion.exito(`Documento ${doc.NumeroDocumento} anulado`);
          this.ref.close(true);
        });
    });
  }
}
