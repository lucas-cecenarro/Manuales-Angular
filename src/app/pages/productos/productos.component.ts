import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { SesionService } from '../../services/sesion.service';
import { FiltroProductoPipe } from '../../pipes/filtro-producto.pipe';

// 🔽 Firestore para leer categorías fijas
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

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

  // 🔽 categorías fijas desde Firestore
  categorias$: Observable<string[]> | undefined;

  constructor(
    private productoService: ProductoService,
    private fb: FormBuilder,
    @Inject(CarritoService) public carritoService: CarritoService,
    public sesionService: SesionService,
    private afs: Firestore
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

    // 🔁 Productos en tiempo real
    this.productoService.listarActivos$().subscribe({
      next: (items: any[]) => {
        this.productos = (items || []).map((d: any) => {
          const name = d?.name ?? d?.nombre ?? 'Producto';
          const price = Number(d?.priceARS ?? d?.precio ?? 0);
          const category = d?.category ?? d?.categoria ?? '';
          const description = d?.description ?? d?.descripcion ?? '';
          const imageUrl = d?.imageUrl ?? d?.imagenUrl ?? '';

          return {
            id: d.id,
            // “nuevos”
            name, priceARS: price, category, description, imageUrl,
            // alias para tu UI actual
            nombre: name, precio: price, categoria: category, descripcion: description, imagenUrl: imageUrl
          } as any;
        });
      },
      error: (err) => {
        console.error('Error listando productos:', err);
        this.mostrarAlerta('No se pudieron cargar los productos', 'danger');
      }
    });

    // 🔽 Leer categorías fijas desde /categories
    const ref = collection(this.afs, 'categories');
    this.categorias$ = collectionData(ref, { idField: 'id' }).pipe(
      map((docs: any[]) =>
        docs
          .map(d => (d?.name ?? '').toString())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      )
    );
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

  editarProducto(producto: any): void {
    this.modoEdicion = true;
    this.productoEditandoId = (producto.id as string) ?? null;

    this.formulario.patchValue({
      nombre: producto?.name ?? producto?.nombre ?? '',
      descripcion: producto?.description ?? producto?.descripcion ?? '',
      precio: producto?.priceARS ?? producto?.precio ?? null,
      categoria: producto?.category ?? producto?.categoria ?? '',
      imagenUrl: producto?.imageUrl ?? producto?.imagenUrl ?? ''
    });

    setTimeout(() => document.getElementById('formulario-producto')?.scrollIntoView({ behavior: 'smooth' }), 100);
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
      category: f.categoria,                  // 👈 viene del select
      priceARS: Number(f.precio),
      stock: 1,
      active: true,
      imageUrl: f.imagenUrl
    };

    const op = this.modoEdicion && this.productoEditandoId
      ? this.productoService.actualizar(this.productoEditandoId, payload)
      : this.productoService.crear(payload);

    op.then(() => {
      this.mostrarAlerta(this.modoEdicion ? 'Producto actualizado correctamente' : 'Producto agregado correctamente', 'success');
      this._resetForm();
    })
      .catch(err => {
        console.error(err);
        this.mostrarAlerta('No se pudo guardar el producto', 'danger');
      });
  }

  private _resetForm(): void {
    this.modoEdicion = false;
    this.productoEditandoId = null;
    this.formulario.reset();
  }
}
