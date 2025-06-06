import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { FormTextInputComponent } from '../../shared/components/inputs/form-text-input/form-text-input.component';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SubastaService } from '../../core/services/subasta.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { LoteService } from '../../core/services/lote.service';

import { Subasta } from '../../core/models/subasta';
import { Lote } from '../../core/models/lote';
import { Articulo } from '../../core/models/articulo';

@Component({
  selector: 'app-auctioneer-management',
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    FormTextInputComponent,
    PrimaryButtonComponent,
    ModalComponent
  ],
  templateUrl: './auctioneer-management.component.html',
  styleUrl: './auctioneer-management.component.scss'
})
export class AuctioneerManagementComponent implements OnInit, OnDestroy {
  subastaId: number = 0;
  subasta?: Subasta;
  loteActual?: Lote;
  lotes: Lote[] = [];

  url: string = '';
  isUrlInvalid: boolean = false;

  formSubmitted = signal(false);
  streamUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)[a-zA-Z0-9_-]{11}$/;
  
  loading = false;
  iniciandoSubasta = false;
  cerrandoSubasta = false;
  
  successMessage = '';
  errorMessage = '';
  
  showArticleModal = false;
  selectedArticle?: Articulo;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subastaService: SubastaService,
    private websocketService: WebsocketService,
    private loteService: LoteService
  ) {}

  ngOnInit(): void {
    this.subastaId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.subastaId) {
      this.cargarDatosSubasta();
      this.suscribirseAEventosWebsocket();
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.subastaId) {
      this.websocketService.leaveChannel(this.subastaId);
    }
  }

  cargarDatosSubasta(): void {
    this.loading = true;
    
    this.subastaService.getSubastaById(this.subastaId).subscribe({
      next: (data) => {
        this.subasta = {
          ...data,
          fechaInicio: new Date(data.fechaInicio),
          fechaCierre: new Date(data.fechaCierre)
        };
        
        if (this.subasta.urlTransmision) {
          this.url = this.subasta.urlTransmision
        }
        
        this.cargarLotes();
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los datos de la subasta';
        this.loading = false;
      }
    });
  }  
    cargarLotes(): void {
    this.loteService.getLotesBySubasta(this.subastaId).subscribe({
      next: (lotes: Lote[]) => {
        this.lotes = lotes;
        if (this.subasta?.loteActual_id) {
          this.loteActual = this.lotes.find(lote => lote.id === this.subasta?.loteActual_id);
          if (this.loteActual?.id) {
            this.cargarArticulosDelLoteActual(this.loteActual.id);
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Error al cargar los lotes';
        this.loading = false;
      }
    });
  }

  cargarLotesYActualizarActual(nuevoLoteActualId?: number): void {
    this.loteService.getLotesBySubasta(this.subastaId).subscribe({
      next: (lotes: Lote[]) => {
        this.lotes = lotes;
        
        if (nuevoLoteActualId) {
          this.loteActual = this.lotes.find(lote => lote.id === nuevoLoteActualId);
          if (this.loteActual?.id) {
            this.cargarArticulosDelLoteActual(this.loteActual.id);
          } else {
            console.warn('No se encontró el lote con ID:', nuevoLoteActualId);
            this.loteActual = undefined;
          }
        } else if (this.subasta?.loteActual_id) {
          this.loteActual = this.lotes.find(lote => lote.id === this.subasta?.loteActual_id);
          if (this.loteActual?.id) {
            this.cargarArticulosDelLoteActual(this.loteActual.id);
          }
        }
        
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Error al cargar los lotes';
        this.loading = false;
      }
    });
  }

  cargarArticulosDelLoteActual(loteId: number): void {
    this.loteService.getArticulosByLote(loteId).subscribe({
      next: (articulos) => {
        if (this.loteActual) {
          this.loteActual.articulos = articulos;
        }
      },
      error: (error) => {
        console.error('Error al cargar artículos del lote actual:', error);
        if (this.loteActual) {
          this.loteActual.articulos = [];
        }
      }
    });
  }

  suscribirseAEventosWebsocket(): void {
    const pujaSub = this.websocketService.subscribeToPujas(this.subastaId).subscribe({
      next: (event) => {
        this.actualizarLoteConNuevaPuja(event);
      }
    });    const inicioSub = this.websocketService.subscribeToAuctionStart(this.subastaId).subscribe({
      next: (event) => {
        if (this.subasta) {
          this.subasta.estado = event.estado;
          this.subasta.loteActual_id = event.lote_actual_id;
          
          this.cargarLotesYActualizarActual(event.lote_actual_id);
        }
        this.successMessage = 'Subasta iniciada correctamente';
        this.clearMessagesAfterDelay();
      }
    });const cierreSub = this.websocketService.subscribeToAuctionClose(this.subastaId).subscribe({
      next: (event) => {
        console.log('Evento de cierre recibido:', event);
        
        if (event.subasta_finalizada) {
          this.successMessage = 'Subasta finalizada completamente';
          if (this.subasta) {
            this.subasta.estado = 'cerrada';
            this.subasta.loteActual_id = undefined;
          }
          this.loteActual = undefined;

          this.cargarLotesYActualizarActual();        
        } else {
          if (event.siguiente_lote_id && event.siguiente_lote_nombre) {
            this.successMessage = `Lote "${event.lote_cerrado_nombre}" cerrado. Siguiente lote: "${event.siguiente_lote_nombre}"`;
            
            if (this.subasta) {
              this.subasta.loteActual_id = event.siguiente_lote_id;
              
              this.cargarLotesYActualizarActual(event.siguiente_lote_id);
            }
          } else {
            console.warn('Datos incompletos en evento de cierre:', event);
            this.errorMessage = 'Error al procesar el cierre del lote';
          }
        }
        this.clearMessagesAfterDelay();
      }
    });

    this.subscriptions.push(pujaSub, inicioSub, cierreSub);
  }

  actualizarLoteConNuevaPuja(event: any): void {
    if (this.loteActual && event.lote_id === this.loteActual.id) {
      this.loteActual.oferta = event.nuevo_total || event.monto;
    }
  }

  validateForm(): boolean {
    return this.isUrlInvalid;
  }

  actualizarUrlTransmision(): void {

    this.formSubmitted.set(true);

    if(this.validateForm()) {
        this.errorMessage = 'Error al actualizar URL de transmisión';
        return;
    }

    this.clearMessages();
    
    this.subastaService.actualizarUrlTransmision(this.subastaId, this.url).subscribe({
      next: () => {
        this.successMessage = 'URL de transmisión actualizada correctamente';
        if (this.subasta) {
          this.subasta.urlTransmision = this.url;
        }
        this.clearMessagesAfterDelay();
      },
      error: (error) => {
        this.errorMessage = error.error.error || error.message || 'Error al actualizar URL de transmisión';
      }
    });
  }

  iniciarSubasta(): void {
    if (!this.subasta) return;
    
    this.iniciandoSubasta = true;
    this.clearMessages();
    
    this.subastaService.iniciarSubasta(this.subastaId).subscribe({
      next: () => {
        this.iniciandoSubasta = false;
      },
      error: (error) => {
        this.errorMessage = error.error.error || error.message || 'Error al iniciar la subasta';
        this.iniciandoSubasta = false;
      }
    });
  }

  cerrarSubasta(): void {
    if (!this.subasta || !this.loteActual) return;
    
    const confirmacion = confirm('¿Está seguro que desea cerrar el lote actual?');
    if (!confirmacion) return;
    
    this.cerrandoSubasta = true;
    this.clearMessages();
    
    this.subastaService.cerrarSubasta(this.subastaId).subscribe({
      next: () => {
        this.cerrandoSubasta = false;
      },
      error: (error) => {
        this.errorMessage = error.error.error || error.message || 'Error al cerrar la subasta';
        this.cerrandoSubasta = false;
      }
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  tieneOfertaValida(lote: any): boolean {
    return lote?.oferta != null && lote.oferta > 0;
  }

  formatearMonto(monto: number | undefined): string {
    if (monto == null) return '$0';
    return `$${monto.toLocaleString()}`;
  }

  get subastaFinalizada(): boolean {
    return this.subasta?.estado === 'cerrada';
  }

  get subastaIniciada(): boolean {
    return this.subasta?.estado === 'iniciada';
  }

  get puedeIniciarSubasta(): boolean {
    return !this.subastaIniciada && 
           !this.subastaFinalizada && 
           this.subasta?.estado === 'aceptada' && 
           this.lotes.length > 0 &&
           !this.iniciandoSubasta;
  }

  get puedeCerrarSubasta(): boolean {
    return this.subastaIniciada && 
           this.loteActual != null && 
           !this.cerrandoSubasta;
  }

  verDetallesArticulo(articulo: Articulo): void {
    this.selectedArticle = articulo;
    this.showArticleModal = true;
  }

  cerrarModalArticulo(): void {
    this.showArticleModal = false;
    this.selectedArticle = undefined;
  }

  getImageUrl(image: string): string {
    if (!image || image.trim() === '') {
      return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    }
    return image;
  }

  parseImages(imagenes: any): string[] {
    if (!imagenes) return [];
    
    if (Array.isArray(imagenes)) {
      return imagenes.filter(img => img && typeof img === 'string');
    }
    
    if (typeof imagenes === 'string') {
      try {
        const parsed = JSON.parse(imagenes);
        if (Array.isArray(parsed)) {
          return parsed.filter(img => img && typeof img === 'string');
        }
      } catch (e) {
        return [imagenes];
      }
    }
    
    return [];
  }
  getLotClass(lote: any): string {
    const classes = ['lot-summary-card'];
    
    if (lote.id === this.loteActual?.id) {
      classes.push('current');
    } else if (lote.ganador_id) {
      classes.push('completed');
    } else {
      classes.push('pending');
    }
    
    return classes.join(' ');
  }

  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getImageUrl('');
    }
  }
}
