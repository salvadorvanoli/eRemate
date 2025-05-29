import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { TableLotsComponent } from './components/table-lots/table-lots.component';
import { SelectInfoTypeComponent } from './components/select-info-type/select-info-type.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BoldSubtitleComponent } from '../../shared/components/bold-subtitle/bold-subtitle.component';

@Component({
  selector: 'app-view-registered-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileInfoComponent,
    TableLotsComponent,
    SelectInfoTypeComponent,
    BoldSubtitleComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-registered-user-profile.component.html',
  styleUrl: './view-registered-user-profile.component.scss'
})
export class ViewRegisteredUserProfileComponent {
  selectedInfoType: string = 'profile';
  
  onInfoTypeChange(infoType: string) {
    this.selectedInfoType = infoType;
  }
}
