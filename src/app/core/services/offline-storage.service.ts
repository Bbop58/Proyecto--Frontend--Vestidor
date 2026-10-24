import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineLocalOperation } from '../models/sync.model';

interface FashionStoreDB extends DBSchema {
  cached_products: {
    key: string;
    value: any;
  };
  cached_branches: {
    key: string;
    value: any;
  };
  offline_operations: {
    key: string;
    value: OfflineLocalOperation;
    indexes: { 'by_local_status': string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private dbPromise: Promise<IDBPDatabase<FashionStoreDB>> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBPDatabase<FashionStoreDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<FashionStoreDB>('FashionStoreOfflineDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('cached_products')) {
            db.createObjectStore('cached_products', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('cached_branches')) {
            db.createObjectStore('cached_branches', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('offline_operations')) {
            const store = db.createObjectStore('offline_operations', { keyPath: 'client_operation_id' });
            store.createIndex('by_local_status', 'local_status');
          }
        }
      });
    }
    return this.dbPromise;
  }

  // ── CATÁLOGO DE PRODUCTOS (CACHE LOCAL) ──
  async cacheProducts(products: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('cached_products', 'readwrite');
    for (const prod of products) {
      await tx.store.put(prod);
    }
    await tx.done;
  }

  async getCachedProducts(): Promise<any[]> {
    const db = await this.initDB();
    return await db.getAll('cached_products');
  }

  // ── SUCURSALES (CACHE LOCAL) ──
  async cacheBranches(branches: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('cached_branches', 'readwrite');
    for (const b of branches) {
      await tx.store.put(b);
    }
    await tx.done;
  }

  async getCachedBranches(): Promise<any[]> {
    const db = await this.initDB();
    return await db.getAll('cached_branches');
  }

  // ── OPERACIONES OFFLINE (VENTAS Y RESERVAS) ──
  async saveOfflineOperation(op: OfflineLocalOperation): Promise<void> {
    const db = await this.initDB();
    await db.put('offline_operations', op);
  }

  async getPendingOperations(): Promise<OfflineLocalOperation[]> {
    const db = await this.initDB();
    return await db.getAllFromIndex('offline_operations', 'by_local_status', 'LOCAL_PENDIENTE');
  }

  async getAllOfflineOperations(): Promise<OfflineLocalOperation[]> {
    const db = await this.initDB();
    return await db.getAll('offline_operations');
  }

  async updateOperationStatus(
    clientOpId: string,
    updates: Partial<OfflineLocalOperation>
  ): Promise<void> {
    const db = await this.initDB();
    const existing = await db.get('offline_operations', clientOpId);
    if (existing) {
      const merged: OfflineLocalOperation = { ...existing, ...updates };
      await db.put('offline_operations', merged);
    }
  }

  async getPendingCount(): Promise<number> {
    const db = await this.initDB();
    const count = await db.countFromIndex('offline_operations', 'by_local_status', 'LOCAL_PENDIENTE');
    return count;
  }
}
