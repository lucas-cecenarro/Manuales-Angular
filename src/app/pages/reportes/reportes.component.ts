import { Component, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import 'chart.js/auto';
import { ReportesService } from '../../services/reporte.service';
import { ItemRowFlat, Periodo } from '../../models/reportes.models';
import { SesionService } from '../../services/sesion.service';

@Component({
  standalone: true,
  selector: 'app-reportes',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  private reportes = inject(ReportesService);
  private sesion = inject(SesionService);
  private router = inject(Router);

  rows: ItemRowFlat[] = [];
  lastSnap: any | undefined;
  cargando = false;
  periodo: Periodo = '7d'; 

  ventasLabels: string[] = [];
  ventasData: number[] = [];
  topLabels: string[] = [];
  topData: number[] = [];
  dolarLabels: string[] = [];
  dolarData: number[] = [];

  ventasCfg: ChartData<'line'> = { labels: [], datasets: [{ data: [], label: 'Unidades vendidas' }] };
  topCfg: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Top 3 productos' }] };

  async ngOnInit() {
    if (!this.sesion.isAdmin) { this.router.navigateByUrl('/'); return; }

    await this.cargarPrimeraPagina();
    this.recalcularGraficos();
  }

  ngOnDestroy() { }

  async cargarPrimeraPagina() {
    this.cargando = true;
    this.rows = [];
    const { rows, lastSnap } = await this.reportes.fetchPage(undefined, 50);
    this.rows = rows;
    this.lastSnap = lastSnap;
    this.cargando = false;
  }

  async cargarMas() {
    if (!this.lastSnap) return;
    this.cargando = true;
    const r = await this.reportes.fetchPage(this.lastSnap, 50);
    this.rows = [...this.rows, ...r.rows];
    this.lastSnap = r.lastSnap;
    this.cargando = false;
    this.recalcularGraficos();
  }

  cambiarPeriodo(p: Periodo) {
    this.periodo = p;
    this.recalcularGraficos();
  }

  private recalcularGraficos() {
    const v = this.reportes.aggregateVentas(this.rows, this.periodo);
    this.ventasCfg = { labels: v.labels, datasets: [{ data: v.data, label: 'Unidades vendidas' }] };

    const top = this.reportes.topProductos(this.rows, 3);
    this.topCfg = { labels: top.labels, datasets: [{ data: top.data, label: 'Top 3 productos' }] };
  }

  exportarCSV() {
    const csv = this.reportes.exportarCSV(this.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-compras.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  formatearFecha(ts: number) {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }
}
