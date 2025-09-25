import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AdminComponent implements OnInit {
  manualForm: FormGroup;
  categorias: string[] = ['Informática', 'Ingeniería', 'Marketing', 'Diseño', 'Programación', 'Educación', 'Salud'];
  portadaPreview: string | null = null;
  archivoNombre: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.manualForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      precioUSD: ['', [Validators.required, Validators.min(0)]],
      categoria: ['', Validators.required],
      portada: [null, Validators.required],
      archivo: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      this.router.navigate(['/login']);
    }
  }

  onPortadaChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.manualForm.patchValue({ portada: file });

      // Mostrar vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.portadaPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onArchivoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.manualForm.patchValue({ archivo: file });
      this.archivoNombre = file.name;
    }
  }

  onSubmit() {
    if (this.manualForm.valid) {
      const formData = new FormData();
      formData.append('titulo', this.manualForm.get('titulo')?.value);
      formData.append('descripcion', this.manualForm.get('descripcion')?.value);
      formData.append('precioUSD', this.manualForm.get('precioUSD')?.value);
      formData.append('categoria', this.manualForm.get('categoria')?.value);
      formData.append('portada', this.manualForm.get('portada')?.value);
      formData.append('archivo', this.manualForm.get('archivo')?.value);

      // Por ahora simulamos la carga (más adelante se conecta al backend o localStorage)
      console.log('Manual cargado:', this.manualForm.value);
      alert('Manual cargado correctamente (simulado)');
      this.manualForm.reset();
      this.portadaPreview = null;
      this.archivoNombre = '';
    } else {
      this.manualForm.markAllAsTouched();
    }
  }
}
