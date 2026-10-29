import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PIPES_FORMATO } from '../../core/pipes/formato.pipes';
import { Existencia, Indicadores, TopProducto, VentaDia } from '../../core/models/modelos';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatButtonToggleModule, MatProgressBarModule, ...PIPES_FORMATO],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);

  protected cargando = signal(true);
  protected soloAlmacen = signal(true);   // true = almacén actual, false = todos
  protected indicadores = signal<Indicadores | null>(null);
  protected ventasDia = signal<VentaDia[]>([]);
  protected top = signal<TopProducto[]>([]);
  protected stockBajo = signal<Existencia[]>([]);

  protected saludo = computed(() => {
    const hora = new Date().getHours();
    const nombre = this.auth.sesion()?.NombreCompleto.split(' ')[0] ?? '';
    return `${hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'}, ${nombre}`;
  });

  // Altura de cada barra de la gráfica en porcentaje respecto al día con más ventas
  protected barras = computed(() => {
    const dias = this.ventasDia();
    const maximo = Math.max(...dias.map(d => d.Total), 1);
    return dias.map(d => ({
      ...d,
      altura: Math.max((d.Total / maximo) * 100, d.Total > 0 ? 4 : 1),
      etiqueta: new Intl.DateTimeFormat('es-GT', { weekday: 'short', day: 'numeric' }).format(new Date(d.Fecha)),
    }));
  });

  protected totalSemana = computed(() => this.ventasDia().reduce((suma, d) => suma + d.Total, 0));
  protected maximoTop = computed(() => Math.max(...this.top().map(t => t.Cantidad), 1));

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarAlcance(soloAlmacen: boolean): void {
    this.soloAlmacen.set(soloAlmacen);
    this.cargar();
  }

  protected cargar(): void {
    const filtro = { idAlmacen: this.soloAlmacen() ? this.auth.idAlmacen() : null };
    this.cargando.set(true);

    forkJoin({
      indicadores: this.api.get<Indicadores>('Dashboard/indicadores', filtro),
      ventas: this.api.get<VentaDia[]>('Dashboard/ventas-por-dia', { ...filtro, dias: 7 }),
      top: this.api.get<TopProducto[]>('Dashboard/top-productos', filtro),
      stockBajo: this.api.get<Existencia[]>('Inventario/stock-bajo', filtro),
    }).subscribe({
      next: r => {
        this.indicadores.set(r.indicadores);
        this.ventasDia.set(r.ventas);
        this.top.set(r.top);
        this.stockBajo.set(r.stockBajo.slice(0, 6));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
