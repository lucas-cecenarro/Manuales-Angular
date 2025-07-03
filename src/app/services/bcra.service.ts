import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BcraService {
  private url = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD';

  constructor(private http: HttpClient) {}

  obtenerTipoCambioUSD() {
    const hoy = new Date().toISOString().split('T')[0];
    return this.http.get<any[]>(`${this.url}?fechaDesde=${hoy}&fechaHasta=${hoy}`).pipe(
      map((datos) => datos.length ? datos[0].valor : null)
    );
  }
}
