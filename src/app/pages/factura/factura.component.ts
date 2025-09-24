import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subscription, combineLatest, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { CarritoService } from '../../services/carrito.service';
import { BcraService } from '../../services/bcra.service';
import { ItemFactura } from '../../models/item-factura.model';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { FacturaPreviewComponent } from '../../components/factura-preview/factura-preview.component';
import { SesionService } from '../../services/sesion.service';

// Firestore
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, query, where, orderBy } from '@angular/fire/firestore';

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

  // historial desde Firestore
  historial: Array<any & { id: string }> = [];

  mensajeAlerta = '';
  tipoAlerta: 'success' | 'danger' | 'warning' = 'success';
  usuarioLogueado = false;
  enNavegador = false;

  private sub?: Subscription;

  constructor(
    private bcraService: BcraService,
    private carritoService: CarritoService,
    public sesionService: SesionService,
    private afs: Firestore,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.enNavegador = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.enNavegador) return;

    // Reaccionar a login/logout
    this.sub = this.sesionService.usuarioActual$.pipe(
      switchMap(user => {
        this.usuarioLogueado = !!user;
        // refrescar items y totales cada cambio de usuario
        this.items = this.carritoService.obtenerItems();
        this.calcularTotal();

        if (!user?.uid) {
          this.historial = [];
          return of([]);
        }

        // leer órdenes del usuario autenticado, más reciente primero
        const ref = collection(this.afs, 'orders');
        const q = query(ref, where('userId', '==', user.uid), orderBy('ts', 'desc'));
        return collectionData(q, { idField: 'id' });
      })
    ).subscribe({
      next: (docs: any[]) => {
        this.historial = (docs || []).map(d => ({
          id: d.id,
          ts: d.ts ?? 0,
          fecha: d.fecha ?? '',
          items: d.items ?? [],
          totalARS: Number(d.totalARS ?? 0),
          totalUSD: Number(d.totalUSD ?? 0),
        }));
      },
      error: (e) => {
        console.error('Error cargando órdenes:', e);
        this.mostrarAlerta('No se pudo cargar tu historial', 'danger');
      }
    });

    // Tipo de cambio
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

  // ahora recibe id de documento en Firestore
  async onEliminarItem(id: string): Promise<void> {
    const sid = id ?? '';
    if (!sid) return;

    this.items = this.items.filter(item => String(item?.producto?.id ?? '') !== sid);
    this.calcularTotal();
    this.carritoService.eliminarProducto(sid);
  }

  // ====== FIRESTORE: crear orden por usuario ======
  async confirmarCompra(): Promise<void> {
    if (!this.enNavegador) return;

    const user = this.sesionService.usuarioActual;
    if (!user?.uid) {
      this.mostrarAlerta('Debés iniciar sesión para confirmar la compra.', 'warning');
      return;
    }

    const itemsValidos = Array.isArray(this.items) && this.items.length > 0;
    const totalValido = Number.isFinite(this.totalARS) && this.totalARS > 0;

    if (!itemsValidos || !totalValido) {
      this.mostrarAlerta('Tu carrito está vacío. Agregá productos antes de confirmar.', 'warning');
      return;
    }

    const now = new Date();
    const orden = {
      userId: user.uid,
      ts: now.getTime(),
      fecha: now.toLocaleString(),
      items: this.items,
      totalARS: this.totalARS,
      totalUSD: this.totalUSD
    };

    try {
      await addDoc(collection(this.afs, 'orders'), orden);

      // limpiar carrito local (solo items del usuario)
      this.carritoService.vaciarCarrito();
      this.items = [];
      this.totalARS = 0;

      this.mostrarAlerta('Compra confirmada y guardada en tu historial', 'success');
    } catch (e) {
      console.error('Error creando orden:', e);
      this.mostrarAlerta('No se pudo confirmar la compra', 'danger');
    }
  }

  // ====== FIRESTORE: eliminar orden por id ======
  async eliminarFactura(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.afs, 'orders', id));
    } catch (e) {
      console.error('Error eliminando factura:', e);
      this.mostrarAlerta('No se pudo eliminar la factura', 'danger');
    }
  }

  // ====== Exportaciones (sin cambios estructurales) ======
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
