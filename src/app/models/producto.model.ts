export interface Producto {
  id?: string;

  // inglés
  name?: string;
  priceARS?: number;
  category?: string;
  description?: string;
  imageUrl?: string;

  // español 
  nombre?: string;
  precio?: number;
  categoria?: string;
  descripcion?: string;
  imagenUrl?: string;

  // Extras 
  stock?: number;
  active?: boolean;
  numericId?: number;  
  createdAt?: any;
}

