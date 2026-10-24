import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { NetworkStatusService } from '../../services/network-status.service';
import { SyncQueueService } from '../../services/sync-queue.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent, SideNavComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
  networkStatus = inject(NetworkStatusService);
  syncQueue = inject(SyncQueueService);

  isOnline = this.networkStatus.isOnline;
  pendingCount = this.syncQueue.pendingCount;

  isNavOpen = signal<boolean>(false);

  toggleNav(): void {
    this.isNavOpen.update((v) => !v);
  }

  closeNav(): void {
    this.isNavOpen.set(false);
  }
}

