import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TrainingMetricsResponse,
  DemandForecastResponse,
  CustomerSegmentationResponse,
  DemandPredictCustomRequest,
  DemandPredictCustomResponse
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/analytics`;

  trainModels(): Observable<TrainingMetricsResponse> {
    return this.http.post<TrainingMetricsResponse>(`${this.API_URL}/train`, {});
  }

  getForecast(weeksAhead: number = 4): Observable<DemandForecastResponse> {
    return this.http.get<DemandForecastResponse>(`${this.API_URL}/forecast?weeks_ahead=${weeksAhead}`);
  }

  getCustomerSegments(): Observable<CustomerSegmentationResponse> {
    return this.http.get<CustomerSegmentationResponse>(`${this.API_URL}/segments`);
  }

  predictCustomDemand(request: DemandPredictCustomRequest): Observable<DemandPredictCustomResponse> {
    return this.http.post<DemandPredictCustomResponse>(`${this.API_URL}/forecast/predict`, request);
  }
}
