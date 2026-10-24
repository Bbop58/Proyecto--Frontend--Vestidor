import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExchangeService } from '../../../core/services/exchange.service';
import { ProductService } from '../../../core/services/product.service';
import {
  VerifyReceiptResponse,
  VerifyReceiptItem,
  ProductExchangeResponse,
  ProductExchangeCreate,
} from '../../../core/models/exchange.model';
import { Product, ProductVariant } from '../../../core/models/product.model';

interface ReplacementSelection {
  devueltaItem: VerifyReceiptItem;
  cantidadDevuelta: number;
  selectedProductId: string;
  selectedVariant: ProductVariant | null;
  cantidadEntregada: number;
}

@Component({
  selector: 'app-product-exchange',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-exchange.component.html',
  styleUrls: ['./product-exchange.component.css'],
})
export class ProductExchangeComponent implements OnInit {
  private exchangeService = inject(ExchangeService);
  private productService = inject(ProductService);

  // Vistas / Tabs
  activeTab = signal<'nuevo' | 'historial'>('nuevo');

  // Búsqueda de Recibo
  receiptQuery = signal<string>('');
  isVerifying = signal<boolean>(false);
  verificationResult = signal<VerifyReceiptResponse | null>(null);

  // Catálogo disponible para selección de sustitución
  catalogProducts = signal<Product[]>([]);
  productVariantsMap = signal<Record<string, ProductVariant[]>>({});

  // Formulario de Cambio
  selectedItemToExchange = signal<VerifyReceiptItem | null>(null);
  selectedQuantityToReturn = signal<number>(1);
  selectedReplacementProductId = signal<string>('');
  selectedReplacementVariant = signal<ProductVariant | null>(null);
  selectedQuantityToDeliver = signal<number>(1);

  motivo = signal<string>('Cambio de talla');
  estadoPrenda = signal<string>('BUEN_ESTADO');
  metodoPagoDiferencia = signal<string>('EFECTIVO');
  nota = signal<string>('');

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Historial de Cambios
  exchangesList = signal<ProductExchangeResponse[]>([]);
  isLoadingHistory = signal<boolean>(false);

  // Modal de Detalle / Comprobante
  selectedExchangeDetail = signal<ProductExchangeResponse | null>(null);
  showReceiptModal = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCatalog();
    this.loadExchanges();
  }

  loadCatalog(): void {
    this.productService.getProducts({ activo: true }).subscribe({
      next: (products) => {
        this.catalogProducts.set(products);
      },
      error: (err) => console.error('Error cargando catálogo:', err),
    });
  }

  loadExchanges(): void {
    this.isLoadingHistory.set(true);
    this.exchangeService.getExchanges().subscribe({
      next: (data) => {
        this.exchangesList.set(data);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        console.error('Error cargando historial de cambios:', err);
        this.isLoadingHistory.set(false);
      },
    });
  }

  onSearchReceipt(): void {
    const q = this.receiptQuery().trim();
    if (!q) return;

    this.isVerifying.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.verificationResult.set(null);
    this.selectedItemToExchange.set(null);
    this.selectedReplacementVariant.set(null);

    this.exchangeService.verifyReceipt(q).subscribe({
      next: (res) => {
        this.verificationResult.set(res);
        this.isVerifying.set(false);
        if (!res.valido) {
          this.errorMessage.set(res.motivo_invalido || 'El recibo no es válido para cambio');
        }
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al verificar recibo de venta');
      },
    });
  }

  selectItemForExchange(item: VerifyReceiptItem): void {
    if (item.cantidad_disponible_cambio <= 0) return;
    this.selectedItemToExchange.set(item);
    this.selectedQuantityToReturn.set(1);
  }

  onReplacementProductChange(productId: string): void {
    this.selectedReplacementProductId.set(productId);
    this.selectedReplacementVariant.set(null);

    if (!productId) return;

    // Cargar variantes si no las tenemos en cache
    if (!this.productVariantsMap()[productId]) {
      this.productService.getProductVariants(productId).subscribe({
        next: (variants) => {
          this.productVariantsMap.update((map) => ({ ...map, [productId]: variants }));
        },
      });
    }
  }

  onReplacementVariantChange(variantId: string): void {
    const pId = this.selectedReplacementProductId();
    const variants = this.productVariantsMap()[pId] || [];
    const variant = variants.find((v) => v.id === variantId) || null;
    this.selectedReplacementVariant.set(variant);
  }

  // Cálculos económicos
  calculateReturnAmount(): number {
    const item = this.selectedItemToExchange();
    if (!item) return 0;
    return item.precio_unitario * this.selectedQuantityToReturn();
  }

  calculateDeliverAmount(): number {
    const variant = this.selectedReplacementVariant();
    const pId = this.selectedReplacementProductId();
    if (!variant || !pId) return 0;

    const prod = this.catalogProducts().find((p) => p.id === pId);
    const basePrice = prod ? Number(prod.precio_base) : 0;
    const extra = Number(variant.precio_extra) || 0;
    return (basePrice + extra) * this.selectedQuantityToDeliver();
  }

  calculateDifference(): number {
    return this.calculateDeliverAmount() - this.calculateReturnAmount();
  }

  submitExchange(): void {
    const verif = this.verificationResult();
    const itemDevuelto = this.selectedItemToExchange();
    const variantEntregada = this.selectedReplacementVariant();

    if (!verif || !verif.valido) {
      this.errorMessage.set('Debe ingresar un recibo válido y dentro del plazo.');
      return;
    }
    if (!itemDevuelto) {
      this.errorMessage.set('Seleccione la prenda que el cliente desea devolver.');
      return;
    }
    if (!variantEntregada) {
      this.errorMessage.set('Seleccione la nueva prenda y talla a entregar al cliente.');
      return;
    }

    const payload: ProductExchangeCreate = {
      numero_recibo: verif.numero_recibo,
      motivo: this.motivo(),
      estado_prenda: this.estadoPrenda(),
      metodo_pago_diferencia: this.calculateDifference() > 0 ? this.metodoPagoDiferencia() : 'NINGUNO',
      nota: this.nota().trim() || undefined,
      items: [
        {
          variante_devuelta_id: itemDevuelto.variante_id,
          cantidad_devuelta: this.selectedQuantityToReturn(),
          variante_entregada_id: variantEntregada.id,
          cantidad_entregada: this.selectedQuantityToDeliver(),
        },
      ],
    };

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.exchangeService.createExchange(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`¡Cambio registrado exitosamente! Comprobante: ${res.numero_cambio}`);
        this.selectedExchangeDetail.set(res);
        this.showReceiptModal.set(true);

        // Reset
        this.verificationResult.set(null);
        this.receiptQuery.set('');
        this.selectedItemToExchange.set(null);
        this.selectedReplacementVariant.set(null);
        this.loadExchanges();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al procesar el cambio de prenda');
      },
    });
  }

  openExchangeDetail(cambio: ProductExchangeResponse): void {
    this.selectedExchangeDetail.set(cambio);
    this.showReceiptModal.set(true);
  }

  closeReceiptModal(): void {
    this.showReceiptModal.set(false);
  }

  printReceipt(): void {
    window.print();
  }
}
