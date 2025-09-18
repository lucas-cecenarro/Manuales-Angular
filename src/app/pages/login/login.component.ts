import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SesionService } from '../../services/sesion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  mensajeError: string = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private sesionService: SesionService,
    private router: Router
  ) {
    if (this.sesionService.usuarioActual) {
      this.router.navigate(['/productos']);
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (!this.loginForm.valid || this.cargando) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.mensajeError = '';
    this.cargando = true;

    const { email, password } = this.loginForm.value;

    try {
      await this.sesionService.login(email, password); // Firebase Auth
      this.loginForm.reset();
      this.router.navigate(['/productos']);
    } catch (e: any) {
      // Errores frecuentes de Firebase Auth
      const code = e?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        this.mensajeError = 'Email o contraseña incorrectos.';
      } else if (code === 'auth/too-many-requests') {
        this.mensajeError = 'Demasiados intentos. Intentalo más tarde.';
      } else if (code === 'auth/invalid-email') {
        this.mensajeError = 'El email no es válido.';
      } else {
        this.mensajeError = 'No se pudo iniciar sesión. Intenta nuevamente.';
        console.error('Login error:', e);
      }
    } finally {
      this.cargando = false;
    }
  }
}
