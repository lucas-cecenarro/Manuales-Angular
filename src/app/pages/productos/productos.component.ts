import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { SesionService } from '../../services/sesion.service';
import { FiltroProductoPipe } from '../../pipes/filtro-producto.pipe';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FiltroProductoPipe],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  formulario: FormGroup;
  textoBusqueda: string = '';
  modoEdicion: boolean = false;
  productoEditandoId: string | null = null;

  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'danger' | 'warning' = 'success';
  usuarioLogueado: boolean = false;

  constructor(
    private productoService: ProductoService,
    private fb: FormBuilder,
    @Inject(CarritoService) private carritoService: CarritoService, // 👈 token explícito
    public sesionService: SesionService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(1)]],
      categoria: ['', Validators.required],
      imagenUrl: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.usuarioLogueado = !!this.sesionService.usuarioActual;

    this.productoService.listarActivos$().subscribe({
      next: (items) => {
        this.productos = (items || []).map(d => ({
          id: d.id,
          name: (d as any).name ?? (d as any).nombre ?? 'Producto',
          priceARS: Number((d as any).priceARS ?? (d as any).precio ?? 0),
          stock: Number((d as any).stock ?? 0),
          active: (d as any).active ?? true,
          imageUrl: (d as any).imageUrl ?? (d as any).imagenUrl ?? '',
          description: (d as any).description ?? '',
          category: (d as any).category ?? ''
        }) as unknown as Producto);
      },
      error: (err) => {
        console.error('Error listando productos:', err);
        this.mostrarAlerta('No se pudieron cargar los productos', 'danger');
      }
    });
  }

  mostrarAlerta(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    setTimeout(() => { this.mensajeAlerta = ''; }, 3000);
  }

  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto(producto);
    this.mostrarAlerta('Producto añadido al carrito', 'success');
  }

  vaciarCarrito(): void {
    this.carritoService.vaciarCarrito();
    this.mostrarAlerta('Carrito vaciado correctamente', 'warning');
  }

  editarProducto(producto: Producto): void {
    this.modoEdicion = true;
    this.productoEditandoId = (producto.id as unknown as string) ?? null;

    this.formulario.patchValue({
      nombre: (producto as any).name ?? (producto as any).nombre ?? '',
      descripcion: (producto as any).description ?? '',
      precio: (producto as any).priceARS ?? (producto as any).precio ?? null,
      categoria: (producto as any).category ?? '',
      imagenUrl: (producto as any).imageUrl ?? ''
    });

    setTimeout(() => {
      const formularioElemento = document.getElementById('formulario-producto');
      formularioElemento?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.productoEditandoId = null;
    this.formulario.reset();
  }

  eliminarProducto(id: string): void {
    this.productoService.eliminar(id)
      .then(() => this.mostrarAlerta('Producto eliminado', 'danger'))
      .catch(err => { console.error(err); this.mostrarAlerta('No se pudo eliminar', 'danger'); });
  }

  agregarProducto(): void {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const f = this.formulario.value;
    const payload = {
      name: f.nombre,
      description: f.descripcion,
      category: f.categoria,
      priceARS: Number(f.precio),
      stock: 1,
      active: true,
      imageUrl: f.imagenUrl
    };

    if (this.modoEdicion && this.productoEditandoId) {
      this.productoService.actualizar(this.productoEditandoId, payload)
        .then(() => {
          this.mostrarAlerta('Producto actualizado correctamente', 'success');
          this._resetForm();
        })
        .catch(err => {
          console.error(err);
          this.mostrarAlerta('No se pudo actualizar', 'danger');
        });
    } else {
      this.productoService.crear(payload)
        .then(() => {
          this.mostrarAlerta('Producto agregado correctamente', 'success');
          this._resetForm();
        })
        .catch(err => {
          console.error(err);
          this.mostrarAlerta('No se pudo agregar', 'danger');
        });
    }
  }

  private _resetForm(): void {
    this.modoEdicion = false;
    this.productoEditandoId = null;
    this.formulario.reset();
  }
}
