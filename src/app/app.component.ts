import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SesionService } from './services/sesion.service';
import { CarritoService } from './services/carrito.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'proyecto-angular-aied';
  usuarioLogueado: any = null;
  cantidadCarrito: number = 0;
  enNavegador: boolean = false;

  constructor(
    private router: Router,
    private sesionService: SesionService,
    private carritoService: CarritoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.enNavegador = isPlatformBrowser(this.platformId);

    this.sesionService.usuarioActual$.subscribe(usuario => {
      this.usuarioLogueado = usuario;
      if (this.enNavegador) {
        this.actualizarCantidad();
      }
    });
  }

  cerrarSesion() {
    this.sesionService.logout();
    this.cantidadCarrito = 0;
    this.router.navigate(['/']);
  }

  actualizarCantidad() {
    if (!this.enNavegador) return;

    const items = this.carritoService.obtenerItems();
    this.cantidadCarrito = items.reduce((acc, item) => acc + item.cantidad, 0);
  }
}
