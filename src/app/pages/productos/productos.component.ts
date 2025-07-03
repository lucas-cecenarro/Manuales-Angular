import { Component, OnInit } from '@angular/core';
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
  productoEditandoId: number | null = null;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'danger' | 'warning' = 'success';
  usuarioLogueado: boolean = false;

  constructor(
    private productoService: ProductoService,
    private fb: FormBuilder,
    private carritoService: CarritoService,
    private sesionService: SesionService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(1)]],
      categoria: ['', Validators.required],
      imagenUrl: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.usuarioLogueado = !!this.sesionService.usuarioActual;
    this.productos = this.productoService.obtenerProductos();
  }

  mostrarAlerta(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;

    setTimeout(() => {
      this.mensajeAlerta = '';
    }, 3000);
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
    this.productoEditandoId = producto.id;
    this.formulario.patchValue(producto);

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

  eliminarProducto(id: number): void {
    this.productoService.eliminarProducto(id);
    this.productos = this.productoService.obtenerProductos();
    this.mostrarAlerta('Producto eliminado', 'danger');
  }

  agregarProducto(): void {
    if (this.formulario.valid) {
      const productoForm = this.formulario.value;

      if (this.modoEdicion && this.productoEditandoId !== null) {
        const productoActualizado: Producto = {
          id: this.productoEditandoId,
          ...productoForm
        };
        this.productoService.actualizarProducto(productoActualizado);
        this.mostrarAlerta('Producto actualizado correctamente', 'success');
      } else {
        const nuevoProducto: Producto = {
          id: Date.now(),
          ...productoForm
        };
        this.productoService.agregarProducto(nuevoProducto);
        this.mostrarAlerta('Producto agregado correctamente', 'success');
      }

      this.modoEdicion = false;
      this.productoEditandoId = null;
      this.formulario.reset();
      this.productos = this.productoService.obtenerProductos();
    } else {
      this.formulario.markAllAsTouched();
    }
  }
}
