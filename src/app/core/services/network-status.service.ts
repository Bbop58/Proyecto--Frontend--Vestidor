import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private readonly _isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  private readonly _wasOffline = signal<boolean>(false);

  readonly isOnline = computed(() => this._isOnline());
  readonly wasOffline = computed(() => this._wasOffline());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        const previouslyOffline = !this._isOnline();
        this._isOnline.set(true);
        if (previouslyOffline) {
          this._wasOffline.set(true);
        }
      });

      window.addEventListener('offline', () => {
        this._isOnline.set(false);
      });
    }
  }

  /**
   * Resetea la bandera de reconexión una vez que el sincornizador completó su ciclo.
   */
  clearReconnectedFlag(): void {
    this._wasOffline.set(false);
  }

  /**
   * Permite forzar simulación de desconexión en modo desarrollo o pruebas UI.
   */
  setManualStatus(online: boolean): void {
    this._isOnline.set(online);
  }
}
