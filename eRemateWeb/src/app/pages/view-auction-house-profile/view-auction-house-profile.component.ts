import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './components/table/table.component';
import { TableAuctionComponent } from './components/table-auction/table-auction.component';
import { TableLotsComponent } from './components/table-lots/table-lots.component';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { SelectInfoTypeComponent } from './components/select-info-type/select-info-type.component';
import { StatsComponent } from './components/stats/stats.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BoldSubtitleComponent } from '../../shared/components/bold-subtitle/bold-subtitle.component';
import { SecurityService } from '../../core/services/security.service'; 

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
    StatsComponent,
    BoldSubtitleComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-auction-house-profile.component.html',
  styleUrl: './view-auction-house-profile.component.scss'
})
export class ViewAuctionHouseProfileComponent implements OnInit {
  selectedAuctionId: number | null = null;
  selectedInfoType: string = 'profile';
  casaId: number | null = null;
  
  constructor(private securityService: SecurityService) {}
  
  ngOnInit() {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      this.casaId = currentUser.id;
      console.log('ID de casa obtenido del BehaviorSubject:', this.casaId);
    } else {
     
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) { 
            this.casaId = user.id;
            console.log('ID de casa obtenido de la API:', this.casaId);
          } else {
            console.warn('No se pudo obtener el usuario');
            this.casaId = 1; 
          }
        },
        error: (error) => {
          console.error('Error al obtener usuario:', error);
          this.casaId = 1; 
        }
      });
    }
  }

  onAuctionSelected(id: number) {
    console.log('Subasta seleccionada en el componente padre:', id);
    this.selectedAuctionId = id;
  }

  onInfoTypeChanged(type: string) {
    this.selectedInfoType = type;
  }
}
