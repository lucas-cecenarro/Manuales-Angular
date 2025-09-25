import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, addDoc, deleteDoc, doc,
  query, where, orderBy, collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface OrdenDTO {
  id: string;          // <-- obligatorio
  userId: string;
  ts: number;
  fecha: string;
  items: any[];
  totalARS: number;
  totalUSD: number;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private afs = inject(Firestore);

  /** Stream del historial del usuario actual (filtrado por userId) */
  facturasUsuario$(uid: string): Observable<OrdenDTO[]> {
    const ref = collection(this.afs, 'orders');
    const q = query(ref, where('userId', '==', uid), orderBy('ts', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<OrdenDTO[]>;
  }

  /** Crear una orden cumpliendo tus reglas de seguridad */
  async crearOrden(data: Omit<OrdenDTO, 'id'>): Promise<void> {
    // Reglas exigen: userId == request.auth.uid y items.size() > 0
    await addDoc(collection(this.afs, 'orders'), data);
  }

  /** Eliminar una orden por id (solo admin por reglas) */
  async eliminarOrden(id: string): Promise<void> {
    await deleteDoc(doc(this.afs, 'orders', id));
  }
}
