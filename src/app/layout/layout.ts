import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/services/auth.service';
import { MENU } from '../core/menu';

// Estructura de todas las pantallas internas: menú lateral + barra superior + contenido
@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatSelectModule, MatTooltipModule,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // En pantallas pequeñas el menú se abre encima del contenido
  protected esMovil = toSignal(
    inject(BreakpointObserver).observe('(max-width: 960px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );
  protected menuAbierto = signal(!window.matchMedia('(max-width: 960px)').matches);

  // Solo se muestran las opciones para las que el usuario tiene permiso
  protected menu = computed(() =>
    MENU.map(seccion => ({
      ...seccion,
      opciones: seccion.opciones.filter(o => this.auth.tienePermiso(...o.permisos)),
    })).filter(seccion => seccion.opciones.length > 0)
  );

  // Título de la pantalla actual (viene del "title" de la ruta)
  protected titulo = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.tituloActual())
    ),
    { initialValue: this.tituloActual() }
  );

  protected iniciales = computed(() =>
    (this.auth.sesion()?.NombreCompleto ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('')
  );

  protected alNavegar(): void {
    if (this.esMovil()) {
      this.menuAbierto.set(false);
    }
  }

  protected cambiarAlmacen(idAlmacen: number): void {
    this.auth.cambiarAlmacen(idAlmacen);
    // Recarga la pantalla actual para que tome el nuevo almacén
    const url = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => this.router.navigateByUrl(url));
  }

  private tituloActual(): string {
    let ruta = this.route.snapshot;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    return ruta.title ?? '';
  }
}
