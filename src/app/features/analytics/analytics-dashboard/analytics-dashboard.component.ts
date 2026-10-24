import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../core/services/analytics.service';
import {
  DemandForecastResponse,
  CustomerSegmentationResponse,
  TrainingMetricsResponse,
  DemandPredictCustomRequest,
  DemandPredictCustomResponse,
  ForecastDataPoint,
  CustomerDataPoint
} from '../../../core/models/analytics.model';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  activeTab = signal<'forecast' | 'clusters' | 'simulator'>('forecast');
  isLoading = signal<boolean>(true);
  isRetraining = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  forecastData = signal<DemandForecastResponse | null>(null);
  segmentsData = signal<CustomerSegmentationResponse | null>(null);
  trainResult = signal<TrainingMetricsResponse | null>(null);

  // Simulador de Demanda
  simulatorRequest: DemandPredictCustomRequest = {
    semana_del_ano: 48,
    mes: 11,
    temporada: 'Primavera',
    categoria_nombre: 'Poleras y Camisas',
    sucursal_nombre: 'Sucursal Central',
    ventas_semana_anterior_bs: 12500.0
  };
  simulatorResult = signal<DemandPredictCustomResponse | null>(null);
  isSimulating = signal<boolean>(false);

  // Hover Tooltips para Gráficos SVG
  hoveredForecastPoint = signal<ForecastDataPoint | null>(null);
  hoveredCustomer = signal<CustomerDataPoint | null>(null);

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.analyticsService.getForecast(4).subscribe({
      next: (fRes) => {
        this.forecastData.set(fRes);
        this.analyticsService.getCustomerSegments().subscribe({
          next: (sRes) => {
            this.segmentsData.set(sRes);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error cargando clusters:', err);
            this.isLoading.set(false);
            this.errorMessage.set('Error al cargar la segmentación de clientes.');
          }
        });
      },
      error: (err) => {
        console.error('Error cargando forecast:', err);
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar el modelo de pronóstico de demanda.');
      }
    });
  }

  retrainModels(): void {
    this.isRetraining.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.analyticsService.trainModels().subscribe({
      next: (res) => {
        this.trainResult.set(res);
        this.isRetraining.set(false);
        this.successMessage.set(
          `¡Modelos re-entrenados con éxito en ${res.tiempo_entrenamiento_ms} ms! R²=${res.supervisado.r2_score.toFixed(3)}, Silhouette=${res.no_supervisado.silhouette_score.toFixed(3)}`
        );
        // Recargar datos actualizados
        this.loadAllData();
      },
      error: (err) => {
        console.error('Error re-entrenando:', err);
        this.isRetraining.set(false);
        this.errorMessage.set('Error al re-entrenar los modelos en el servidor.');
      }
    });
  }

  runSimulation(): void {
    this.isSimulating.set(true);
    this.analyticsService.predictCustomDemand(this.simulatorRequest).subscribe({
      next: (res) => {
        this.simulatorResult.set(res);
        this.isSimulating.set(false);
      },
      error: (err) => {
        console.error('Error en simulación:', err);
        this.isSimulating.set(false);
      }
    });
  }

  // Helpers de Graficación SVG para Forecast
  getMaxSales(): number {
    const pts = this.forecastData()?.serie_temporal || [];
    if (pts.length === 0) return 20000;
    const maxReal = Math.max(...pts.map((p) => p.ventas_reales_bs || 0));
    const maxPred = Math.max(...pts.map((p) => p.demanda_proyectada_bs));
    return Math.max(maxReal, maxPred) * 1.15;
  }

  getSvgX(index: number, total: number): number {
    const padding = 50;
    const width = 650;
    if (total <= 1) return padding;
    return padding + (index / (total - 1)) * (width - 2 * padding);
  }

  getSvgY(val: number, maxVal: number): number {
    const height = 240;
    const padding = 30;
    if (maxVal <= 0) return height - padding;
    const ratio = Math.min(1.0, Math.max(0.0, val / maxVal));
    return (height - padding) - ratio * (height - 2 * padding);
  }

  getPolylinePoints(field: 'real' | 'pred'): string {
    const pts = this.forecastData()?.serie_temporal || [];
    const maxVal = this.getMaxSales();
    const result: string[] = [];

    pts.forEach((p, idx) => {
      const val = field === 'real' ? p.ventas_reales_bs : p.demanda_proyectada_bs;
      if (val !== null && val !== undefined) {
        const x = this.getSvgX(idx, pts.length);
        const y = this.getSvgY(val, maxVal);
        result.push(`${x},${y}`);
      }
    });
    return result.join(' ');
  }

  // Helpers de Graficación SVG para Scatter Plot (Frecuencia vs Gasto)
  getScatterX(freq: number): number {
    const padding = 50;
    const width = 650;
    const maxFreq = 40;
    return padding + (Math.min(maxFreq, Math.max(1, freq)) / maxFreq) * (width - 2 * padding);
  }

  getScatterY(amount: number): number {
    const height = 260;
    const padding = 30;
    const maxAmount = 14000;
    const ratio = Math.min(1.0, Math.max(0.0, amount / maxAmount));
    return (height - padding) - ratio * (height - 2 * padding);
  }

  getClusterColor(clusterId: number): string {
    const clusters = this.segmentsData()?.clusters || [];
    const c = clusters.find((item) => item.cluster_id === clusterId);
    return c ? c.color_hex : '#64748b';
  }
}
