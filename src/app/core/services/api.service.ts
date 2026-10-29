import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Única puerta hacia la API. Las rutas son relativas a /api (el proxy de Angular las manda al backend)
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  get<T>(ruta: string, filtros?: Record<string, unknown>): Observable<T> {
    return this.http.get<T>(`${this.base}/${ruta}`, { params: this.parametros(filtros) });
  }

  post<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.post<T>(`${this.base}/${ruta}`, cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${ruta}`, cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.patch<T>(`${this.base}/${ruta}`, cuerpo);
  }

  delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(`${this.base}/${ruta}`);
  }

  // Convierte { idAlmacen: 1, desde: Date } en ?idAlmacen=1&desde=2026-10-01 (omite los vacíos)
  private parametros(filtros?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros ?? {})) {
      if (valor === null || valor === undefined || valor === '') {
        continue;
      }
      params = params.set(clave, valor instanceof Date ? fechaIso(valor) : String(valor));
    }
    return params;
  }
}

// Fecha local en formato yyyy-MM-dd (sin convertir a UTC)
export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
