import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subscription, combineLatest, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { FacturaService, OrdenDTO } from '../../services/factura.service';
import { CarritoService } from '../../services/carrito.service';
import { BcraService } from '../../services/bcra.service';
import { ItemFactura } from '../../models/item-factura.model';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { FacturaPreviewComponent } from '../../components/factura-preview/factura-preview.component';
import { SesionService } from '../../services/sesion.service';

@Component({
  selector: 'app-factura',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FacturaPreviewComponent],
  templateUrl: './factura.component.html',
  styleUrls: ['./factura.component.scss']
})
export class FacturaComponent implements OnInit, OnDestroy {
  items: ItemFactura[] = [];
  totalARS = 0;
  tipoCambioUSD = 1100;

  historial: Array<OrdenDTO> = [];

  mensajeAlerta = '';
  tipoAlerta: 'success' | 'danger' | 'warning' = 'success';
  usuarioLogueado = false;
  enNavegador = false;

  private sub?: Subscription;

  constructor(
    private bcraService: BcraService,
    private carritoService: CarritoService,
    public sesionService: SesionService,
    private facturaService: FacturaService,          
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.enNavegador = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.enNavegador) return;
    this.sub = this.sesionService.usuarioActual$.pipe(
      switchMap(user => {
        this.usuarioLogueado = !!user;
        this.items = this.carritoService.obtenerItems();
        this.calcularTotal();
        if (!user?.uid) return of([]);
        return this.facturaService.facturasUsuario$(user.uid);
      })
    ).subscribe({
      next: (docs) => {
        this.historial = (docs || []).map(d => ({
          ...d,
          totalARS: Number(d.totalARS ?? 0),
          totalUSD: Number(d.totalUSD ?? 0),
        }));
      },
      error: (e) => {
        console.error('Error cargando órdenes:', e);
        this.mostrarAlerta('No se pudo cargar tu historial', 'danger');
      }
    });

    this.bcraService.obtenerTipoCambioUSD().subscribe(valor => {
      this.tipoCambioUSD = Number(valor) > 0 ? Number(valor) : 1100;
      this.calcularTotal();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private precioUnitario(item: ItemFactura): number {
    return Number((item?.producto as any)?.precio ?? (item?.producto as any)?.priceARS ?? 0);
  }

  calcularTotal(): void {
    this.totalARS = this.items.reduce((acc, item) => {
      const precio = this.precioUnitario(item);
      const cant = Number(item?.cantidad ?? 0);
      return acc + (precio * cant);
    }, 0);
  }

  get totalUSD(): number {
    return this.tipoCambioUSD > 0 ? this.totalARS / this.tipoCambioUSD : 0;
  }

  mostrarAlerta(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    setTimeout(() => { this.mensajeAlerta = ''; }, 3000);
  }

  onCompraConfirmada(): void {
    this.confirmarCompra();
  }

  async onEliminarItem(id: string): Promise<void> {
    const sid = id ?? '';
    if (!sid) return;
    this.items = this.items.filter(item => String(item?.producto?.id ?? '') !== sid);
    this.calcularTotal();
    this.carritoService.eliminarProducto(sid);
  }

  async confirmarCompra(): Promise<void> {
    if (!this.enNavegador) return;

    const user = this.sesionService.usuarioActual;
    if (!user?.uid) {
      this.mostrarAlerta('Debés iniciar sesión para confirmar la compra.', 'warning');
      return;
    }

    if (!Array.isArray(this.items) || this.items.length === 0 || !(this.totalARS > 0)) {
      this.mostrarAlerta('Tu carrito está vacío. Agregá productos antes de confirmar.', 'warning');
      return;
    }

    const now = new Date();
    const orden: Omit<OrdenDTO, 'id'> = {
      userId: user.uid,
      ts: now.getTime(),
      fecha: now.toLocaleString(),
      items: this.items,
      totalARS: this.totalARS,
      totalUSD: this.totalUSD
    };

    try {
      await this.facturaService.crearOrden(orden);
      this.carritoService.vaciarCarrito();
      this.items = [];
      this.totalARS = 0;
      this.mostrarAlerta('Compra confirmada y guardada en tu historial', 'success');
    } catch (e) {
      console.error('Error creando orden:', e);
      this.mostrarAlerta('No se pudo confirmar la compra', 'danger');
    }
  }

  async eliminarFactura(id: string): Promise<void> {
    try {
      await this.facturaService.eliminarOrden(id);
    } catch (e) {
      console.error('Error eliminando factura:', e);
      this.mostrarAlerta('No se pudo eliminar la factura', 'danger');
    }
  }

  exportarExcel(factura: any): void {
    const datos = factura.items.map((item: any) => {
      const p = item?.producto || {};
      const nombre = p.nombre ?? p.name ?? 'Producto';
      const categoria = p.categoria ?? p.category ?? '';
      const precio = Number(p.precio ?? p.priceARS ?? 0);
      const cant = Number(item?.cantidad ?? 0);
      return { Producto: nombre, Categoría: categoria, Cantidad: cant, PrecioUnitario: precio, Subtotal: cant * precio };
    });

    datos.push({ Producto: '', Categoría: '', Cantidad: '', PrecioUnitario: 'Total ARS', Subtotal: factura.totalARS });
    datos.push({ Producto: '', Categoría: '', Cantidad: '', PrecioUnitario: 'Total USD', Subtotal: factura.totalUSD });

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Factura');
    const fecha = String(factura.fecha).replace(/[/\s:]/g, '-');
    XLSX.writeFile(libro, `factura-${fecha}.xlsx`);
  }

  exportarPDF(factura: any): void {
    const docu = new jsPDF();
    docu.setFontSize(16);
    docu.text('Factura', 10, 10);
    docu.setFontSize(12);
    docu.text(`Fecha: ${factura.fecha}`, 10, 20);
    let y = 30;

    factura.items.forEach((item: any, index: number) => {
      const p = item?.producto || {};
      const nombre = p.nombre ?? p.name ?? 'Producto';
      const precio = Number(p.precio ?? p.priceARS ?? 0);
      const cant = Number(item?.cantidad ?? 0);
      docu.text(`${index + 1}. ${nombre} - Cant: ${cant} - $${precio}`, 10, y);
      y += 10;
    });

    docu.text(`Total ARS: $${Number(factura.totalARS).toFixed(2)}`, 10, y + 10);
    docu.text(`Total USD: U$D${Number(factura.totalUSD).toFixed(2)}`, 10, y + 20);
    docu.save(`factura-${String(factura.fecha).replace(/[/\s:]/g, '-')}.pdf`);
  }
}
