export interface NavModule {
  label: string;
  icon: string;          // Bootstrap icon class name, e.g. "bi-shield-lock"
  route: string;
  permission?: string;   // Optional permission code required to see the item
}

export interface NavPackage {
  id: string;
  name: string;
  icon: string;          // Bootstrap icon class for the package
  description?: string;
  modules: NavModule[];
}

/**
 * Módulos organizados por paquetes de la Capa Específica (Arquitectura del Sistema):
 * 1. Seguridad y Acceso
 * 2. Administración y catálogo base
 * 3. Experiencia Digital y Reservas
 * 4. Inventario y Logística
 * 5. Ventas, Pagos y Reportes
 */
export const NAV_PACKAGES: NavPackage[] = [
  {
    id: 'seguridad-acceso',
    name: 'Seguridad y Acceso',
    icon: 'bi-shield-lock-fill',
    description: 'Usuarios, roles, auditoría y credenciales',
    modules: [
      {
        label: 'Roles y Permisos',
        icon: 'bi-shield-check',
        route: '/roles',
        permission: 'roles.list'
      },
      {
        label: 'Gestión de Usuarios',
        icon: 'bi-people',
        route: '/usuarios',
        permission: 'users.list'
      },
      {
        label: 'Bitácora del Sistema',
        icon: 'bi-journal-text',
        route: '/bitacora',
        permission: 'bitacora.list'
      },
      {
        label: 'Mi Cuenta y Seguridad',
        icon: 'bi-person-gear',
        route: '/perfil'
      }
    ]
  },
  {
    id: 'administracion-catalogo',
    name: 'Administración y catálogo base',
    icon: 'bi-building-gear',
    description: 'Catálogo de prendas, tiendas y socios comerciales',
    modules: [
      {
        label: 'Sucursales',
        icon: 'bi-shop',
        route: '/sucursales',
        permission: 'sucursales.list'
      },
      {
        label: 'Categorías',
        icon: 'bi-tags',
        route: '/categorias',
        permission: 'categorias.list'
      },
      {
        label: 'Catálogo de Productos',
        icon: 'bi-box-seam',
        route: '/productos',
        permission: 'productos.list'
      },
      {
        label: 'Proveedores',
        icon: 'bi-truck',
        route: '/proveedores',
        permission: 'proveedores.list'
      },
      {
        label: 'Temporadas',
        icon: 'bi-calendar-range',
        route: '/temporadas',
        permission: 'temporadas.list'
      }
    ]
  },
  {
    id: 'experiencia-reservas',
    name: 'Experiencia Digital y Reservas',
    icon: 'bi-stars',
    description: 'Apartados Click & Collect y herramientas de IA',
    modules: [
      {
        label: 'Gestión de Reservas',
        icon: 'bi-calendar-check',
        route: '/reservas',
        permission: 'reservas.list'
      },
      {
        label: 'Nueva Reserva',
        icon: 'bi-bookmark-plus',
        route: '/reservas/nueva',
        permission: 'reservas.create'
      },
      {
        label: 'Reportes por Voz (IA)',
        icon: 'bi-mic-fill',
        route: '/reportes-ia',
        permission: 'ventas.reports'
      }
    ]
  },
  {
    id: 'inventario-logistica',
    name: 'Inventario y Logística',
    icon: 'bi-boxes',
    description: 'Stock físico, recepción y kardex multisede',
    modules: [
      {
        label: 'Inventario / Stock',
        icon: 'bi-box',
        route: '/inventario',
        permission: 'inventario.list'
      },
      {
        label: 'Recepción de Mercadería',
        icon: 'bi-box-arrow-in-down',
        route: '/inventario/recepcion',
        permission: 'inventario.create'
      },
      {
        label: 'Movimientos de Stock',
        icon: 'bi-clock-history',
        route: '/inventario/movimientos',
        permission: 'inventario.list'
      }
    ]
  },
  {
    id: 'ventas-reportes',
    name: 'Ventas, Pagos y Reportes',
    icon: 'bi-cash-coin',
    description: 'Punto de venta, cobros, historial y métricas',
    modules: [
      {
        label: 'Dashboard General',
        icon: 'bi-speedometer2',
        route: '/dashboard'
      },
      {
        label: 'Caja / POS',
        icon: 'bi-calculator',
        route: '/ventas/pos',
        permission: 'ventas.create'
      },
      {
        label: 'Historial de Ventas',
        icon: 'bi-receipt',
        route: '/ventas',
        permission: 'ventas.list'
      },
      {
        label: 'Reportes de Ventas',
        icon: 'bi-graph-up',
        route: '/ventas/reportes',
        permission: 'ventas.reports'
      }
    ]
  }
];

// Lista plana exportada para retrocompatibilidad
export const NAV_MODULES: NavModule[] = NAV_PACKAGES.flatMap(pkg => pkg.modules);
