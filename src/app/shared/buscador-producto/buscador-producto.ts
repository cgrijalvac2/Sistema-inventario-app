import { Component, computed, input, output, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MonedaPipe } from '../../core/pipes/formato.pipes';

export interface ProductoBuscable {
  ID_Producto: number;
  CodigoProducto: string;
  NombreProducto: string;
  Precio: number;
  Stock?: number;         // existencia en el almacén actual (si se conoce)
}

// Cuadro para buscar un producto por código o nombre y agregarlo a un documento
@Component({
  selector: 'app-buscador-producto',
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatIconModule, MonedaPipe],
  template: `
    <mat-form-field class="ancho-completo">
      <mat-icon matPrefix>add_shopping_cart</mat-icon>
      <input matInput [placeholder]="etiqueta()" [value]="texto()" (input)="texto.set($any($event.target).value)"
             [matAutocomplete]="auto" [disabled]="deshabilitado()" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="elegir($event.option.value)" [displayWith]="sinTexto" [hideSingleSelectionIndicator]="true">
        @for (producto of filtrados(); track producto.ID_Producto) {
          <mat-option [value]="producto">
            <div class="opcion">
              <span><strong>{{ producto.CodigoProducto }}</strong> · {{ producto.NombreProducto }}</span>
              <span class="extra">
                @if (producto.Stock !== undefined) {
                  <span class="chip" [class.peligro]="producto.Stock <= 0" [class.exito]="producto.Stock > 0">
                    {{ producto.Stock }} disp.
                  </span>
                }
                {{ producto.Precio | moneda }}
              </span>
            </div>
          </mat-option>
        } @empty {
          <mat-option disabled>No se encontraron productos</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: `
    .opcion { display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; }
    .extra { display: flex; align-items: center; gap: 8px; color: var(--app-texto-suave); font-size: 13px; white-space: nowrap; }
  `,
})
export class BuscadorProducto {
  productos = input<ProductoBuscable[]>([]);
  etiqueta = input('Agregar producto (buscar por código o nombre)');
  deshabilitado = input(false);
  seleccionar = output<ProductoBuscable>();

  protected texto = signal('');

  protected filtrados = computed(() => {
    const texto = this.texto().toLowerCase().trim();
    return this.productos()
      .filter(p => !texto || `${p.CodigoProducto} ${p.NombreProducto}`.toLowerCase().includes(texto))
      .slice(0, 30);
  });

  // Al elegir, el cuadro queda vacío para buscar el siguiente producto
  protected sinTexto = (): string => '';

  protected elegir(producto: ProductoBuscable): void {
    this.seleccionar.emit(producto);
    this.texto.set('');
  }
}
