import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VerifyReceiptResponse,
  ProductExchangeCreate,
  ProductExchangeResponse,
} from '../models/exchange.model';

@Injectable({
  providedIn: 'root',
})
export class ExchangeService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/cambios`;

  verifyReceipt(numeroRecibo: string): Observable<VerifyReceiptResponse> {
    return this.http.get<VerifyReceiptResponse>(
      `${this.API_URL}/verificar-recibo/${encodeURIComponent(numeroRecibo.trim())}`
    );
  }

  createExchange(data: ProductExchangeCreate): Observable<ProductExchangeResponse> {
    return this.http.post<ProductExchangeResponse>(this.API_URL, data);
  }

  getExchanges(filters?: {
    sucursal_id?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Observable<ProductExchangeResponse[]> {
    let params = new HttpParams();
    if (filters?.sucursal_id) params = params.set('sucursal_id', filters.sucursal_id);
    if (filters?.fecha_inicio) params = params.set('fecha_inicio', filters.fecha_inicio);
    if (filters?.fecha_fin) params = params.set('fecha_fin', filters.fecha_fin);
    return this.http.get<ProductExchangeResponse[]>(this.API_URL, { params });
  }

  getExchangeById(id: string): Observable<ProductExchangeResponse> {
    return this.http.get<ProductExchangeResponse>(`${this.API_URL}/${id}`);
  }
}
