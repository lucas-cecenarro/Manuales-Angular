import { Injectable } from '@angular/core';
import { ItemFactura } from '../models/item-factura.model';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private obtenerClaveUsuario(): string {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual') || 'null');
    return usuario?.email ? `carrito_${usuario.email}` : 'carrito_anonimo';
  }

  obtenerItems(): ItemFactura[] {
    const clave = this.obtenerClaveUsuario();
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : [];
  }

  agregarProducto(producto: any): void {
    const clave = this.obtenerClaveUsuario();
    const carrito = this.obtenerItems();

    const pid = String(producto?.id ?? ''); // id normalizado a string
    const itemExistente = carrito.find(item => String(item.producto?.id ?? '') === pid);

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      carrito.push({ producto, cantidad: 1 });
    }

    localStorage.setItem(clave, JSON.stringify(carrito));
  }

  vaciarCarrito(): void {
    const clave = this.obtenerClaveUsuario();
    localStorage.removeItem(clave);
  }

  eliminarProducto(id: string | number | undefined): void {
    const clave = this.obtenerClaveUsuario();
    const sid = id != null ? String(id) : '';
    if (!sid) return;

    const items = this.obtenerItems().filter(item => String(item.producto?.id ?? '') !== sid);
    localStorage.setItem(clave, JSON.stringify(items));
  }
}
