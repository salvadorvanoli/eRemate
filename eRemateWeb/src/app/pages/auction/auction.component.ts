import { Component, OnInit } from '@angular/core';
import { AuctionInfoComponent } from './components/auction-info/auction-info.component';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';
import { DynamicCarouselComponent } from '../../shared/components/dynamic-carousel/dynamic-carousel.component';
import { LotProductDetailsComponent } from './components/lot-product-details/lot-product-details.component';
import { Lote } from '../../core/models/lote';
import { LoteService } from '../../core/services/lote.service';
import { SubastaService } from '../../core/services/subasta.service';
import { Subasta } from '../../core/models/subasta';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [
    AuctionInfoComponent,
    TitleAndDescriptionComponent,
    DynamicCarouselComponent,
    LotProductDetailsComponent,
    ModalComponent,
    PrimaryButtonComponent
  ],
  templateUrl: './auction.component.html',
  styleUrl: './auction.component.scss'
})
export class AuctionComponent {
  subasta?: Subasta;
  lotes: Lote[] = [];
  loteSeleccionado?: Lote;

  showDetallesModal = false;
  showPujaModal = false;
  loteSeleccionadoModal?: Lote;

  // Nueva propiedad para el enlace de YouTube Live
  youtubeUrl?: string;

  constructor(
    private loteService: LoteService,
    private subastaService: SubastaService,
    private route: ActivatedRoute) {

  }


  verDetalles(lote: Lote): void {
    this.loteSeleccionadoModal = lote; // guardo el lote q estoy mostrando
    this.showDetallesModal = true;
  }

  verPuja(): void {
    this.showPujaModal = true;
  }

  onModalClose(): void {
    this.showDetallesModal = false;
    this.showPujaModal = false;
  }


  ngOnInit() {
    this.getSubasta();
    this.getLotes();

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
          if (this.lotes.length > 0) {
            this.loteSeleccionado = this.lotes[0];
          }
        },
        error: (error: any) => {
          console.error('Error al obtener los lotes:', error);
        }
      });
    }
  }

  getTitle(lote: Lote): string {
    return `Lote #${lote.id}`;
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
  }

  seleccionarLote(lote: Lote): void {
    this.loteSeleccionado = lote;
  }

}
