import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { SelectInfoTypeComponent } from './components/select-info-type/select-info-type.component';
import { TableAuctionAuctioneerComponent } from './components/table-auction-auctioneer/table-auction-auctioneer.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BoldSubtitleComponent } from '../../shared/components/bold-subtitle/bold-subtitle.component';

@Component({
  selector: 'app-view-auctioneer-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileInfoComponent,
    SelectInfoTypeComponent,
    TableAuctionAuctioneerComponent,
    BoldSubtitleComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-auctioneer-profile.component.html',
  styleUrl: './view-auctioneer-profile.component.scss'
})
export class ViewAuctioneerProfileComponent {
  selectedInfoType: string = 'profile';
  
  onInfoTypeChange(infoType: string) {
    this.selectedInfoType = infoType;
  }
}
