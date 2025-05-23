import { Component } from '@angular/core';
import { TableComponent } from './components/table/table.component';
import { TableAuctionComponent } from './components/table-auction/table-auction.component';
import { TableLotsComponent } from './components/table-lots/table-lots.component';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-view-auction-house-profile',
  standalone: true,
  imports: [
    TableComponent,
    TableAuctionComponent,
    TableLotsComponent,
    ProfileInfoComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-auction-house-profile.component.html',
  styleUrl: './view-auction-house-profile.component.scss'
})
export class ViewAuctionHouseProfileComponent {

}
