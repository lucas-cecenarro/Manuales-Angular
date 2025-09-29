import { Producto } from './producto.model';

export interface ItemFactura {
  producto: Producto;
  cantidad: number;
}
