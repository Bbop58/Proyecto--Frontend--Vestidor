import { Injectable, signal, computed, effect } from '@angular/core';
import { NetworkStatusService } from './network-status.service';
import { OfflineStorageService } from './offline-storage.service';
import { SyncService } from './sync.service';
import { SyncBatchRequest, SyncBatchResponse, OfflineLocalOperation } from '../models/sync.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  readonly pendingCount = signal<number>(0);
  readonly isSyncing = signal<boolean>(false);
  readonly lastSyncAt = signal<Date | null>(null);
  readonly lastSyncResult = signal<SyncBatchResponse | null>(null);
  readonly lastError = signal<string | null>(null);

  constructor(
    private networkStatus: NetworkStatusService,
    private storage: OfflineStorageService,
    private syncService: SyncService
  ) {
    this.refreshPendingCount();

    // Auto-sync effect: Se activa automáticamente al reconectar
    effect(() => {
      const online = this.networkStatus.isOnline();
      const reconnected = this.networkStatus.wasOffline();

      if (online && (reconnected || this.pendingCount() > 0) && !this.isSyncing()) {
        this.syncNow();
        this.networkStatus.clearReconnectedFlag();
      }
    });
  }

  async refreshPendingCount(): Promise<number> {
    try {
      const count = await this.storage.getPendingCount();
      this.pendingCount.set(count);
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Sincroniza todas las operaciones locales pendientes enviándolas en lote al backend.
   * Criterio RNF05: Las operaciones nunca se eliminan preventivamente; se actualizan a
   * CONFIRMADA o RECHAZADA_POR_STOCK/CONFLICTO con su número de recibo o causa de fallo.
   */
  async syncNow(): Promise<SyncBatchResponse | null> {
    if (!this.networkStatus.isOnline()) {
      this.lastError.set('No se puede sincronizar en este momento: Dispositivo sin conexión.');
      return null;
    }

    if (this.isSyncing()) {
      return null;
    }

    const pendingOps = await this.storage.getPendingOperations();
    if (pendingOps.length === 0) {
      await this.refreshPendingCount();
      return null;
    }

    this.isSyncing.set(true);
    this.lastError.set(null);

    const batchRequest: SyncBatchRequest = {
      operations: pendingOps.map(op => ({
        client_operation_id: op.client_operation_id,
        operation_type: op.operation_type,
        sucursal_id: op.sucursal_id,
        cajero_id: op.cajero_id,
        cliente_id: op.cliente_id,
        fecha_local: op.fecha_local,
        items: op.items,
        monto_total: op.monto_total,
        monto_efectivo_recibido: op.monto_efectivo_recibido,
        cambio_entregado: op.cambio_entregado,
        metodo_pago: op.metodo_pago,
        notas: op.notas
      }))
    };

    try {
      const response = await firstValueFrom(this.syncService.sendBatch(batchRequest));
      this.lastSyncResult.set(response);
      this.lastSyncAt.set(new Date());

      // Actualizar el estado de cada operación en IndexedDB con el veredicto del servidor
      for (const res of response.results) {
        await this.storage.updateOperationStatus(res.client_operation_id, {
          local_status: res.status as any,
          server_receipt_number: res.receipt_number,
          server_entity_id: res.server_entity_id,
          synced_at: response.processed_at,
          error_detail: res.error_detail
        });
      }

      await this.refreshPendingCount();
      return response;
    } catch (err: any) {
      const errMsg = err?.error?.detail || err?.message || 'Error de comunicación al sincronizar lote.';
      this.lastError.set(errMsg);
      return null;
    } finally {
      this.isSyncing.set(false);
      await this.refreshPendingCount();
    }
  }

  /**
   * Guarda una venta en modo offline en IndexedDB y refresca el contador reactivo.
   */
  async queueOfflineSale(operation: OfflineLocalOperation): Promise<void> {
    await this.storage.saveOfflineOperation(operation);
    await this.refreshPendingCount();

    // Si por alguna razón estamos online, intentar sincronizar de inmediato
    if (this.networkStatus.isOnline()) {
      this.syncNow();
    }
  }

  async getAllOperations(): Promise<OfflineLocalOperation[]> {
    return await this.storage.getAllOfflineOperations();
  }
}
