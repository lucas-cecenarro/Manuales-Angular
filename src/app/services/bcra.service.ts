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
    // SSR guard
    if (typeof window === 'undefined') return of(null);

    const hoy = new Date().toISOString().split('T')[0];
    const endpoint = `${this.url}?fechaDesde=${hoy}&fechaHasta=${hoy}`;

    return from(fetch(endpoint)).pipe(
      switchMap(res => res.ok ? from(res.json()) : of([])),
      map((datos: any[]) => (Array.isArray(datos) && datos.length ? Number(datos[0]?.valor) : null)),
      catchError(() => of(null))
    );
  }
}
