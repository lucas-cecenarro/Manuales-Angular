import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, query, where, orderBy, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface OrdenDTO {
  id: string;       // asignado con { idField: 'id' }
  userId: string;
  ts: number;       // epoch ms
  fecha: string;    // string legible
  items: any[];     // [{ cantidad, producto: {...} }, ...]
  totalARS: number;
  totalUSD: number;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private db = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  /**
   * Stream de órdenes del usuario (ordenadas por ts desc).
   * Envuelto en runInInjectionContext para evitar:
   * "Firebase API called outside injection context: collectionData".
   */
  facturasUsuario$(uid: string): Observable<OrdenDTO[]> {
    return runInInjectionContext(this.injector, () => {
      const ref = collection(this.db, 'orders');
      const q = query(ref, where('userId', '==', uid), orderBy('ts', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<OrdenDTO[]>;
    });
  }

  /** Crear una orden (las reglas verifican userId == auth.uid e items > 0) */
  async crearOrden(data: Omit<OrdenDTO, 'id'>): Promise<void> {
    await addDoc(collection(this.db, 'orders'), data);
  }

  /** Eliminar una orden (por reglas: sólo admin) */
  async eliminarOrden(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'orders', id));
  }
}
