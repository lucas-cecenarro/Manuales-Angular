export interface OrderItemProducto {
  name?: string;
  nombre?: string;
  category?: string;
  categoria?: string;
  priceARS?: number;
  precio?: number;      // compat
  priceUSD?: number;    // por si existiera
}

export interface OrderItem {
  cantidad: number;
  producto: OrderItemProducto;
}

export interface OrderDoc {
  id?: string;
  userId: string;
  ts: number;              // epoch ms
  fecha?: string;          // string legible (no lo usamos para consultar)
  totalARS?: number;
  totalUSD?: number;
  items: OrderItem[];
}

export interface UserDoc {
  displayName?: string;
  email?: string;
  role?: 'admin' | 'buyer' | string;
}

export interface ItemRowFlat {
  orderId: string;
  ts: number;
  usuario: string;       // displayName
  producto: string;
  categoria: string;
  cantidad: number;
  precioARS: number;
  precioUSD?: number;
  totalItemARS: number;
  totalItemUSD?: number;
}

export type Periodo = '24h' | '7d' | '30d';
