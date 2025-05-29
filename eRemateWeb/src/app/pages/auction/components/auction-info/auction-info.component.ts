import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TitleAndDescriptionComponent } from '../../../../shared/components/title-and-description/title-and-description.component'; 
import { interval, Subscription } from 'rxjs';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LocationDialogComponent } from '../../../../shared/components/location-dialog/location-dialog.component';

@Component({
  selector: 'app-auction-info',
  imports: [
      CommonModule,
      RouterModule,
      TitleAndDescriptionComponent,
      PrimaryButtonComponent,
      LocationDialogComponent],
  templateUrl: './auction-info.component.html',
  styleUrl: './auction-info.component.scss'
})

export class AuctionInfoComponent implements OnInit, OnDestroy, OnChanges {

@Input() item: any;
@Input() item2: any;
@Input() getImageUrl?: (item: any) => string;
@Input() youtubeUrl?: string;
@Output() onPuja = new EventEmitter<void>();

countdown: string = '';
private timerSub?: Subscription;
safeYoutubeUrl?: SafeResourceUrl;
showLocationDialog: boolean = false;

constructor(private sanitizer: DomSanitizer) {}

ngOnChanges(changes: SimpleChanges): void {
    if (changes['youtubeUrl']) {
        this.updateYoutubeUrl();
    }
}

pujar(): void {
    this.onPuja.emit();
}

openLocationDialog(): void {
    if (this.item?.ubicacion) {
        this.showLocationDialog = true;
    }
}

closeLocationDialog(): void {
    this.showLocationDialog = false;
}

hasLocation(): boolean {
    return !!(this.item?.ubicacion && this.item.ubicacion.trim());
}

getLoteName(lote: any): string {
    return lote?.nombre || `Lote #${lote?.id || 'Sin número'}`;
}

getLoteImageUrl(lote: any): string {        if (this.getImageUrl && lote) {
            const imageUrl = this.getImageUrl(lote);
            if (imageUrl && imageUrl !== 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png') {
                return imageUrl;
            }
        }
        
        if (lote?.imagenUrl && lote.imagenUrl.trim() !== '') {
            return lote.imagenUrl;
        }
        
        if (lote?.articulos && lote.articulos.length > 0) {
            const primerArticulo = lote.articulos[0];
            if (primerArticulo?.imagenes && primerArticulo.imagenes.length > 0) {
                if (typeof primerArticulo.imagenes === 'string') {
                    try {
                        const imagenesArray = JSON.parse(primerArticulo.imagenes);
                        if (Array.isArray(imagenesArray) && imagenesArray.length > 0) {
                            return imagenesArray[0];
                        }
                    } catch (e) {
                        return primerArticulo.imagenes;
                    }
                }
                else if (Array.isArray(primerArticulo.imagenes)) {
                    return primerArticulo.imagenes[0];
                }
            }        }
    
    return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
}

ngOnInit(): void {
    this.timerSub = interval(1000).subscribe(() => this.updateCountdown());
    this.updateYoutubeUrl();
}

ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
}

private updateYoutubeUrl(): void {
    if (this.youtubeUrl) {
        let embedUrl = this.youtubeUrl;        
        if (this.youtubeUrl.includes('youtube.com/watch?v=')) {
            const videoId = this.youtubeUrl.split('v=')[1]?.split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        } else if (this.youtubeUrl.includes('youtu.be/')) {
            const videoId = this.youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        }
        
        this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else {
        this.safeYoutubeUrl = undefined;
    }
}

private updateCountdown(): void {
    if (this.item?.fechaCierre) {
      const now = new Date().getTime();
      const cierre = new Date(this.item.fechaCierre).getTime();
      const diff = cierre - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.countdown = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        this.countdown = 'Finalizada';
      }
    }
  }
}
