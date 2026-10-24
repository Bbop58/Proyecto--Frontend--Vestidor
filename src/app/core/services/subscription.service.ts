import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentSubscription, SubscriptionPlan, ChangePlanRequest } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/subscriptions`;

  // Signals
  currentSubscription = signal<CurrentSubscription | null>(null);
  isLoading = signal<boolean>(false);

  // Computed state
  activePlan = computed(() => this.currentSubscription()?.plan || null);
  isPlanPro = computed(() => this.activePlan()?.codigo === 'PROFESIONAL');
  tenantInfo = computed(() => this.currentSubscription()?.tenant || null);
  tenantName = computed(() => this.tenantInfo()?.nombre || 'Mi Empresa');
  branchUsagePercent = computed(() => this.currentSubscription()?.porcentaje_sucursales_usadas || 0);

  constructor() {
    this.refreshSubscription();
  }

  getCurrentSubscription(): Observable<CurrentSubscription> {
    this.isLoading.set(true);
    return this.http.get<CurrentSubscription>(`${this.API_URL}/current`).pipe(
      tap({
        next: (sub) => {
          this.currentSubscription.set(sub);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.API_URL}/plans`);
  }

  changePlan(request: ChangePlanRequest): Observable<CurrentSubscription> {
    this.isLoading.set(true);
    return this.http.post<CurrentSubscription>(`${this.API_URL}/change-plan`, request).pipe(
      tap({
        next: (sub) => {
          this.currentSubscription.set(sub);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  refreshSubscription(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.getCurrentSubscription().subscribe({
        error: () => {
          // If not logged in yet or error, silent ignore
        }
      });
    }
  }
}
