export interface VerifyReceiptItem {
  variante_id: string;
  producto_nombre: string;
  talla: string;
  color: string;
  sku: string;
  cantidad_comprada: number;
  cantidad_ya_cambiada: number;
  cantidad_disponible_cambio: number;
  precio_unitario: number;
}

export interface VerifyReceiptResponse {
  valido: boolean;
  motivo_invalido?: string;
  venta_id?: string;
  numero_recibo: string;
  fecha_venta?: string;
  dias_transcurridos: number;
  dentro_del_plazo: boolean;
  plazo_maximo_dias: number;
  sucursal_id?: string;
  sucursal_nombre?: string;
  cliente_nombre?: string;
  items: VerifyReceiptItem[];
}

export interface ExchangeItemCreate {
  variante_devuelta_id: string;
  cantidad_devuelta: number;
  variante_entregada_id: string;
  cantidad_entregada: number;
}

export interface ProductExchangeCreate {
  numero_recibo: string;
  motivo: string;
  estado_prenda: string;
  metodo_pago_diferencia?: string;
  nota?: string;
  items: ExchangeItemCreate[];
}

export interface ExchangeDetailResponse {
  id: string;
  variante_devuelta_id: string;
  variante_devuelta_nombre: string;
  variante_devuelta_talla: string;
  variante_devuelta_color: string;
  variante_devuelta_sku: string;
  cantidad_devuelta: number;
  precio_unitario_devuelto: number;

  variante_entregada_id: string;
  variante_entregada_nombre: string;
  variante_entregada_talla: string;
  variante_entregada_color: string;
  variante_entregada_sku: string;
  cantidad_entregada: number;
  precio_unitario_entregado: number;

  subtotal_diferencia: number;
}

export interface ProductExchangeResponse {
  id: string;
  numero_cambio: string;
  venta_id: string;
  numero_recibo_original: string;
  sucursal_id: string;
  sucursal_nombre: string;
  cajero_id?: string;
  cajero_nombre?: string;
  cliente_id?: string;
  cliente_nombre?: string;
  fecha_cambio: string;
  dias_transcurridos: number;
  monto_total_devuelto: number;
  monto_total_entregado: number;
  diferencia: number;
  metodo_pago_diferencia: string;
  motivo: string;
  estado_prenda: string;
  nota?: string;
  detalles: ExchangeDetailResponse[];
}
