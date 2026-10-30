import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../../core/pipes/formato.pipes';
import { Transferencia } from '../../../core/models/modelos';
import { ConfirmarDialog } from '../../../shared/confirmar-dialog/confirmar-dialog';
import { exportarExcel } from '../../../shared/exportar-excel';
import { ESTADOS_CLASE } from '../tipos';

type Vista = 'POR_RECIBIR' | 'ENVIADAS' | 'TODAS';

@Component({
  selector: 'app-transferencias',
  imports: [RouterLink, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule, MatExpansionModule, ...PIPES_FORMATO],
  templateUrl: './transferencias.html',
  styleUrl: './transferencias.scss',
})
export class Transferencias implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notificacion = inject(NotificacionService);

  protected estados = ESTADOS_CLASE;
  protected cargando = signal(false);
  protected vista = signal<Vista>('POR_RECIBIR');
  protected todas = signal<Transferencia[]>([]);
  protected detalles = signal<Record<number, Transferencia>>({});

  protected lista = computed(() => {
    const idAlmacen = this.auth.idAlmacen();
    switch (this.vista()) {
      case 'POR_RECIBIR': return this.todas().filter(t => t.ID_AlmacenDestino === idAlmacen && t.Estado === 'ENVIADA');
      case 'ENVIADAS': return this.todas().filter(t => t.ID_AlmacenOrigen === idAlmacen);
      default: return this.todas();
    }
  });

  protected porRecibir = computed(() =>
    this.todas().filter(t => t.ID_AlmacenDestino === this.auth.idAlmacen() && t.Estado === 'ENVIADA').length);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.get<Transferencia[]>('Transferencias', { idAlmacen: this.auth.idAlmacen() }).subscribe({
      next: lista => {
        this.todas.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // El detalle (productos) se pide al abrir cada transferencia
  protected abrir(t: Transferencia): void {
    if (this.detalles()[t.ID_Transferencia]) {
      return;
    }
    this.api.get<Transferencia>(`Transferencias/${t.ID_Transferencia}`)
      .subscribe(d => this.detalles.update(mapa => ({ ...mapa, [t.ID_Transferencia]: d })));
  }

  protected puedeResolver(t: Transferencia): boolean {
    return t.Estado === 'ENVIADA' && t.ID_AlmacenDestino === this.auth.idAlmacen();
  }

  protected recibir(t: Transferencia): void {
    ConfirmarDialog.abrir(this.dialog, {
      titulo: `Recibir ${t.NumeroTransferencia}`,
      mensaje: `La mercadería entrará a ${t.AlmacenDestino}. Confirme que llegó completa.`,
      textoAceptar: 'Recibir',
    }).subscribe(acepto => {
      if (acepto) {
        this.api.post(`Transferencias/${t.ID_Transferencia}/recibir`, { ID_Usuario: this.auth.idUsuario })
          .subscribe(() => this.terminar(`Transferencia ${t.NumeroTransferencia} recibida`));
      }
    });
  }

  protected rechazar(t: Transferencia): void {
    ConfirmarDialog.abrir(this.dialog, {
      titulo: `Rechazar ${t.NumeroTransferencia}`,
      mensaje: `La mercadería regresará a ${t.AlmacenOrigen}.`,
      textoAceptar: 'Rechazar',
      peligro: true,
      pedirTexto: { etiqueta: 'Motivo del rechazo', requerido: true },
    }).subscribe(motivo => {
      if (typeof motivo === 'string') {
        this.api.post(`Transferencias/${t.ID_Transferencia}/rechazar`, { ID_Usuario: this.auth.idUsuario, Motivo: motivo })
          .subscribe(() => this.terminar(`Transferencia ${t.NumeroTransferencia} rechazada`));
      }
    });
  }

  // Exporta las transferencias de la vista elegida (por recibir, enviadas o todas)
  protected exportar(): void {
    exportarExcel('transferencias', this.lista(), [
      { titulo: 'Número', valor: t => t.NumeroTransferencia },
      { titulo: 'Almacén origen', valor: t => t.AlmacenOrigen },
      { titulo: 'Almacén destino', valor: t => t.AlmacenDestino },
      { titulo: 'Enviada por', valor: t => t.UsuarioEnvia },
      { titulo: 'Fecha de envío', valor: t => t.FechaEnvio },
      { titulo: 'Recibida / rechazada por', valor: t => t.UsuarioRecibe },
      { titulo: 'Fecha de recepción', valor: t => t.FechaRecepcion },
      { titulo: 'Estado', valor: t => t.Estado },
      { titulo: 'Motivo de rechazo', valor: t => t.MotivoRechazo },
      { titulo: 'Observaciones', valor: t => t.Observaciones },
    ]);
  }

  private terminar(mensaje: string): void {
    this.notificacion.exito(mensaje);
    this.detalles.set({});
    this.cargar();
  }
}
