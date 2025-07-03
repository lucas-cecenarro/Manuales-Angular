import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CarritoService } from '../../services/carrito.service';
import { BcraService } from '../../services/bcra.service';
import { ItemFactura } from '../../models/item-factura.model';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { FacturaPreviewComponent } from '../../components/factura-preview/factura-preview.component';

@Component({
  selector: 'app-factura',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FacturaPreviewComponent],
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
  enNavegador = false;

  constructor(
    private bcraService: BcraService,
    private carritoService: CarritoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.enNavegador = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.enNavegador) return;

    this.historial = JSON.parse(localStorage.getItem('facturas') || '[]');
    this.items = this.carritoService.obtenerItems();

    this.bcraService.obtenerTipoCambioUSD().subscribe(valor => {
      this.tipoCambioUSD = valor || 1100;
      this.calcularTotal();
    });
  }

  calcularTotal(): void {
    this.totalARS = this.items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  }

  get totalUSD(): number {
    return this.totalARS / this.tipoCambioUSD;
  }

  mostrarAlerta(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    setTimeout(() => {
      this.mensajeAlerta = '';
    }, 3000);
  }

  onCompraConfirmada(): void {
  this.confirmarCompra();
  }

  onEliminarItem(id: number): void {
    this.items = this.items.filter(item => item.producto.id !== id);
    this.totalARS = this.items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
    this.carritoService.eliminarProducto(id);
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
    const datos = factura.items.map((item: any) => ({
      Producto: item.producto.nombre,
      Categoría: item.producto.categoria,
      Cantidad: item.cantidad,
      PrecioUnitario: item.producto.precio,
      Subtotal: item.cantidad * item.producto.precio
    }));

    datos.push({
      Producto: '',
      Categoría: '',
      Cantidad: '',
      PrecioUnitario: 'Total ARS',
      Subtotal: factura.totalARS
    });

    datos.push({
      Producto: '',
      Categoría: '',
      Cantidad: '',
      PrecioUnitario: 'Total USD',
      Subtotal: factura.totalUSD
    });

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Factura');
    const fecha = factura.fecha.replace(/[/\s:]/g, '-');
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
      doc.text(`${index + 1}. ${item.producto.nombre} - Cant: ${item.cantidad} - $${item.producto.precio}`, 10, y);
      y += 10;
    });

    doc.text(`Total ARS: $${factura.totalARS.toFixed(2)}`, 10, y + 10);
    doc.text(`Total USD: U$D${factura.totalUSD.toFixed(2)}`, 10, y + 20);

    doc.save(`factura-${factura.fecha.replace(/[/\s:]/g, '-')}.pdf`);
  }
}
