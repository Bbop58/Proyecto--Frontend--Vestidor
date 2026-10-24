import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';
import { NetworkStatusService } from '../../services/network-status.service';
import { SyncQueueService } from '../../services/sync-queue.service';
import { OfflineSyncModalComponent } from '../../../features/sales/offline-sync-modal/offline-sync-modal.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineSyncModalComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  @Output() toggleNav = new EventEmitter<void>();

  authService = inject(AuthService);
  subscriptionService = inject(SubscriptionService);
  networkStatus = inject(NetworkStatusService);
  syncQueue = inject(SyncQueueService);

  currentUser = this.authService.currentUser;
  currentSub = this.subscriptionService.currentSubscription;
  isOnline = this.networkStatus.isOnline;
  pendingCount = this.syncQueue.pendingCount;
  isSyncing = this.syncQueue.isSyncing;

  showSyncModal = signal<boolean>(false);

  isDark = signal<boolean>(
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark'
  );

  constructor() {
    // Aplicar tema guardado al iniciar
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  onToggleNav(): void {
    this.toggleNav.emit();
  }

  onToggleDark(): void {
    const el = document.documentElement;
    const nowDark = el.classList.toggle('dark');
    this.isDark.set(nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  }

  openSyncModal(): void {
    this.showSyncModal.set(true);
  }

  closeSyncModal(): void {
    this.showSyncModal.set(false);
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}

