// src/app/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, query, where, orderBy, limit
} from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private db = inject(Firestore);
  private col = collection(this.db, 'products');

  /** Listado reactivo (solo activos) */
  listarActivos$(max = 50): Observable<Producto[]> {
    const q = query(this.col, where('active','==', true), orderBy('createdAt','desc'), limit(max));
    return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
  }

  /** Traer uno por id */
  obtenerPorId$(id: string): Observable<Producto | undefined> {
    const ref = doc(this.db, 'products', id);
    return docData(ref, { idField: 'id' }) as Observable<Producto | undefined>;
  }

  /** Crear */
  crear(p: Omit<Producto, 'id'|'createdAt'>) {
    return addDoc(this.col, { ...p, createdAt: serverTimestamp() });
  }

  /** Actualizar */
  actualizar(id: string, data: Partial<Producto>) {
    const ref = doc(this.db, 'products', id);
    return updateDoc(ref, data as any);
  }

  /** Eliminar */
  eliminar(id: string) {
    const ref = doc(this.db, 'products', id);
    return deleteDoc(ref);
  }

  // ====== OPCIONAL: migración desde localStorage (ejecutar una sola vez) ======
  private claveStorage = 'productos';

  /** Sube a Firestore lo que tengas en localStorage y luego limpia localStorage */
  async migrarLocalStorageAFirestore(): Promise<{importados: number}> {
    if (typeof window === 'undefined') return { importados: 0 };

    const datos = localStorage.getItem(this.claveStorage);
    if (!datos) return { importados: 0 };

    const arr = JSON.parse(datos) as Array<Producto | any>;
    let importados = 0;

    for (const item of arr) {
      // Mapeo mínimo por si venías con campos distintos
      const docu: Omit<Producto, 'id'|'createdAt'> = {
        name: item.name ?? item.nombre ?? 'Producto',
        priceARS: Number(item.priceARS ?? item.precio ?? 0),
        stock: Number(item.stock ?? 0),
        active: item.active ?? true,
        imageUrl: item.imageUrl ?? item.imagen ?? undefined,
        numericId: typeof item.id === 'number' ? item.id : undefined
      };
      await addDoc(this.col, { ...docu, createdAt: serverTimestamp() });
      importados++;
    }

    localStorage.removeItem(this.claveStorage);
    return { importados };
  }
}
