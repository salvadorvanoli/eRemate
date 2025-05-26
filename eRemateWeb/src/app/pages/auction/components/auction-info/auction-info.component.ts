import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TitleAndDescriptionComponent } from '../../../../shared/components/title-and-description/title-and-description.component'; 
import { interval, Subscription } from 'rxjs';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-auction-info',
  imports: [
      CommonModule,
      RouterModule,
      TitleAndDescriptionComponent,
      PrimaryButtonComponent],
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

constructor(private sanitizer: DomSanitizer) {}

ngOnChanges(changes: SimpleChanges): void {
    if (changes['youtubeUrl']) {
        this.updateYoutubeUrl();
    }
}

pujar(): void {
    this.onPuja.emit();
}

ngOnInit(): void {
    this.timerSub = interval(1000).subscribe(() => this.updateCountdown());
    this.updateYoutubeUrl();
}

ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
}

private updateYoutubeUrl(): void {
    console.log('updateYoutubeUrl called with:', this.youtubeUrl); // Debug log
    
    if (this.youtubeUrl) {
        let embedUrl = this.youtubeUrl;
        
        // Si es una URL normal de YouTube, convertirla a embed
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
