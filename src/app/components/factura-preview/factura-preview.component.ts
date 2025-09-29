import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemFactura } from '../../models/item-factura.model';
import { BcraService } from '../../services/bcra.service';

@Component({
  selector: 'app-factura-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-preview.component.html',
  styleUrls: ['./factura-preview.component.scss']
})
export class FacturaPreviewComponent implements OnInit, OnChanges {
  @Input() items: ItemFactura[] = [];
  @Output() confirmar = new EventEmitter<void>();
  @Output() eliminarItem = new EventEmitter<string>();

  totalARS: number = 0;
  tipoCambioUSD: number = 1100;

  constructor(private bcraService: BcraService) {}

  ngOnInit(): void {
    this.recalcularTotales();

    this.bcraService.obtenerTipoCambioUSD().subscribe(valor => {
      this.tipoCambioUSD = Number(valor) > 0 ? Number(valor) : 1100;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.recalcularTotales();
    }
  }

  get totalUSD(): number {
    return this.tipoCambioUSD > 0 ? this.totalARS / this.tipoCambioUSD : 0;
  }

  confirmarCompra(): void {
    this.confirmar.emit();
  }

  eliminarProducto(id: string | number | undefined): void {
    const sid = id != null ? String(id) : '';
    if (!sid) return;

    this.items = this.items.filter(item => String(item.producto?.id ?? '') !== sid);
    this.recalcularTotales();

    this.eliminarItem.emit(sid);
  }

  calcSubtotal(item: ItemFactura): number {
    const precio = Number((item?.producto as any)?.precio ?? (item?.producto as any)?.priceARS ?? 0);
    const cant = Number(item?.cantidad ?? 0);
    return precio * cant;
  }

  private recalcularTotales(): void {
    this.totalARS = this.items.reduce((acc, item) => {
      const precio = Number((item?.producto as any)?.precio ?? (item?.producto as any)?.priceARS ?? 0);
      const cant = Number(item?.cantidad ?? 0);
      return acc + (precio * cant);
    }, 0);
  }
}
