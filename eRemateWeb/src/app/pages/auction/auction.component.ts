import { Component, OnInit } from '@angular/core';
import { AuctionInfoComponent } from './components/auction-info/auction-info.component';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';
import { DynamicCarouselComponent } from '../../shared/components/dynamic-carousel/dynamic-carousel.component';
import { LotProductDetailsComponent } from './components/lot-product-details/lot-product-details.component';
import { LiveBiddingComponent } from './components/live-bidding/live-bidding.component';
import { Lote } from '../../core/models/lote';
import { LoteService } from '../../core/services/lote.service';
import { SubastaService } from '../../core/services/subasta.service';
import { Subasta } from '../../core/models/subasta';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { AuctionLotsModalComponent } from './components/auction-lots-modal/auction-lots-modal.component';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [
    AuctionInfoComponent,
    TitleAndDescriptionComponent,
    DynamicCarouselComponent,
    LotProductDetailsComponent,
    LiveBiddingComponent,
    ModalComponent,
    PrimaryButtonComponent,
    AuctionLotsModalComponent
  ],
  templateUrl: './auction.component.html',
  styleUrl: './auction.component.scss'
})
export class AuctionComponent implements OnInit {
  subasta?: Subasta;
  lotes: Lote[] = [];
  loteSeleccionado?: Lote;
  showDetallesModal = false;
  showPujaModal = false;
  showLotsModal = false;
  loteSeleccionadoModal?: Lote;

  // Nueva propiedad para el enlace de YouTube Live
  youtubeUrl?: string;

  constructor(
    private loteService: LoteService,
    private subastaService: SubastaService,
    private route: ActivatedRoute) {
  }

  verDetalles(lote: Lote): void {
    console.log('Mostrando detalles del lote:', lote.id, lote);
    this.loteSeleccionadoModal = { ...lote }; // Crear una copia para forzar la detección de cambios
    this.showDetallesModal = true;
  }
  verPuja(): void {
    this.showPujaModal = true;
  }

  verTodosLosLotes(): void {
    this.showLotsModal = true;
  }
  onModalClose(): void {
    this.showDetallesModal = false;
    this.showPujaModal = false;
    this.showLotsModal = false;
    this.loteSeleccionadoModal = undefined; // Limpiar la selección del modal
  }

  ngOnInit() {
    // Primero obtener la subasta, luego los lotes
    this.getSubasta();
  }

  getSubasta(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (id) {
      this.subastaService.getSubastaById(id).subscribe(
        (data) => {
          this.subasta = {
            ...data,
            fechaInicio: new Date(data.fechaInicio),
            fechaCierre: new Date(data.fechaCierre)
          };
          
          // Asignar el enlace de YouTube si existe en la subasta
          this.youtubeUrl = data.urlTransmision || undefined;
          
          // Después de obtener la subasta, cargar los lotes
          this.getLotes();
        },
        (error) => {
          console.error('Error al obtener la subasta:', error);
        }
      );
    }
  }
  
  getLotes(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loteService.getLotesBySubasta(id).subscribe({
        next: (data: Lote[]) => {
          this.lotes = data;
          console.log('Lotes cargados:', this.lotes);
          console.log('Subasta loteActual_id:', this.subasta?.loteActual_id);
          
          // Seleccionar el lote actual basado en loteActual_id de la subasta
          if (this.lotes.length > 0) {
            if (this.subasta?.loteActual_id) {
              // Buscar el lote que coincida con loteActual_id
              const loteActual = this.lotes.find(lote => lote.id === this.subasta?.loteActual_id);
              if (loteActual) {
                this.loteSeleccionado = loteActual;
                this.loadLoteArticulos(loteActual);
                console.log('Lote actual seleccionado:', loteActual);
              } else {
                // Si no se encuentra el lote actual, usar el primero como fallback
                this.loteSeleccionado = this.lotes[0];
                this.loadLoteArticulos(this.loteSeleccionado);
                console.warn('Lote actual no encontrado, usando el primero como fallback');
              }
            } else {
              // Si no hay loteActual_id, usar el primero
              this.loteSeleccionado = this.lotes[0];
              this.loadLoteArticulos(this.loteSeleccionado);
              console.log('No hay loteActual_id, usando el primer lote');
            }
          }
        },
        error: (error: any) => {
          console.error('Error al obtener los lotes:', error);
        }
      });
    }
  }

  loadLoteArticulos(lote: Lote): void {
    if (lote.id) {
      this.loteService.getArticulosByLote(lote.id).subscribe({
        next: (articulos) => {
          lote.articulos = articulos;
          // Actualizar la referencia para forzar la detección de cambios
          this.loteSeleccionado = { ...lote };
        },
        error: (error) => {
          console.error('Error al cargar artículos del lote:', error);
        }
      });
    }
  }

  getTitle(lote: Lote): string {
    return lote.nombre || `Lote #${lote.id}`;
  }

  getLink(lote: Lote): string {
    return '#';
  }

  getPrice(lote: Lote): string {
    return `$${lote.valorBase}`;
  }

  getImageUrl(item: any): string {
    if (!item?.imagenUrl || item.imagenUrl.trim() === '') {
      return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    }
    return item.imagenUrl;
  }  seleccionarLote(lote: Lote): void {
    this.loteSeleccionado = lote;
    this.loadLoteArticulos(lote);
  }
}
