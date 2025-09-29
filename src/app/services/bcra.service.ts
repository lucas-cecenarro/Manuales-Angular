import { Injectable } from '@angular/core';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BcraService {
  private url = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD';

  constructor() {}

  obtenerTipoCambioUSD() {
  if (typeof window === 'undefined') return of(null);

  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);
  const hace7 = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  const endpoint = `${this.url}?fechaDesde=${hace7}&fechaHasta=${hoyStr}`;

  const getCache = (): number | null => {
    try {
      const raw = localStorage.getItem('usd_bcra_cache');
      if (!raw) return null;
      const { d, v } = JSON.parse(raw);
      return d === hoyStr ? Number(v) : null;
    } catch { return null; }
  };
  const setCache = (v: number) => {
    try { localStorage.setItem('usd_bcra_cache', JSON.stringify({ d: hoyStr, v })); } catch {}
  };

  return from(fetch(endpoint)).pipe(
    switchMap(res => res.ok ? from(res.json()) : of([])),
    map((datos: any[]) => {
      if (!Array.isArray(datos) || datos.length === 0) {
        return getCache(); 
      }
      const last = datos[datos.length - 1];
      const val = Number(last?.valor);
      if (val > 0) setCache(val);
      return val > 0 ? val : (getCache() ?? null);
    }),
    catchError(() => of(getCache()))
  );
}
}
