export interface SupervisedModelMetrics {
  r2_score: number;
  rmse: number;
  mae: number;
  mape: number;
  muestras_entrenamiento: number;
  muestras_prueba: number;
  importancia_caracteristicas: { feature: string; importance_pct: number }[];
}

export interface UnsupervisedModelMetrics {
  silhouette_score: number;
  inercia_wss: number;
  n_clusters: number;
  total_clientes_analizados: number;
}

export interface TrainingMetricsResponse {
  supervisado: SupervisedModelMetrics;
  no_supervisado: UnsupervisedModelMetrics;
  fecha_entrenamiento: string;
  estado: string;
  tiempo_entrenamiento_ms: number;
  mensaje: string;
}

export interface ForecastDataPoint {
  periodo: string;
  semana_numero: number;
  ventas_reales_bs: number | null;
  demanda_proyectada_bs: number;
  unidades_estimadas: number;
  es_proyeccion: boolean;
}


export interface DemandForecastResponse {
  serie_temporal: ForecastDataPoint[];
  metricas: SupervisedModelMetrics;
  resumen_ejecutivo: string;
  crecimiento_proyectado_pct: number;
  total_proyectado_mes_bs: number;
}

export interface CustomerClusterCentroid {
  cluster_id: number;
  nombre_segmento: string;
  color_hex: string;
  total_clientes: number;
  porcentaje_total: number;
  recencia_promedio_dias: number;
  frecuencia_promedio_compras: number;
  gasto_promedio_bs: number;
  ticket_promedio_bs: number;
  estrategia_recomendada: string;
}

export interface CustomerDataPoint {
  cliente_id: string;
  nombre: string;
  recencia_dias: number;
  frecuencia_compras: number;
  monto_total_bs: number;
  cluster_id: number;
  cluster_nombre: string;
}

export interface CustomerSegmentationResponse {
  clusters: CustomerClusterCentroid[];
  puntos_muestra: CustomerDataPoint[];
  metricas: UnsupervisedModelMetrics;
  resumen_ejecutivo: string;
}

export interface DemandPredictCustomRequest {
  semana_del_ano: number;
  mes: number;
  temporada: string;
  categoria_nombre?: string;
  sucursal_nombre?: string;
  ventas_semana_anterior_bs?: number;
}

export interface DemandPredictCustomResponse {
  demanda_proyectada_bs: number;
  unidades_estimadas: number;
  rango_confianza_inferior_bs: number;
  rango_confianza_superior_bs: number;
  factores_principales: string[];
}
