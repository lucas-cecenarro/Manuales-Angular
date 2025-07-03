import { Pipe, PipeTransform } from '@angular/core';
import { Producto } from '../models/producto.model';

@Pipe({
  name: 'filtroProducto',
  standalone: true
})
export class FiltroProductoPipe implements PipeTransform {
  transform(productos: Producto[], texto: string): Producto[] {
    if (!texto || !productos) return productos;

    const textoMin = texto.toLowerCase();

    return productos.filter(p =>
      p.nombre.toLowerCase().includes(textoMin) ||
      p.categoria.toLowerCase().includes(textoMin) ||
      p.descripcion.toLowerCase().includes(textoMin) // ✅ nuevo campo
    );
  }
}
