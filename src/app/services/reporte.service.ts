import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, getDocs, startAfter, DocumentData, CollectionReference } from '@angular/fire/firestore';
import { doc, getDoc } from '@angular/fire/firestore';
import { ItemRowFlat, OrderDoc, Periodo } from '../models/reportes.models';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private db = inject(Firestore);
  private ordersCol(): CollectionReference<DocumentData> {
    return collection(this.db, 'orders');
  }

  private userNameCache = new Map<string, string>();

  async fetchPage(lastSnap?: any, pageSize = 50): Promise<{ rows: ItemRowFlat[], lastSnap?: any }> {
    const q = lastSnap
      ? query(this.ordersCol(), orderBy('ts', 'desc'), startAfter(lastSnap), limit(pageSize))
      : query(this.ordersCol(), orderBy('ts', 'desc'), limit(pageSize));

    const snap = await getDocs(q);
    const rows: ItemRowFlat[] = [];

    for (const d of snap.docs) {
      const ord = { id: d.id, ...d.data() } as unknown as OrderDoc;

      const usuario = await this.resolveUserName(ord.userId);
      for (const it of ord.items ?? []) {
        const p = (it?.producto ?? {});
        const nombre = p.nombre ?? p.name ?? 'Producto';
        const categoria = p.categoria ?? p.category ?? '';
        const precioARS = Number(p.precio ?? p.priceARS ?? 0);
        const precioUSD = Number(p.priceUSD ?? 0) || undefined;
        const cantidad = Number(it?.cantidad ?? 0);

        rows.push({
          orderId: ord.id!,
          ts: Number(ord.ts),
          usuario,
          producto: nombre,
          categoria,
          cantidad,
          precioARS,
          precioUSD,
          totalItemARS: cantidad * precioARS,
          totalItemUSD: precioUSD ? cantidad * precioUSD : undefined
        });
      }
    }

    const last = snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined;
    return { rows, lastSnap: last };
  }

  aggregateVentas(rows: ItemRowFlat[], periodo: Periodo): { labels: string[], data: number[] } {
    const buckets = new Map<string, number>();
    const now = Date.now();

    const from = periodo === '24h' ? now - 24*60*60*1000
               : periodo === '7d'  ? now - 7*24*60*60*1000
                                   : now - 30*24*60*60*1000;

    for (const r of rows) {
      if (r.ts < from) continue;

      const d = new Date(r.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

      buckets.set(key, (buckets.get(key) ?? 0) + r.cantidad);
    }

    const labels = Array.from(buckets.keys()).sort((a,b)=> a.localeCompare(b));
    const data = labels.map(k => buckets.get(k) ?? 0);
    return { labels, data };
  }

  topProductos(rows: ItemRowFlat[], topN = 3): { labels: string[], data: number[] } {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.producto, (map.get(r.producto) ?? 0) + r.cantidad);

    const arr = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]).slice(0, topN);
    return { labels: arr.map(x=>x[0]), data: arr.map(x=>x[1]) };
  }

  exportarCSV(hist: ItemRowFlat[]): string {
    const header = 'fecha;usuario;producto;categoria;cantidad;precioARS;precioUSD;totalItemARS;totalItemUSD;orderId';
    const rows = hist.map(r => {
      const d = new Date(r.ts);
      const fechaStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;

      const cells = [
        fechaStr,
        r.usuario,
        r.producto,
        r.categoria,
        r.cantidad,
        this.fixNum(r.precioARS),
        r.precioUSD != null ? this.fixNum(r.precioUSD) : '',
        this.fixNum(r.totalItemARS),
        r.totalItemUSD != null ? this.fixNum(r.totalItemUSD) : '',
        r.orderId
      ];

      return cells.map(c => typeof c === 'string' ? `"${c.replace(/"/g,'""')}"` : c).join(';');
    });

    return [header, ...rows].join('\n');
  }


  private async resolveUserName(uid: string): Promise<string> {
    if (this.userNameCache.has(uid)) return this.userNameCache.get(uid)!;
    const ref = doc(this.db, 'users', uid);
    const s = await getDoc(ref);
    const displayName = (s.exists() ? (s.data()?.['displayName'] as string) : null) ?? uid;
    this.userNameCache.set(uid, displayName);
    return displayName;
  }

  private fixNum(n: number | undefined): string {
    if (n == null || isNaN(n)) return '';
    return Number(n).toFixed(2);
  }
}
