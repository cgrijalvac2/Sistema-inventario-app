import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AlmacenSimple, Sesion } from '../models/modelos';

const CLAVE_SESION = 'inventario.sesion';
const CLAVE_ALMACEN = 'inventario.almacen';

// Guarda quién inició sesión, sus permisos y el almacén en el que está trabajando
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly sesion = signal<Sesion | null>(leer<Sesion>(CLAVE_SESION));
  readonly idAlmacen = signal<number | null>(leer<number>(CLAVE_ALMACEN));

  readonly autenticado = computed(() => this.sesion() !== null);
  readonly almacenes = computed<AlmacenSimple[]>(() => this.sesion()?.Almacenes ?? []);
  readonly almacenActual = computed(() => this.almacenes().find(a => a.ID_Almacen === this.idAlmacen()) ?? null);

  login(correo: string, password: string): Observable<Sesion> {
    return this.api.post<Sesion>('Auth/login', { CorreoElectronico: correo, Password: password }).pipe(
      tap(sesion => {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        this.sesion.set(sesion);

        // Conserva el almacén anterior si todavía tiene acceso; si no, usa el primero
        const anterior = sesion.Almacenes.find(a => a.ID_Almacen === this.idAlmacen());
        this.cambiarAlmacen(anterior?.ID_Almacen ?? sesion.Almacenes[0]?.ID_Almacen ?? null);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
    this.router.navigate(['/login']);
  }

  cambiarAlmacen(idAlmacen: number | null): void {
    this.idAlmacen.set(idAlmacen);
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(idAlmacen));
  }

  // Sin permisos indicados = cualquier usuario autenticado
  tienePermiso(...permisos: string[]): boolean {
    const propios = this.sesion()?.Permisos ?? [];
    return permisos.length === 0 || permisos.some(p => propios.includes(p));
  }

  get idUsuario(): number {
    return this.sesion()?.ID_Usuario ?? 0;
  }
}

function leer<T>(clave: string): T | null {
  try {
    const valor = localStorage.getItem(clave);
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}
