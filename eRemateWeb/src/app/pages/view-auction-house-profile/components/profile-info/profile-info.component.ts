import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { UserService } from '../../../../core/services/user.service';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SecurityService } from '../../../../core/services/security.service';

interface CasaProfile {
  nombreLegal: string;
  identificacionFiscal: string;
  domicilio: string;
  email: string;
  telefono: string;
  imagen?: string;
}

@Component({
  selector: 'app-auction-house-profile-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './profile-info.component.html',
  styleUrl: './profile-info.component.scss'
})
export class ProfileInfoComponent implements OnInit {
  profileImage: string = '';
  profile: CasaProfile = {
    nombreLegal: '',
    identificacionFiscal: '',
    domicilio: '',
    email: '',
    telefono: ''
  };
  loading: boolean = false;
  
  private userId: number | null = null;
  private casaId: number | null = null;

  constructor(
    private userService: UserService,
    private auctionHouseService: AuctionHouseService,
    private messageService: MessageService,
    private securityService: SecurityService 
  ) { }

  ngOnInit(): void {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) { 
      this.userId = currentUser.id;
      this.casaId = currentUser.id; 
      this.loadProfileData();
    } else {
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) {
            this.userId = user.id;
            this.casaId = user.id;
          } else {
            this.messageService.clear();
            this.messageService.add({
              severity: 'warning',
              summary: 'Advertencia',
              detail: 'No se pudo identificar el usuario',
              life: 3000
            });
          }
          this.loadProfileData();
        },
        error: (error) => {
          this.loadProfileData(); 
        }
      });
    }
  }

  loadProfileData(): void {
    this.loading = true;
    
    if (!this.userId) {
      this.userId = 1;
    }
    
    this.userService.getUserProfile(this.userId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          if (response && response.casa && response.usuario) {
            const { casa, usuario } = response;
            
            this.profile = {
              nombreLegal: casa.nombreLegal || '',
              identificacionFiscal: casa.identificacionFiscal || '',
              domicilio: casa.domicilio || '',
              email: usuario.email || '',
              telefono: usuario.telefono || ''
            };
          } else {
            this.messageService.clear();
            this.messageService.add({
              severity: 'warning',
              summary: 'Formato incorrecto',
              detail: 'Los datos recibidos no tienen el formato esperado',
              life: 3000
            });
          }
        },
        error: (error) => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'warning',
            summary: 'Conexión al servidor',
            detail: 'Usando datos de desarrollo. No se pudo conectar al servidor.',
            life: 5000
          });
          
          this.profile = {
            nombreLegal: 'Casa de Remates Ejemplo S.A.',
            identificacionFiscal: '30-12345678-9',
            domicilio: 'Av. Ejemplo 1234, Ciudad',
            email: 'contacto@casaderemates.com',
            telefono: '+54 11 4567-8900'
          };
        }
      });
  }

  onImageUpload(event: any): void {
  }
  
  updateProfile(): void {
    this.loading = true;
    
    if (!this.casaId) {
      this.casaId = 1; 
    }
    
    const casaData = {
      nombreLegal: this.profile.nombreLegal,
      identificacionFiscal: this.profile.identificacionFiscal,
      domicilio: this.profile.domicilio,
      email: this.profile.email,          
      telefono: this.profile.telefono    
    };
    
    this.auctionHouseService.updateAuctionHouse(this.casaId, casaData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Información de la casa actualizada correctamente',
            life: 3000
          });
        },
        error: (error) => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la información de la casa',
            life: 3000
          });
        }
      });
  }
}
