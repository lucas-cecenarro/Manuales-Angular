import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class FacturaPreviewComponent implements OnInit {
  @Input() items: ItemFactura[] = [];
  @Output() confirmar = new EventEmitter<void>();

  totalARS: number = 0;
  tipoCambioUSD: number = 1100;

  constructor(private bcraService: BcraService) { }

  ngOnInit(): void {
    this.totalARS = this.items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);

    this.bcraService.obtenerTipoCambioUSD().subscribe(valor => {
      this.tipoCambioUSD = valor || 1100;
    });
  }

  get totalUSD(): number {
    return this.totalARS / this.tipoCambioUSD;
  }

  confirmarCompra(): void {
    this.confirmar.emit();
  }

  @Output() eliminarItem = new EventEmitter<number>();

  eliminarProducto(id: number): void {
    this.eliminarItem.emit(id);
  }

  calcularTotal(): void {
    this.totalARS = this.items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  }

}



