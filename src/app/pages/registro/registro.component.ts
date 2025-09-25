import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SesionService } from '../../services/sesion.service';

// Firebase
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  registroForm: FormGroup;
  cargando = false;
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private sesionService: SesionService,
    private router: Router,
    private auth: Auth,
    private db: Firestore,
  ) {
    if (this.sesionService.usuarioActual) {
      this.router.navigate(['/productos']);
    }

    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required]
    }, { validators: this.validarCoincidencia });
  }

  validarCoincidencia(form: FormGroup) {
    const pass = form.get('password')?.value;
    const confirmar = form.get('confirmarPassword')?.value;
    return pass === confirmar ? null : { noCoinciden: true };
  }

  async onSubmit() {
    this.mensajeError = '';
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { nombre, email, password } = this.registroForm.value;

    try {
      // 1) Crear usuario en Auth
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);

      // 2) Setear displayName
      await updateProfile(cred.user, { displayName: nombre });

      // 3) Crear/mergear doc en /users/{uid}
      const uid = cred.user.uid;
      await setDoc(doc(this.db, 'users', uid), {
        displayName: nombre,
        email,
        role: 'buyer',           // 👈 todos los nuevos quedan como buyer
        createdAt: serverTimestamp()
      }, { merge: true });

      // 4) Redirigir (el SesionService se actualiza solo por authState)
      this.router.navigate(['/productos']);
    } catch (err: any) {
      const code = err?.code || '';
      this.mensajeError =
        code === 'auth/email-already-in-use' ? 'Ese email ya está registrado.' :
        code === 'auth/invalid-email'        ? 'El email no es válido.' :
        code === 'auth/weak-password'        ? 'La contraseña es muy débil (mínimo 6 caracteres).' :
        'No se pudo completar el registro.';
      console.error('Registro error:', err);
    } finally {
      this.cargando = false;
    }
  }
}
