export interface SubscriptionPlan {
  id: string;
  codigo: string; // 'BASICO' | 'PROFESIONAL'
  nombre: string;
  descripcion?: string;
  max_sucursales: number;
  permite_reportes_ia: boolean;
  permite_offline: boolean;
  precio_mensual_bob: number;
  activo: boolean;
}

export interface TenantInfo {
  id: string;
  nombre: string;
  razon_social: string;
  nit_rut: string;
  slug: string;
  logo_url?: string;
  telefono?: string;
  email_contacto?: string;
  activo: boolean;
}

export interface CurrentSubscription {
  tenant: TenantInfo;
  plan: SubscriptionPlan;
  estado: string; // 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA'
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  sucursales_usadas: number;
  sucursales_maximas: number;
  sucursales_disponibles: number;
  porcentaje_sucursales_usadas: number;
  permite_reportes_ia: boolean;
  permite_offline: boolean;
  mensaje_alerta?: string;
}

export interface ChangePlanRequest {
  plan_codigo: string;
  notas?: string;
}
