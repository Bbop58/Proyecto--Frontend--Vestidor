export interface SyncItem {
  variante_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface SyncOperationItem {
  client_operation_id: string;
  operation_type: 'VENTA_CONTADO_OFFLINE' | 'RESERVA_OFFLINE';
  sucursal_id: string;
  cajero_id?: string;
  cliente_id?: string;
  fecha_local: string;
  items: SyncItem[];
  monto_total: number;
  monto_efectivo_recibido?: number;
  cambio_entregado?: number;
  metodo_pago?: string;
  notas?: string;
}

export interface SyncBatchRequest {
  operations: SyncOperationItem[];
}

export interface SyncOperationResult {
  client_operation_id: string;
  status: 'CONFIRMADA' | 'RECHAZADA_POR_STOCK' | 'CONFLICTO';
  is_duplicate: boolean;
  receipt_number?: string;
  server_entity_id?: string;
  message: string;
  error_detail?: string;
}

export interface SyncBatchResponse {
  processed_at: string;
  total_received: number;
  total_confirmed: number;
  total_rejected: number;
  total_duplicates: number;
  results: SyncOperationResult[];
}

export interface SyncHistoryItem {
  id: string;
  client_operation_id: string;
  tenant_id: string;
  branch_id: string;
  operation_type: string;
  sync_status: 'CONFIRMADA' | 'RECHAZADA_POR_STOCK' | 'CONFLICTO';
  client_created_at: string;
  created_at: string;
  entity_id?: string;
  error_detail?: string;
}

export interface OfflineLocalOperation extends SyncOperationItem {
  local_status: 'LOCAL_PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA_POR_STOCK' | 'CONFLICTO';
  server_receipt_number?: string;
  server_entity_id?: string;
  synced_at?: string;
  error_detail?: string;
  items_summary?: string; // Para visualización rápida en UI
}

