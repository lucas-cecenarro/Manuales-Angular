import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SesionService } from '../../services/sesion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',

  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  registroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sesionService: SesionService,
    private router: Router
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

  onSubmit() {
    if (this.registroForm.valid) {
      const usuario = this.registroForm.value;
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      usuarios.push(usuario);
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
      alert('Usuario registrado correctamente ✅');
      this.registroForm.reset();
    } else {
      this.registroForm.markAllAsTouched();
    }
  }
}
