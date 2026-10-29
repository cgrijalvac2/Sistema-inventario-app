import { AfterViewInit, Component, OnInit, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { PIPES_FORMATO } from '../../core/pipes/formato.pipes';
import { ConfirmarDialog } from '../confirmar-dialog/confirmar-dialog';
import { FormularioDialog } from './formulario-dialog';
import { ColumnaMantenimiento, ConfigMantenimiento, Opcion } from './mantenimiento.models';

// Pantalla genérica de mantenimiento: tabla con búsqueda, orden y paginación + crear, editar y activar/desactivar
@Component({
  selector: 'app-mantenimiento',
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatTooltipModule, MatProgressBarModule, ...PIPES_FORMATO,
  ],
  templateUrl: './mantenimiento.html',
  styleUrl: './mantenimiento.scss',
})
export class Mantenimiento implements OnInit, AfterViewInit {
  // Viene del "data" de la ruta (ver app.routes.ts y configuraciones.ts)
  config = input.required<ConfigMantenimiento>();

  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private notificacion = inject(NotificacionService);

  private sort = viewChild(MatSort);
  private paginator = viewChild(MatPaginator);

  protected datos = new MatTableDataSource<any>([]);
  protected cargando = signal(true);
  protected busqueda = signal('');
  protected mostrarInactivos = signal(false);
  protected total = signal(0);
  protected activos = signal(0);

  // Opciones de los select (ej: categorías para productos) por nombre de campo
  protected opciones = signal<Record<string, Opcion[]>>({});

  protected columnas = computed(() => [...this.config().columnas.map(c => c.campo), 'acciones']);
  protected tieneEstado = computed(() => this.config().columnas.some(c => c.tipo === 'estado'));

  constructor() {
    // Cada vez que cambia la búsqueda o el filtro de inactivos se vuelve a filtrar la tabla
    effect(() => {
      this.datos.filter = JSON.stringify({ texto: this.busqueda().trim().toLowerCase(), inactivos: this.mostrarInactivos() });
      this.paginator()?.firstPage();
    });
  }

  ngOnInit(): void {
    this.datos.filterPredicate = (fila, filtroJson) => {
      const filtro = JSON.parse(filtroJson) as { texto: string; inactivos: boolean };
      if (!filtro.inactivos && fila.Estado === false) {
        return false;
      }
      const texto = this.config().busqueda.map(c => String(fila[c] ?? '')).join(' ').toLowerCase();
      return texto.includes(filtro.texto);
    };

    this.cargarOpciones();
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.datos.sort = this.sort() ?? null;
    this.datos.paginator = this.paginator() ?? null;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.get<any[]>(this.config().url).subscribe({
      next: filas => {
        this.datos.data = filas;
        this.total.set(filas.length);
        this.activos.set(filas.filter(f => f.Estado !== false).length);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // Carga en paralelo las opciones de todos los campos tipo select / multiselect
  private cargarOpciones(): void {
    const campos = this.config().campos.filter(c => c.opciones);
    if (campos.length === 0) {
      return;
    }

    forkJoin(campos.map(c => this.api.get<any[]>(c.opciones!.url))).subscribe(resultados => {
      const mapa: Record<string, Opcion[]> = {};
      campos.forEach((campo, i) => {
        const conf = campo.opciones!;
        const lista: Opcion[] = resultados[i].map(r => ({ valor: r[conf.valor], texto: r[conf.texto] }));
        mapa[campo.nombre] = conf.vacio ? [{ valor: null, texto: conf.vacio }, ...lista] : lista;
      });
      this.opciones.set(mapa);
    });
  }

  protected nuevo(): void {
    this.abrirFormulario(null);
  }

  protected editar(fila: any): void {
    this.abrirFormulario(fila);
  }

  private abrirFormulario(fila: any | null): void {
    this.dialog
      .open(FormularioDialog, {
        data: { config: this.config(), fila, opciones: this.opciones() },
        width: this.config().anchoDialogo ?? '640px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe(guardado => {
        if (guardado) {
          this.cargar();
        }
      });
  }

  protected cambiarEstado(fila: any): void {
    const config = this.config();
    const id = fila[config.id];
    const desactivar = fila.Estado !== false;

    const confirmacion = desactivar
      ? ConfirmarDialog.abrir(this.dialog, {
          titulo: `Desactivar ${config.nombreSingular}`,
          mensaje: `El registro no se borra: queda inactivo y ya no aparecerá en las listas. Puede reactivarlo cuando quiera.`,
          textoAceptar: 'Desactivar',
          peligro: true,
        })
      : of(true);

    confirmacion.subscribe(acepto => {
      if (!acepto) {
        return;
      }

      const peticion = desactivar
        ? this.api.delete(`${config.url}/${id}`)
        : config.estado === 'patch'
          ? this.api.patch(`${config.url}/${id}/activar`)
          : this.api.put(`${config.url}/${id}`, { ...fila, Estado: true });

      peticion.subscribe(() => {
        this.notificacion.exito(desactivar ? 'Registro desactivado' : 'Registro activado');
        this.cargar();
      });
    });
  }

  // ---------- Ayudas para la plantilla ----------

  protected lista(fila: any, columna: ColumnaMantenimiento): string[] {
    const valores = (fila[columna.campo] ?? []) as any[];
    return valores.map(v => (columna.listaCampo ? v[columna.listaCampo] : v));
  }

  protected textoOpcion(fila: any, columna: ColumnaMantenimiento): string {
    const opcion = (this.opciones()[columna.opcionDe ?? columna.campo] ?? []).find(o => o.valor === fila[columna.campo]);
    return opcion?.texto ?? '—';
  }
}
