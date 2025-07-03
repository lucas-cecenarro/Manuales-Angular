import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  mensajeError: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    // Inicializa el formulario
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Verifica si ya está logueado como admin
    if (typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true') {
      this.router.navigate(['/admin']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      // Validación fija del único usuario administrador
      if (username === 'admin' && password === 'admin.1') {
        localStorage.setItem('isAdmin', 'true');
        this.router.navigate(['/admin']);
      } else {
        this.mensajeError = 'Usuario o contraseña incorrectos.';
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
