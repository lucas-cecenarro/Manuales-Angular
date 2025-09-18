import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription, of, switchMap, map } from 'rxjs';

import { Auth, authState, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class SesionService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  private usuarioActualSubject = new BehaviorSubject<any>(null);
  private authSub?: Subscription;

  constructor() {
    // Hidratar desde localStorage (SSR-safe)
    if (typeof window !== 'undefined' && window.localStorage) {
      const datos = localStorage.getItem('usuarioActual');
      if (datos) this.usuarioActualSubject.next(JSON.parse(datos));
    }

    // Escuchar cambios de sesión y leer el rol desde Firestore: users/{uid}
    this.authSub = authState(this.auth).pipe(
      switchMap((u: User | null) => {
        if (!u) return of(null);
        const ref = doc(this.db, 'users', u.uid);
        return docData(ref).pipe(
          map((udoc: any) => ({
            uid: u.uid,
            email: u.email ?? '',
            displayName: u.displayName ?? udoc?.displayName ?? '',
            role: udoc?.role ?? 'buyer'  // por defecto buyer si no existe
          }))
        );
      })
    ).subscribe((profile) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (profile) localStorage.setItem('usuarioActual', JSON.stringify(profile));
        else localStorage.removeItem('usuarioActual');
      }
      this.usuarioActualSubject.next(profile);
    });
  }

  // Observable para suscribirse
  get usuarioActual$() {
    return this.usuarioActualSubject.asObservable();
  }

  // Acceso rápido al valor actual
  get usuarioActual() {
    return this.usuarioActualSubject.value;
  }

  // Flag de conveniencia
  get isAdmin(): boolean {
    return this.usuarioActual?.role === 'admin';
  }

  // Login con Email/Password (Authentication)
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    // El listener de authState se encargará de leer el doc users/{uid} y setear el rol
    return cred.user;
  }

  // Logout
  async logout() {
    await signOut(this.auth);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('usuarioActual');
    }
    this.usuarioActualSubject.next(null);
  }
}
