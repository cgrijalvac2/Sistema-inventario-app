import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

// Solo deja entrar si hay sesión iniciada
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

// Revisa los permisos que pide la ruta en data: { permisos: ['VENTAS'] }
export const permisoGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const permisos = (route.data['permisos'] as string[] | undefined) ?? [];

  if (auth.tienePermiso(...permisos)) {
    return true;
  }

  inject(NotificacionService).error('No tiene permiso para entrar a esa opción');
  return inject(Router).createUrlTree(['/inicio']);
};

// Si ya inició sesión, la pantalla de login lo manda al inicio
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? inject(Router).createUrlTree(['/inicio']) : true;
};
