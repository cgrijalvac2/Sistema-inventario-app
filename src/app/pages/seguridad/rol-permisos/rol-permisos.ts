import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, from, concatMap, toArray } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../../core/services/api.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ColumnaExcel, exportarExcel } from '../../../shared/exportar-excel';

interface RolSimple { ID_Rol: number; NombreRol: string; Descripcion: string | null; Estado: boolean; }
interface PermisoFila { ID_Permiso: number; Codigo: string; Nombre: string; Descripcion: string | null; }
interface Asignacion { ID_Rol: number; ID_Permiso: number; }

// Mantenimiento de la tabla RolPermiso: matriz de permisos (filas) por roles (columnas).
// Cada casilla marcada es un registro en RolPermiso
@Component({
  selector: 'app-rol-permisos',
  imports: [RouterLink, MatCheckboxModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressBarModule],
  templateUrl: './rol-permisos.html',
  styleUrl: './rol-permisos.scss',
})
export class RolPermisos implements OnInit {
  private api = inject(ApiService);
  private notificacion = inject(NotificacionService);

  protected cargando = signal(true);
  protected roles = signal<RolSimple[]>([]);
  protected permisos = signal<PermisoFila[]>([]);
  // Asignaciones actuales con llave "rol-permiso" para buscar rápido
  protected asignados = signal<Set<string>>(new Set());
  // Casillas que se están guardando (se deshabilitan mientras tanto)
  protected guardando = signal<Set<string>>(new Set());

  protected totalPorRol = computed(() => {
    const totales: Partial<Record<number, number>> = {};
    for (const llave of this.asignados()) {
      const idRol = Number(llave.split('-')[0]);
      totales[idRol] = (totales[idRol] ?? 0) + 1;
    }
    return totales;
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    forkJoin({
      roles: this.api.get<RolSimple[]>('Roles'),
      permisos: this.api.get<PermisoFila[]>('Permisos', { soloActivos: true }),
      asignaciones: this.api.get<Asignacion[]>('RolPermiso'),
    }).subscribe({
      next: r => {
        this.roles.set(r.roles.filter(rol => rol.Estado));
        this.permisos.set(r.permisos);
        this.asignados.set(new Set(r.asignaciones.map(a => this.llave(a.ID_Rol, a.ID_Permiso))));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected tiene(idRol: number, idPermiso: number): boolean {
    return this.asignados().has(this.llave(idRol, idPermiso));
  }

  protected ocupado(idRol: number, idPermiso: number): boolean {
    return this.guardando().has(this.llave(idRol, idPermiso));
  }

  // Marcar = POST (asignar); desmarcar = DELETE (quitar). Si la API rechaza, la casilla regresa como estaba
  protected cambiar(rol: RolSimple, permiso: PermisoFila, marcado: boolean): void {
    const llave = this.llave(rol.ID_Rol, permiso.ID_Permiso);
    this.marcarLocal(llave, marcado);
    this.guardando.update(s => new Set(s).add(llave));

    const peticion = marcado
      ? this.api.post('RolPermiso', { ID_Rol: rol.ID_Rol, ID_Permiso: permiso.ID_Permiso })
      : this.api.delete(`RolPermiso/${rol.ID_Rol}/${permiso.ID_Permiso}`);

    peticion.subscribe({
      next: () => {
        this.terminar(llave);
        this.notificacion.exito(`${rol.NombreRol}: ${marcado ? 'se agregó' : 'se quitó'} ${permiso.Codigo}`);
      },
      error: () => {
        this.terminar(llave);
        this.marcarLocal(llave, !marcado);
      },
    });
  }

  // Da o quita todos los permisos a un rol (uno por uno, en orden)
  protected todos(rol: RolSimple, marcar: boolean): void {
    const pendientes = this.permisos().filter(p => this.tiene(rol.ID_Rol, p.ID_Permiso) !== marcar);
    if (pendientes.length === 0) {
      return;
    }

    from(pendientes).pipe(
      concatMap(p => marcar
        ? this.api.post('RolPermiso', { ID_Rol: rol.ID_Rol, ID_Permiso: p.ID_Permiso })
        : this.api.delete(`RolPermiso/${rol.ID_Rol}/${p.ID_Permiso}`)),
      toArray(),
    ).subscribe({
      next: () => {
        this.notificacion.exito(`${rol.NombreRol}: permisos actualizados`);
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  // Exporta la matriz: una fila por permiso y una columna por rol ("Sí" cuando el rol lo tiene)
  protected exportar(): void {
    const columnas: ColumnaExcel<PermisoFila>[] = [
      { titulo: 'Código', valor: p => p.Codigo },
      { titulo: 'Permiso', valor: p => p.Nombre },
      ...this.roles().map(rol => ({
        titulo: rol.NombreRol,
        valor: (p: PermisoFila) => (this.tiene(rol.ID_Rol, p.ID_Permiso) ? 'Sí' : ''),
      })),
    ];
    exportarExcel('roles-y-permisos', this.permisos(), columnas);
  }

  private marcarLocal(llave: string, marcado: boolean): void {
    this.asignados.update(s => {
      const copia = new Set(s);
      marcado ? copia.add(llave) : copia.delete(llave);
      return copia;
    });
  }

  private terminar(llave: string): void {
    this.guardando.update(s => {
      const copia = new Set(s);
      copia.delete(llave);
      return copia;
    });
  }

  private llave(idRol: number, idPermiso: number): string {
    return `${idRol}-${idPermiso}`;
  }
}
