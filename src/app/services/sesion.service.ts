import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Firebase
import { Auth, authState, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';

export interface UsuarioSesion {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'buyer' | string;
}

@Injectable({ providedIn: 'root' })
export class SesionService {
  private usuarioActualSubject = new BehaviorSubject<UsuarioSesion | null>(null);

  constructor(private auth: Auth, private db: Firestore) {
    // Mantener la sesión sincronizada con Firebase Auth + Firestore (/users/{uid})
    authState(this.auth)
      .pipe(
        switchMap((fbUser: User | null) => {
          if (!fbUser) return of(null);
          const userDoc = doc(this.db, 'users', fbUser.uid);
          return combineLatest([
            of(fbUser),
            docData(userDoc, { idField: 'id' })
          ]).pipe(
            map(([u, docData]: any) => {
              const role = docData?.role ?? 'buyer';
              const displayName = docData?.displayName ?? u.displayName ?? null;
              const email = u.email ?? docData?.email ?? null;
              const sesion: UsuarioSesion = { uid: u.uid, email, displayName, role };
              return sesion;
            })
          );
        })
      )
      .subscribe((sesion) => this.usuarioActualSubject.next(sesion));
  }

  // Observables / getters
  get usuarioActual$() { return this.usuarioActualSubject.asObservable(); }
  get usuarioActual()  { return this.usuarioActualSubject.value; }

  get isAdmin$() {
    return this.usuarioActual$.pipe(map(u => (u?.role === 'admin')));
  }
  get isAdmin() {
    return this.usuarioActual?.role === 'admin';
  }

  // Autenticación
  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
    // El authState disparará la actualización de usuarioActualSubject
  }

  async logout() {
    await signOut(this.auth);
    this.usuarioActualSubject.next(null);
  }
}
