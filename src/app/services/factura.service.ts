import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, query, where, orderBy, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface OrdenDTO {
  id: string;      
  userId: string;
  ts: number;      
  fecha: string;  
  items: any[];    
  totalARS: number;
  totalUSD: number;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private db = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  facturasUsuario$(uid: string): Observable<OrdenDTO[]> {
    return runInInjectionContext(this.injector, () => {
      const ref = collection(this.db, 'orders');
      const q = query(ref, where('userId', '==', uid), orderBy('ts', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<OrdenDTO[]>;
    });
  }

  async crearOrden(data: Omit<OrdenDTO, 'id'>): Promise<void> {
    await addDoc(collection(this.db, 'orders'), data);
  }

  async eliminarOrden(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'orders', id));
  }
}
