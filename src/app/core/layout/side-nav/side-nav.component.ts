import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NAV_PACKAGES, NavPackage, NavModule } from '../../config/nav-modules.config';
import { AuthService } from '../../services/auth.service';
import { ReservationService } from '../../services/reservation.service';
import { Subscription, interval, filter } from 'rxjs';

export interface VisiblePackage {
  id: string;
  name: string;
  icon: string;
  description?: string;
  modules: NavModule[];
}

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeNav = new EventEmitter<void>();

  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);
  private router = inject(Router);

  searchQuery = signal<string>('');
  pendingReservations = signal<number>(0);
  private subscriptions: Subscription[] = [];

  // Al inicio, todos los paquetes se abren por defecto
  expandedPackages = signal<Set<string>>(
    new Set([
      'seguridad-acceso',
      'administracion-catalogo',
      'experiencia-reservas',
      'inventario-logistica',
      'ventas-reportes'
    ])
  );

  // Paquetes visibles filtrados por permisos del usuario autenticado y por búsqueda opcional
  visiblePackages = computed<VisiblePackage[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();

    return NAV_PACKAGES.map((pkg) => {
      // Filtrar módulos por permisos
      const accessibleModules = pkg.modules.filter((module) => {
        if (!module.permission) return true;
        return this.authService.hasPermission(module.permission);
      });

      // Si hay término de búsqueda, filtrar adicionalmente por nombre o ruta
      const matchedModules = query
        ? accessibleModules.filter(
            (m) =>
              m.label.toLowerCase().includes(query) ||
              m.route.toLowerCase().includes(query)
          )
        : accessibleModules;

      return {
        id: pkg.id,
        name: pkg.name,
        icon: pkg.icon,
        description: pkg.description,
        modules: matchedModules
      };
    }).filter((pkg) => pkg.modules.length > 0);
  });

  // Total de módulos accesibles
  totalModulesCount = computed(() => {
    return this.visiblePackages().reduce((acc, p) => acc + p.modules.length, 0);
  });

  ngOnInit(): void {
    if (this.authService.hasPermission('reservas.list')) {
      this._loadPendingCount();
      const pollSub = interval(60_000).subscribe(() => this._loadPendingCount());
      this.subscriptions.push(pollSub);
    }

    // Autoexpandir paquete que contenga la ruta actual
    this._autoExpandCurrentRoute(this.router.url);

    const navSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this._autoExpandCurrentRoute(event.urlAfterRedirects);
      });
    this.subscriptions.push(navSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private _loadPendingCount(): void {
    this.reservationService
      .getReservations({ estado: 'PENDIENTE' as any, limit: 500 })
      .subscribe({
        next: (list) => this.pendingReservations.set(list.length),
        error: () => {}
      });
  }

  private _autoExpandCurrentRoute(currentUrl: string): void {
    const cleanUrl = currentUrl.split('?')[0];
    for (const pkg of NAV_PACKAGES) {
      const hasRoute = pkg.modules.some(
        (m) => m.route === cleanUrl || cleanUrl.startsWith(m.route + '/')
      );
      if (hasRoute) {
        const next = new Set(this.expandedPackages());
        next.add(pkg.id);
        this.expandedPackages.set(next);
        break;
      }
    }
  }

  isPackageExpanded(pkgId: string): boolean {
    // Si hay búsqueda activa, expandir todo automáticamente para mostrar resultados
    if (this.searchQuery().trim().length > 0) return true;
    return this.expandedPackages().has(pkgId);
  }

  togglePackage(pkgId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const next = new Set(this.expandedPackages());
    if (next.has(pkgId)) {
      next.delete(pkgId);
    } else {
      next.add(pkgId);
    }
    this.expandedPackages.set(next);
  }

  expandAll(): void {
    this.expandedPackages.set(
      new Set(NAV_PACKAGES.map((p) => p.id))
    );
  }

  collapseAll(): void {
    this.expandedPackages.set(new Set());
  }

  isPackageActive(pkg: VisiblePackage): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return pkg.modules.some(
      (m) => m.route === currentUrl || currentUrl.startsWith(m.route + '/')
    );
  }

  hasPackagePendingReservations(pkgId: string): boolean {
    return pkgId === 'experiencia-reservas' && this.pendingReservations() > 0;
  }

  onModuleClick(): void {
    this.closeNav.emit();
  }

  onClose(): void {
    this.closeNav.emit();
  }
}
