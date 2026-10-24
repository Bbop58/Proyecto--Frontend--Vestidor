import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechRecognitionService } from '../../core/services/speech-recognition.service';
import { VoiceReportsService } from '../../core/services/voice-reports.service';
import { VoiceReportQueryResponse } from '../../core/models/voice-report.model';

@Component({
  selector: 'app-voice-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voice-reports.component.html',
  styleUrls: ['./voice-reports.component.css']
})
export class VoiceReportsComponent {
  speechService = inject(SpeechRecognitionService);
  reportService = inject(VoiceReportsService);

  queryText = signal<string>('');
  isLoading = signal<boolean>(false);
  isExportingExcel = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  currentReport = signal<VoiceReportQueryResponse | null>(null);
  showSql = signal<boolean>(false);

  examSuggestions = [
    {
      badge: 'R1',
      title: 'Ventas por Sucursal',
      query: 'Ventas totales agrupadas por sucursal',
      icon: 'bi-shop'
    },
    {
      badge: 'R2',
      title: 'Top 10 Prendas del Mes',
      query: 'Top 10 productos más vendidos del mes con SKU, talla, color, unidades e ingresos',
      icon: 'bi-trophy'
    },
    {
      badge: 'R3',
      title: 'Ventas por Semana',
      query: 'Gráfico de ventas por semana con total de ingresos y pedidos',
      icon: 'bi-graph-up'
    },
    {
      badge: 'R4',
      title: 'Ingresos por Categoría',
      query: 'Comparativa de ingresos por categorías',
      icon: 'bi-pie-chart'
    },
    {
      badge: 'R4b',
      title: 'Menor Existencia (Crítico)',
      query: 'Prendas con menor nivel de existencia',
      icon: 'bi-exclamation-octagon'
    }
  ];

  otherSuggestions: string[] = [
    'Clientes con mayor total de compras',
    'Ingresos agrupados por método de pago',
    'Últimas 10 ventas completadas'
  ];


  constructor() {
    // Sincronizar la transcripción en vivo del micrófono con el input
    effect(() => {
      const transcript = this.speechService.transcript();
      if (transcript) {
        this.queryText.set(transcript);
      }
    });

    // Sincronizar errores de micrófono
    effect(() => {
      const speechErr = this.speechService.error();
      if (speechErr) {
        this.errorMessage.set(speechErr);
      }
    });
  }

  toggleMicrophone(): void {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening();
    }
  }

  useSuggestion(suggestion: string): void {
    this.queryText.set(suggestion);
    this.executeQuery();
  }

  executeQuery(): void {
    const text = this.queryText().trim();
    if (!text) {
      this.errorMessage.set('Por favor escribe o di una pregunta para generar el reporte.');
      return;
    }

    // Detener micrófono si sigue escuchando
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reportService.queryReport(text).subscribe({
      next: (response) => {
        this.currentReport.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err.error?.detail || 'No se pudo generar el reporte. Por favor intenta reformular tu pregunta.';
        this.errorMessage.set(detail);
      }
    });
  }

  toggleSql(): void {
    this.showSql.update((v) => !v);
  }

  exportPdf(): void {
    const rep = this.currentReport();
    if (rep) {
      this.reportService.exportToPdf(rep);
    }
  }

  exportExcel(): void {
    const rep = this.currentReport();
    if (!rep || !rep.columnas || rep.columnas.length === 0) return;

    this.isExportingExcel.set(true);
    this.errorMessage.set(null);

    this.reportService.exportToExcel({
      pregunta: rep.pregunta,
      interpretacion: rep.interpretacion,
      columnas: rep.columnas,
      filas: rep.filas
    }).subscribe({
      next: (blob) => {
        this.isExportingExcel.set(false);
        this.reportService.downloadExcelBlob(blob);
      },
      error: (err) => {
        this.isExportingExcel.set(false);
        console.error('Error al exportar a Excel:', err);
        this.errorMessage.set('Error al generar el archivo Excel en el servidor.');
      }
    });
  }

  exportCsv(): void {

    const rep = this.currentReport();
    if (rep) {
      this.reportService.exportToCsv(rep);
    }
  }

  formatHeader(col: string): string {
    return this.reportService.formatColumnHeader(col);
  }

  formatValue(col: string, val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      const colLower = col.toLowerCase();
      if (colLower.includes('precio') || colLower.includes('monto') || colLower.includes('total') || colLower.includes('ingreso') || colLower.includes('bs')) {
        return `Bs. ${val.toFixed(2)}`;
      }
      return Number.isInteger(val) ? val.toString() : val.toFixed(2);
    }
    return String(val);
  }
}
