import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SesionService } from '../../services/sesion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  mensajeError = '';
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
    this.mensajeError = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.cargando = true;
    try {
      await this.sesionService.login(email, password);
      this.router.navigate(['/productos']);
    } catch (err: any) {
      const code = err?.code || '';
      this.mensajeError =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Email o contraseña incorrectos.'
          : code === 'auth/user-not-found'
          ? 'No existe un usuario con ese email.'
          : 'No se pudo iniciar sesión.';
      console.error('Login error:', err);
    } finally {
      this.cargando = false;
    }
  }
}
