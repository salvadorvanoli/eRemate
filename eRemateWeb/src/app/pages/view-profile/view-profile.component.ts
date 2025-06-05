import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ViewAuctionHouseProfileComponent } from '../view-auction-house-profile/view-auction-house-profile.component';
import { ViewRegisteredUserProfileComponent } from '../view-registered-user-profile/view-registered-user-profile.component';
import { ViewAuctioneerProfileComponent } from '../view-auctioneer-profile/view-auctioneer-profile.component';
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
    ViewAuctioneerProfileComponent,
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

  constructor(private securityService: SecurityService, private messageService: MessageService, private router: Router) {}

  ngOnInit(): void {
    this.checkUserType();
  } 
  
  checkUserType(): void {
    this.securityService.getActualUser().subscribe({
      next: (user: any) => {
        if (user) {
          if (this.isGoogleUserWithIncompleteProfile(user)) {
            this.messageService.add({
              severity: 'info',
              summary: 'Perfil incompleto',
              detail: 'Necesitas completar tu perfil para continuar',
              life: 3000
            });
            this.router.navigate(['/completar-perfil']);
            return;
          }
          
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

  private setUserType(tipo: string): void {
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: `Tipo de usuario "${tipo}" no soportado para visualización de perfil`,
        life: 3000
      });
    }
  }

  private isGoogleUserWithIncompleteProfile(user: any): boolean {
    const isGoogleUser = user.google_id !== null && user.google_id !== undefined && user.google_id !== '';
    const hasIncompleteProfile = user.perfil_completo === 0 || user.perfil_completo === '0' || user.perfil_completo === false;
    
    return isGoogleUser && hasIncompleteProfile;
  }
}
