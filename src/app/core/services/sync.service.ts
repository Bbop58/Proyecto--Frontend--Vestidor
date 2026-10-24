import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SyncBatchRequest,
  SyncBatchResponse,
  SyncHistoryItem
} from '../models/sync.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sync`;

  isSyncing = signal<boolean>(false);
  lastSyncResult = signal<SyncBatchResponse | null>(null);

  sendBatch(batch: SyncBatchRequest): Observable<SyncBatchResponse> {
    this.isSyncing.set(true);
    return this.http.post<SyncBatchResponse>(`${this.API_URL}/batch`, batch).pipe(
      tap({
        next: (resp) => {
          this.lastSyncResult.set(resp);
          this.isSyncing.set(false);
        },
        error: () => this.isSyncing.set(false)
      })
    );
  }

  getHistory(limit: number = 50): Observable<SyncHistoryItem[]> {
    return this.http.get<SyncHistoryItem[]>(`${this.API_URL}/history?limit=${limit}`);
  }
}
