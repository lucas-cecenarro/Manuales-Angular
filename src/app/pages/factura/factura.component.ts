import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
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
  imports: [CommonModule, FacturaPreviewComponent],
  templateUrl: './factura.component.html',
  styleUrls: ['./factura.component.scss']
})
export class FacturaComponent implements OnInit {
  items: ItemFactura[] = [];
  totalARS: number = 0;
  tipoCambioUSD: number = 1100;
  historial: any[] = [];
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'danger' | 'warning' = 'success';
  usuarioLogueado: boolean = false;
  enNavegador = false;

  constructor(
    private bcraService: BcraService,
    private carritoService: CarritoService,
    public sesionService: SesionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.enNavegador = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.enNavegador) return;

    // Reacciona a login/logout
    this.sesionService.usuarioActual$.subscribe(() => {
      this.usuarioLogueado = !!this.sesionService.usuarioActual;
      this.items = this.carritoService.obtenerItems();
      this.historial = JSON.parse(localStorage.getItem('facturas') || '[]');
      this.calcularTotal();
    });

    // Tipo de cambio (con fallback)
    this.bcraService.obtenerTipoCambioUSD().subscribe(valor => {
      this.tipoCambioUSD = Number(valor) > 0 ? Number(valor) : 1100;
      this.calcularTotal();
    });
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

  onEliminarItem(id: string): void {
    const sid = id ?? '';
    if (!sid) return;
    this.items = this.items.filter(item => String(item?.producto?.id ?? '') !== sid);
    this.calcularTotal();
    this.carritoService.eliminarProducto(sid);
  }

  confirmarCompra(): void {
    if (!this.enNavegador) return;

    const factura = {
      fecha: new Date().toLocaleString(),
      items: this.items,
      totalARS: this.totalARS,
      totalUSD: this.totalUSD
    };

    const historial = JSON.parse(localStorage.getItem('facturas') || '[]');
    historial.push(factura);
    localStorage.setItem('facturas', JSON.stringify(historial));

    this.carritoService.vaciarCarrito();
    this.items = [];
    this.totalARS = 0;
    this.mostrarAlerta('Compra confirmada y guardada en historial', 'success');
  }

  eliminarFactura(index: number): void {
    if (!this.enNavegador) return;
    this.historial.splice(index, 1);
    localStorage.setItem('facturas', JSON.stringify(this.historial));
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
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Factura', 10, 10);
    doc.setFontSize(12);
    doc.text(`Fecha: ${factura.fecha}`, 10, 20);
    let y = 30;

    factura.items.forEach((item: any, index: number) => {
      const p = item?.producto || {};
      const nombre = p.nombre ?? p.name ?? 'Producto';
      const precio = Number(p.precio ?? p.priceARS ?? 0);
      const cant = Number(item?.cantidad ?? 0);
      doc.text(`${index + 1}. ${nombre} - Cant: ${cant} - $${precio}`, 10, y);
      y += 10;
    });

    doc.text(`Total ARS: $${Number(factura.totalARS).toFixed(2)}`, 10, y + 10);
    doc.text(`Total USD: U$D${Number(factura.totalUSD).toFixed(2)}`, 10, y + 20);
    doc.save(`factura-${String(factura.fecha).replace(/[/\s:]/g, '-')}.pdf`);
  }
}
