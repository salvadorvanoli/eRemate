import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TitleAndDescriptionComponent } from '../../../../shared/components/title-and-description/title-and-description.component'; 
import { interval, Subscription } from 'rxjs';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
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

export class AuctionInfoComponent implements OnInit{

@Input() item: any;
@Input() item2: any;
@Input() getImageUrl?: (item: any) => string;
@Output() onPuja = new EventEmitter<void>();

countdown: string = '';
private timerSub?: Subscription;

pujar(): void {
    this.onPuja.emit();
  }

ngOnInit(): void {
    this.timerSub = interval(1000).subscribe(() => this.updateCountdown());
}

ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
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
