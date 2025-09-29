import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

  private injector = inject(EnvironmentInjector);

  constructor(private auth: Auth, private db: Firestore) {
    authState(this.auth)
      .pipe(
        switchMap((fbUser: User | null) => {
          if (!fbUser) return of(null);

          const userDoc = doc(this.db, 'users', fbUser.uid);

          const combined$ = runInInjectionContext(this.injector, () =>
            combineLatest([
              of(fbUser),
              docData(userDoc, { idField: 'id' })
            ])
          );

          return combined$.pipe(
            map(([u, docData]: any) => {
              const role = docData?.role ?? 'buyer';
              const displayName = docData?.displayName ?? u.displayName ?? null;
              const email = u.email ?? docData?.email ?? null;
              return { uid: u.uid, email, displayName, role } as UsuarioSesion;
            })
          );
        })
      )
      .subscribe((sesion) => this.usuarioActualSubject.next(sesion));
  }

  get usuarioActual$() { return this.usuarioActualSubject.asObservable(); }
  get usuarioActual() { return this.usuarioActualSubject.value; }

  get isAdmin$() {
    return this.usuarioActual$.pipe(map(u => (u?.role === 'admin')));
  }
  get isAdmin() {
    return this.usuarioActual?.role === 'admin';
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    await signOut(this.auth);
    this.usuarioActualSubject.next(null);
  }
}
