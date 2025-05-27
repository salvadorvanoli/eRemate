import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewAuctionHouseProfileComponent } from '../view-auction-house-profile/view-auction-house-profile.component';
import { ViewRegisteredUserProfileComponent } from '../view-registered-user-profile/view-registered-user-profile.component';
import { ViewAuctioneerProfileComponent } from '../view-auctioneer-profile/view-auctioneer-profile.component'; // Nuevo import
import { SecurityService } from '../../core/services/security.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [
    CommonModule,
    ViewAuctionHouseProfileComponent,
    ViewRegisteredUserProfileComponent,
    ViewAuctioneerProfileComponent, // Añadido a imports
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.scss'
})
export class ViewProfileComponent implements OnInit {
  isAuctionHouse = false;
  isRegisteredUser = false;
  isAuctioneer = false;
  loading = true;

  constructor(private securityService: SecurityService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.checkUserType();
  }

  checkUserType(): void {

    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      console.log('Current user from BehaviorSubject:', currentUser);
      this.setUserType(currentUser.tipo);
      this.loading = false;
    } else {
 
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          console.log('User from API:', user);
          if (user) {
            this.setUserType(user.tipo);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo obtener información del usuario',
              life: 3000
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el perfil',
            life: 3000
          });
          this.loading = false;
        }
      });
    }
  }

  private setUserType(tipo: string): void {
    console.log('Setting user type with value:', tipo);
    

    this.isAuctionHouse = false;
    this.isRegisteredUser = false;
    this.isAuctioneer = false;
    
    if (tipo === 'casa' || tipo === 'casa_de_remates') {
      this.isAuctionHouse = true;
    } else if (tipo === 'usuario' || tipo === 'registrado') {
      this.isRegisteredUser = true;
    } else if (tipo === 'rematador') {
      this.isAuctioneer = true; 
    } else {
      console.warn('Unsupported user type:', tipo);
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: `Tipo de usuario "${tipo}" no soportado para visualización de perfil`,
        life: 3000
      });
    }
  }
}
