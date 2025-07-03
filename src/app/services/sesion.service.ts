import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SesionService {
  private usuarioActualSubject = new BehaviorSubject<any>(null);

  constructor() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const datos = localStorage.getItem('usuarioActual');
    if (datos) {
      this.usuarioActualSubject.next(JSON.parse(datos));
    }
  }
}


  get usuarioActual$() {
    return this.usuarioActualSubject.asObservable(); // Para suscribirse
  }

  get usuarioActual() {
    return this.usuarioActualSubject.value; // Acceso rápido
  }

  login(usuario: any) {
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    this.usuarioActualSubject.next(usuario);
  }

  logout() {
    localStorage.removeItem('usuarioActual');
    this.usuarioActualSubject.next(null);
  }
}
