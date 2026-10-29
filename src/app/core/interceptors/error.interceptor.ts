import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

// Revisa todas las respuestas de la API: si hay error, muestra el mensaje que mandó el SP o la validación
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacion = inject(NotificacionService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.endsWith('/Auth/login');

      if (!esLogin) {
        notificacion.error(mensajeDeError(error));
      }

      if (error.status === 401 && !esLogin) {
        auth.logout();
      }

      return throwError(() => error);
    })
  );
};

export function mensajeDeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con la API. Verifique que el backend esté en ejecución.';
  }

  // Errores de negocio: { "mensaje": "..." }
  if (error.error?.mensaje) {
    return error.error.mensaje;
  }

  // Errores de validación de los DTO: { "errors": { "Campo": ["mensaje"] } }
  if (error.error?.errors) {
    const mensajes = Object.values(error.error.errors as Record<string, string[]>).flat();
    return mensajes.join(' ');
  }

  if (error.status === 404) {
    return 'El registro no existe';
  }

  return 'Ocurrió un error inesperado';
}
