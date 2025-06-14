import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
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
import { AuctionResultModalComponent, AuctionResultType } from './components/auction-result-modal/auction-result-modal.component';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../core/services/websocket.service';
import { SecurityService } from '../../core/services/security.service';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [
    Toast,
    AuctionInfoComponent,
    TitleAndDescriptionComponent,
    DynamicCarouselComponent,
    LotProductDetailsComponent,
    LiveBiddingComponent,
    ModalComponent,
    PrimaryButtonComponent,
    AuctionLotsModalComponent,
    AuctionResultModalComponent
  ],
  providers: [
    MessageService
  ],
  templateUrl: './auction.component.html',
  styleUrl: './auction.component.scss'
})
export class AuctionComponent implements OnInit {
  subasta?: Subasta;
  lotes: Lote[] = [];
  loteSeleccionado?: Lote;  showDetallesModal = false;
  showPujaModal = false;
  showLotsModal = false;
  loteSeleccionadoModal?: Lote;
  showResultModal = false;
  resultModalType: AuctionResultType = 'winner';

  // Nueva propiedad para el enlace de YouTube Live
  youtubeUrl?: string;
  // Nueva propiedad para las imágenes aleatorias de los lotes
  imagenesAleatorias: { [id: number]: string } = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private messageService: MessageService,
    private loteService: LoteService,
    private subastaService: SubastaService,
    private websocketService: WebsocketService,
    private securityService: SecurityService,
    private route: ActivatedRoute
  ) {}

  verDetalles(lote: Lote): void {
    this.loteSeleccionadoModal = { ...lote }; // Crear una copia para forzar la detección de cambios
    this.showDetallesModal = true;
  }
  verPuja(): void {
    this.showPujaModal = true;
  }

  verTodosLosLotes(): void {
    this.showLotsModal = true;
  }  onModalClose(): void {
    this.showDetallesModal = false;
    this.showPujaModal = false;
    this.showLotsModal = false;
    this.showResultModal = false;
    this.loteSeleccionadoModal = undefined; // Limpiar la selección del modal
  }

  // Método específico para cerrar modales de resultados
  closeResultModal(): void {
    this.showResultModal = false;
  }

  // Método para mostrar modal de ganador
  showWinnerModal(): void {
    this.resultModalType = 'winner';
    this.showResultModal = true;
  }

  // Método para mostrar modal de subasta cerrada
  showAuctionClosedModal(): void {
    this.resultModalType = 'closed';
    this.showResultModal = true;
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Primero obtener la subasta, luego los lotes
    this.getSubasta(id);
    this.suscribirseAEventosWebsocket(id);
  }

  getSubasta(id: number | undefined): void {
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
          this.cargarImagenesAleatorias();
          
          if (this.lotes.length > 0) {
            if (this.subasta?.loteActual_id) {
              const loteActual = this.lotes.find(lote => lote.id === this.subasta?.loteActual_id);
              if (loteActual) {
                this.loteSeleccionado = loteActual;
                this.loadLoteArticulos(loteActual);
              } else {
                // Si no se encuentra el lote actual, usar el primero como fallback
                this.loteSeleccionado = this.lotes[0];
                this.loadLoteArticulos(this.loteSeleccionado);
              }
            } else {
              // Si no hay loteActual_id, usar el primero
              this.loteSeleccionado = this.lotes[0];
              this.loadLoteArticulos(this.loteSeleccionado);
            }
          }
        },
        error: (error: any) => {
          console.error('Error al obtener los lotes:', error);
        }
      });
    }
  }

  cargarLotesYActualizarActual(nuevoLoteActualId?: number): void {
    if (this.subasta?.id !== undefined) {
      this.loteService.getLotesBySubasta(this.subasta.id).subscribe({
        next: (lotes: Lote[]) => {
          this.lotes = lotes;
          // Cargar imágenes aleatorias para los lotes actualizados
          this.cargarImagenesAleatorias();
          
          if (nuevoLoteActualId) {
            this.loteSeleccionado = this.lotes.find(lote => lote.id === nuevoLoteActualId);
            if (this.loteSeleccionado?.id) {
              this.cargarArticulosDelLoteActual(this.loteSeleccionado.id);
            } else {
              console.warn('No se encontró el lote con ID:', nuevoLoteActualId);
              this.loteSeleccionado = undefined;
            }
          } else if (this.subasta?.loteActual_id) {
            this.loteSeleccionado = this.lotes.find(lote => lote.id === this.subasta?.loteActual_id);
            if (this.loteSeleccionado?.id) {
              this.cargarArticulosDelLoteActual(this.loteSeleccionado.id);
            }
          }
          
        },
        error: (error: any) => {
          this.messageService.clear();
          this.messageService.add({severity: 'error', summary: 'Error', detail: `Error al cargar los lotes`, life: 4000});
        }
      });
    }
  }

  cargarArticulosDelLoteActual(loteId: number): void {
    this.loteService.getArticulosByLote(loteId).subscribe({
      next: (articulos) => {
        if (this.loteSeleccionado) {
          this.loteSeleccionado.articulos = articulos;
        }
      },
      error: (error) => {
        console.error('Error al cargar artículos del lote actual:', error);
        if (this.loteSeleccionado) {
          this.loteSeleccionado.articulos = [];
        }
      }
    });
  }

  actualizarLoteConNuevaPuja(event: any): void {
    if (this.loteSeleccionado && event.lote_id === this.loteSeleccionado.id) {
      this.loteSeleccionado.oferta = event.nuevo_total || event.monto;
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
  
  getImage = (item: any): string => {
    if (!item || !item.id) {
      return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    }

    return this.imagenesAleatorias[item.id] || 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
  }

  private cargarImagenesAleatorias(): void {
    this.lotes.forEach(lote => {
      if (lote.id) {
        this.loteService.obtenerImagenAleatoria(lote.id).subscribe(
          (response) => {
            if (response && response.imagen) {
              this.imagenesAleatorias[lote.id!] = response.imagen;
            }
          },
          (error) => {
            this.imagenesAleatorias[lote.id!] = '/remate.jpg';
          }
        );
      }
    });
  }
  
  seleccionarLote(lote: Lote): void {
    this.loteSeleccionado = lote;
    this.loadLoteArticulos(lote);
  }

  suscribirseAEventosWebsocket(id: number | undefined): void {
    if (id !== undefined) {
      const pujaSub = this.websocketService.subscribeToPujas(id).subscribe({
        next: (event) => {

          if (this.subasta) {
            this.subasta = { ...this.subasta };
          }

          this.actualizarLoteConNuevaPuja(event);
          if (event.usuario_id !== this.securityService.actualUser?.id) {
            this.messageService.clear();
            this.messageService.add({severity: 'info', summary: 'Nueva puja recibida', detail: `Nueva puja recibida para el lote "${event.lote_nombre}": $${event.monto}`, life: 5000});
          } else {
            this.messageService.clear();
            this.messageService.add({severity: 'success', summary: 'Nueva puja', detail: `Puja realizada exitosamente para el lote "${event.lote_nombre}": $${event.monto}`, life: 5000});
          }
        }
      });

      const urlTransmisionSub = this.websocketService.subscribeToTransmissionUrlUpdate(id).subscribe({
        next: (event) => {
          this.youtubeUrl = event.urlTransmision || undefined;
        },
        error: (error) => {
          this.messageService.clear();
          this.messageService.add({severity: 'error', summary: 'Error', detail: `Error al recibir la actualización de la URL de transmisión: ${error}`, life: 4000});
        }
      });

      const inicioSub = this.websocketService.subscribeToAuctionStart(id).subscribe({
        next: (event) => {
          if (this.subasta) {
            this.subasta.estado = event.estado;
            this.subasta.loteActual_id = event.lote_actual_id;

            this.subasta = { ...this.subasta };
            
            this.cargarLotesYActualizarActual(event.lote_actual_id);
          }
          this.messageService.clear();
          this.messageService.add({severity: 'info', summary: '¡Atención!', detail: `¡La subasta ha comenzado!`, life: 4000});
        }
      });
      
      const cierreSub = this.websocketService.subscribeToAuctionClose(id).subscribe({
        next: (event) => {
            if (event.subasta_finalizada) {
            this.showAuctionClosedModal();
            if (this.subasta) {
              this.subasta.estado = 'cerrada';
              this.subasta.loteActual_id = undefined;
            }
            this.loteSeleccionado = undefined;

            if (this.subasta) {
              this.subasta = { ...this.subasta };
            }

            this.cargarLotesYActualizarActual();          } else {
            if (event.siguiente_lote_id && event.siguiente_lote_nombre) {
              if (this.securityService.actualUser?.id !== event.ganador_id) {
                this.messageService.clear();
                this.messageService.add({severity: 'info', summary: '¡Atención!', detail: `Lote "${event.lote_cerrado_nombre}" cerrado. Siguiente lote: "${event.siguiente_lote_nombre}"`, life: 5000});
              } else {
                this.showWinnerModal();
              }

              if (this.subasta) {
                this.subasta.loteActual_id = event.siguiente_lote_id;

                this.subasta = { ...this.subasta };
                
                this.cargarLotesYActualizarActual(event.siguiente_lote_id);
              }
            } else {
              this.messageService.clear();
              this.messageService.add({severity: 'error', summary: 'Error', detail: `Error al procesar el cierre del lote`, life: 4000});
            }
          }
        }
      });

      this.subscriptions.push(pujaSub, urlTransmisionSub, inicioSub, cierreSub);
    }
  }
}
