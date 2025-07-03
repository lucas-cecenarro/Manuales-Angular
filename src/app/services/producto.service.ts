import { Injectable } from '@angular/core';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private claveStorage = 'productos';

  constructor() {}

  obtenerProductos(): Producto[] {
  if (typeof window === 'undefined') return [];

  const datos = localStorage.getItem(this.claveStorage);
  return datos ? JSON.parse(datos) : [];
}

  agregarProducto(producto: Producto) {
    const productos = this.obtenerProductos();
    productos.push(producto);
    localStorage.setItem(this.claveStorage, JSON.stringify(productos));
  }

  eliminarProducto(id: number) {
    const productos = this.obtenerProductos().filter(p => p.id !== id);
    localStorage.setItem(this.claveStorage, JSON.stringify(productos));
  }

  actualizarProducto(productoActualizado: Producto) {
    const productos = this.obtenerProductos().map(p =>
      p.id === productoActualizado.id ? productoActualizado : p
    );
    localStorage.setItem(this.claveStorage, JSON.stringify(productos));
  }
}
