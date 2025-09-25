export interface Producto {
  // Identificador (Firestore usa string)
  id?: string;

  // --- Campos en inglés (Firestore nuevo)
  name?: string;
  priceARS?: number;
  category?: string;
  description?: string;
  imageUrl?: string;

  // --- Alias en español (tu UI/pipe actual)
  nombre?: string;
  precio?: number;
  categoria?: string;
  descripcion?: string;
  imagenUrl?: string;

  // Extras comunes
  stock?: number;
  active?: boolean;
  numericId?: number;  // si venías usando id numérico local
  createdAt?: any;
}

