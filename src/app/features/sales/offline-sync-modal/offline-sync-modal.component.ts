import { Component, inject, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { OfflineLocalOperation } from '../../../core/models/sync.model';

@Component({
  selector: 'app-offline-sync-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-card glass-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2">
            <div class="status-indicator-dot" [class.online]="networkStatus.isOnline()" [class.offline]="!networkStatus.isOnline()"></div>
            <div>
              <h3 class="modal-title m-0">Centro de Sincronización Offline (PWA)</h3>
              <p class="modal-subtitle m-0">Gestión de operaciones comerciales locales en IndexedDB</p>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="close()">×</button>
        </div>

        <div class="modal-body">
          <!-- Connection & Queue Status Bar -->
          <div class="status-summary-bar">
            <div class="summary-col">
              <span class="label">Conectividad:</span>
              <span class="val" [class.text-success]="networkStatus.isOnline()" [class.text-danger]="!networkStatus.isOnline()">
                <i class="bi" [class.bi-wifi]="networkStatus.isOnline()" [class.bi-wifi-off]="!networkStatus.isOnline()"></i>
                {{ networkStatus.isOnline() ? 'En Línea (Conectado)' : 'Sin Conexión (Modo Local)' }}
              </span>
            </div>
            <div class="summary-col">
              <span class="label">Operaciones Pendientes:</span>
              <span class="val font-bold" [class.text-warning]="syncQueue.pendingCount() > 0">
                {{ syncQueue.pendingCount() }} en cola
              </span>
            </div>
            <div class="summary-col text-end">
              <button 
                class="btn btn-primary btn-sm"
                [disabled]="!networkStatus.isOnline() || syncQueue.isSyncing() || syncQueue.pendingCount() === 0"
                (click)="onManualSync()">
                <i class="bi" [class.bi-arrow-repeat]="!syncQueue.isSyncing()" [class.bi-hourglass-split]="syncQueue.isSyncing()"></i>
                {{ syncQueue.isSyncing() ? 'Sincronizando...' : 'Sincronizar Lote Ahora' }}
              </button>
            </div>
          </div>

          @if (syncQueue.lastError()) {
            <div class="alert alert-error my-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <span>{{ syncQueue.lastError() }}</span>
            </div>
          }

          @if (syncQueue.lastSyncResult(); as res) {
            <div class="alert alert-success my-3">
              <i class="bi bi-check-circle-fill me-2"></i>
              <span>Último lote: <strong>{{ res.total_confirmed }} confirmadas</strong>, {{ res.total_rejected }} rechazadas, {{ res.total_duplicates }} reintentos duplicados.</span>
            </div>
          }

          <!-- Transactions Table -->
          <h4 class="section-title">Registro de Transacciones en este Dispositivo</h4>
          <div class="table-container">
            @if (operations().length === 0) {
              <div class="empty-state">
                <i class="bi bi-inbox fs-1 text-muted"></i>
                <p class="mt-2 text-muted">No hay operaciones locales registradas en este dispositivo.</p>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha Local</th>
                    <th>Tipo</th>
                    <th>Items</th>
                    <th class="text-end">Total</th>
                    <th class="text-center">Estado Local</th>
                    <th>Recibo / Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  @for (op of operations(); track op.client_operation_id) {
                    <tr>
                      <td class="text-xs text-muted">
                        {{ op.fecha_local | date:'dd/MM/yyyy HH:mm:ss' }}
                      </td>
                      <td>
                        <span class="badge-type">{{ op.operation_type === 'VENTA_CONTADO_OFFLINE' ? 'Venta Contado' : 'Reserva' }}</span>
                      </td>
                      <td class="text-xs">
                        {{ op.items_summary || (op.items.length + ' item(s)') }}
                      </td>
                      <td class="text-end font-bold">
                        {{ op.monto_total | number:'1.2-2' }} Bs.
                      </td>
                      <td class="text-center">
                        @if (op.local_status === 'LOCAL_PENDIENTE') {
                          <span class="status-pill status-pending">
                            <i class="bi bi-clock-history"></i> Pendiente
                          </span>
                        } @else if (op.local_status === 'CONFIRMADA') {
                          <span class="status-pill status-confirmed">
                            <i class="bi bi-check2-all"></i> Sincronizada
                          </span>
                        } @else if (op.local_status === 'RECHAZADA_POR_STOCK') {
                          <span class="status-pill status-rejected">
                            <i class="bi bi-x-octagon"></i> Sin Stock
                          </span>
                        } @else {
                          <span class="status-pill status-conflict">
                            <i class="bi bi-exclamation-diamond"></i> Conflicto
                          </span>
                        }
                      </td>
                      <td class="text-xs">
                        @if (op.server_receipt_number) {
                          <span class="receipt-tag">{{ op.server_receipt_number }}</span>
                        } @else if (op.error_detail) {
                          <span class="text-danger" [title]="op.error_detail">{{ op.error_detail | slice:0:35 }}...</span>
                        } @else {
                          <span class="text-muted">UUID: {{ op.client_operation_id | slice:0:8 }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="close()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(2, 6, 23, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-card {
      width: 100%;
      max-width: 850px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .status-indicator-dot.online {
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .status-indicator-dot.offline {
      background: #ef4444;
      box-shadow: 0 0 10px #ef4444;
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
    .status-summary-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .summary-col .label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-col .val {
      font-size: 0.95rem;
      font-weight: 600;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .table-container {
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
    }
    .badge-type {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      font-weight: 600;
    }
    .status-pill {
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .status-pending {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
    .status-confirmed {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .status-rejected {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .status-conflict {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
    }
    .receipt-tag {
      font-family: monospace;
      font-weight: 600;
      color: #38bdf8;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
    }
    .empty-state {
      padding: 3rem;
      text-align: center;
    }
  `]
})
export class OfflineSyncModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  networkStatus = inject(NetworkStatusService);
  syncQueue = inject(SyncQueueService);

  operations = signal<OfflineLocalOperation[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadOperations();
  }

  async loadOperations(): Promise<void> {
    const list = await this.syncQueue.getAllOperations();
    // Ordenar de más reciente a más antigua
    list.sort((a, b) => new Date(b.fecha_local).getTime() - new Date(a.fecha_local).getTime());
    this.operations.set(list);
  }

  async onManualSync(): Promise<void> {
    await this.syncQueue.syncNow();
    await this.loadOperations();
  }

  close(): void {
    this.closed.emit();
  }
}
