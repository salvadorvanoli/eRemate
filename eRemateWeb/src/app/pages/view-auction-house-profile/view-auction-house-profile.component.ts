import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './components/table/table.component';
import { TableAuctionComponent } from './components/table-auction/table-auction.component';
import { TableLotsComponent } from './components/table-lots/table-lots.component';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { SelectInfoTypeComponent } from './components/select-info-type/select-info-type.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-view-auction-house-profile',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    TableAuctionComponent,
    TableLotsComponent,
    ProfileInfoComponent,
    SelectInfoTypeComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-auction-house-profile.component.html',
  styleUrl: './view-auction-house-profile.component.scss'
})
export class ViewAuctionHouseProfileComponent {

  selectedAuctionId: number | null = null;
 
  selectedInfoType: string = 'profile';
  

  onAuctionSelected(id: number) {
    console.log('Subasta seleccionada en el componente padre:', id);
    this.selectedAuctionId = id;
  }

  onInfoTypeChanged(type: string) {
    this.selectedInfoType = type;
  }
}
