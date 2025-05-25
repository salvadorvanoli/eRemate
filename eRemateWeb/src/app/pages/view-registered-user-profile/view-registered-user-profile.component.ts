import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { TableLotsComponent } from './components/table-lots/table-lots.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-view-registered-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileInfoComponent,
    TableLotsComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-registered-user-profile.component.html',
  styleUrl: './view-registered-user-profile.component.scss'
})
export class ViewRegisteredUserProfileComponent {
  // Propiedades y métodos del componente
}
