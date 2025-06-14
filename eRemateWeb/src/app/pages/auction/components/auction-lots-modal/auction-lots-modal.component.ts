import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { Lote } from '../../../../core/models/lote';
import { Subasta } from '../../../../core/models/subasta';
import { PujaAutomatica } from '../../../../core/models/puja-automatica';
import { SubastaService } from '../../../../core/services/subasta.service';

@Component({
  selector: 'app-auction-lots-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    PrimaryButtonComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './auction-lots-modal.component.html',
  styleUrl: './auction-lots-modal.component.scss'
})
export class AuctionLotsModalComponent implements OnInit {
  @Input() visible = false;
  @Input() subasta?: Subasta;
  @Input() lotes: Lote[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() automaticBidCreated = new EventEmitter<void>();

  // Propiedades del estado del modal
  loading = false;
  error = false;
  errorMessage = '';
  successMessage = '';
  
  // Propiedades del lote seleccionado
  loteSeleccionado?: Lote;
  loteSeleccionadoId?: number;
  
  // Propiedades de la puja automática
  automaticBidBudget: number = 0;
  isCreatingBid = false;
  
  // Computed properties
  get subastaTitle(): string {
    return this.subasta ? `${this.subasta.tipoSubasta} - ${this.subasta.ubicacion}` : 'Subasta';
  }

  constructor(
    private subastaService: SubastaService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Inicializar con el primer lote si existe
    if (this.lotes.length > 0) {
      this.selectLot(this.lotes[0]);
    }
  }

  onClose(): void {
    this.closed.emit();
    this.resetForm();
  }

  loadLotes(): void {
    // Este método puede ser llamado para recargar los lotes si hay un error
    this.error = false;
    this.errorMessage = '';
    // La lógica de carga puede ser implementada por el componente padre
  }

  selectLot(lote: Lote): void {
    this.loteSeleccionado = lote;
    this.loteSeleccionadoId = lote.id;
    this.resetMessages();
  }

  clearSelectedLot(): void {
    this.loteSeleccionado = undefined;
    this.loteSeleccionadoId = undefined;
    this.resetForm();
  }

  getLotStatusClass(lote: Lote): string {
    if (lote.ganador_id) {
      return 'lot-won';
    }
    if (lote.oferta && lote.oferta > 0) {
      return 'lot-active';
    }
    return 'lot-available';
  }

  getLotStatusText(lote: Lote): string {
    if (lote.ganador_id) {
      return 'Ganado';
    }
    if (lote.oferta && lote.oferta > 0) {
      return 'En Puja';
    }
    return 'Disponible';
  }

  getTotalArticles(lote: Lote): number {
    return lote.articulos ? lote.articulos.length : 0;
  }

  getMinimumBudget(): number {
    if (!this.loteSeleccionado) return 0;
    return (this.loteSeleccionado.valorBase || 0) + (this.loteSeleccionado.pujaMinima || 0);
  }

  getCurrentOffer(lote: Lote): number {
    return lote.oferta || lote.valorBase || 0;
  }

  formatPrice(price: number): string {
    return "$" + price
  }
  getImageUrl(lote: Lote): string {
    // 1. Verificar si el lote tiene una imagen principal directa
    if (lote.imagenUrl && lote.imagenUrl.trim() !== '') {
      return lote.imagenUrl;
    }
    
    // 2. Si el lote tiene artículos, buscar imágenes en ellos
    if (lote.articulos && lote.articulos.length > 0) {
      const primerArticulo = lote.articulos[0];
      
      if (primerArticulo?.imagenes && primerArticulo.imagenes.length > 0) {
        // Verificar si las imágenes están en formato string (JSON) o array
        if (typeof primerArticulo.imagenes === 'string') {
          try {
            const imagenesArray = JSON.parse(primerArticulo.imagenes);
            if (Array.isArray(imagenesArray) && imagenesArray.length > 0) {
              return imagenesArray[0];
            }
          } catch (e) {
            // Si no se puede parsear como JSON, asumir que es una URL directa
            return primerArticulo.imagenes;
          }
        } else if (Array.isArray(primerArticulo.imagenes)) {
          return primerArticulo.imagenes[0];
        }
      }
    }
    
    // 3. Imagen por defecto si no se encuentra ninguna
    return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
  }

  onImageError(event: any): void {
    event.target.src = 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
  }

  canCreateAutomaticBid(): boolean {
    return !!(this.loteSeleccionado && 
             this.automaticBidBudget >= this.getMinimumBudget() &&
             this.subasta?.id);
  }
  createAutomaticBid(): void {
    if (!this.canCreateAutomaticBid() || !this.subasta?.id || !this.loteSeleccionado?.id) {
      return;
    }

    this.isCreatingBid = true;
    this.resetMessages();

    const pujaAutomatica: PujaAutomatica = {
      presupuesto: this.automaticBidBudget,
      lote_id: this.loteSeleccionado.id
    };

    this.subastaService.crearPujaAutomatica(this.subasta.id, pujaAutomatica).subscribe({
      next: () => {
        this.isCreatingBid = false; 
        this.messageService.clear();
        // Resetear estado inmediatamente
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Puja automática creada correctamente',
          life: 3000
        });
        this.automaticBidCreated.emit();
        this.resetForm();
        setTimeout(() => {
          this.onClose();
        }, 2000);
      },
      error: (error) => {
        this.isCreatingBid = false; // Resetear estado inmediatamente en caso de error
        console.error('Error al crear puja automática:', error);
        
        // Extraer el mensaje de error del backend
        let errorMessage = 'Error al crear la puja automática';
        
        if (error?.error?.error) {
          errorMessage = error.error.error;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  private resetForm(): void {
    this.automaticBidBudget = 0;
    if (this.lotes.length > 0 && !this.loteSeleccionado) {
      this.selectLot(this.lotes[0]);
    }
    this.resetMessages();
  }

  private resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
