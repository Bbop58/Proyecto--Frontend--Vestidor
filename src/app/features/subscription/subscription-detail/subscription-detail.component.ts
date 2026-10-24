import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { SubscriptionPlan, CurrentSubscription } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-subscription-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-detail.component.html',
  styleUrls: ['./subscription-detail.component.css']
})
export class SubscriptionDetailComponent implements OnInit {
  subscriptionService = inject(SubscriptionService);

  currentSub = this.subscriptionService.currentSubscription;
  availablePlans = signal<SubscriptionPlan[]>([]);
  isLoading = signal<boolean>(false);
  actionMessage = signal<{ type: 'success' | 'danger'; text: string } | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: () => {
        this.subscriptionService.getPlans().subscribe({
          next: (plans) => {
            this.availablePlans.set(plans);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error fetching plans:', err);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching subscription:', err);
        this.isLoading.set(false);
      }
    });
  }

  onChangePlan(targetPlanCodigo: string): void {
    const targetName = targetPlanCodigo === 'PROFESIONAL' ? 'Plan Profesional' : 'Plan Básico';
    if (!confirm(`¿Deseas cambiar tu suscripción a ${targetName}?`)) {
      return;
    }

    this.isLoading.set(true);
    this.actionMessage.set(null);

    this.subscriptionService.changePlan({ plan_codigo: targetPlanCodigo }).subscribe({
      next: (updated) => {
        this.isLoading.set(false);
        this.actionMessage.set({
          type: 'success',
          text: `¡Plan actualizado exitosamente a ${updated.plan.nombre}! Las nuevas capacidades ya están activas en tu empresa.`
        });
        setTimeout(() => this.actionMessage.set(null), 6000);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err.error?.detail || 'Error al cambiar de plan.';
        this.actionMessage.set({
          type: 'danger',
          text: detail
        });
      }
    });
  }
}
