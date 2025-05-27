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


interface CasaProfile {
  nombreLegal: string;
  identificacionFiscal: string;
  domicilio: string;
  email: string;
  telefono: string;
  imagen?: string;
}

@Component({
  selector: 'app-profile-info',
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
  
  
  private userId: number = 1;
  private casaId: number = 1;

  constructor(
    private userService: UserService,
    private auctionHouseService: AuctionHouseService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.loading = true;
    
    console.log('Cargando datos del perfil para el usuario con ID:', this.userId);
    
    this.userService.getUserProfile(this.userId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('Datos del perfil recibidos:', response);
          
          // Verificar que existan los objetos casa y usuario en la respuesta
          if (response && response.casa && response.usuario) {
            const { casa, usuario } = response;
            
            // Mapear los datos combinando casa y usuario
            this.profile = {
              nombreLegal: casa.nombreLegal || '',
              identificacionFiscal: casa.identificacionFiscal || '',
              domicilio: casa.domicilio || '',
              email: usuario.email || '',
              telefono: usuario.telefono || ''
            };
            
            console.log('Perfil actualizado con datos del servidor:', this.profile);
          } else {
            console.warn('La respuesta no tiene la estructura esperada');
            this.messageService.add({
              severity: 'warning',
              summary: 'Formato incorrecto',
              detail: 'Los datos recibidos no tienen el formato esperado',
              life: 3000
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar el perfil:', error);
          this.messageService.add({
            severity: 'warning',
            summary: 'Conexión al servidor',
            detail: 'Usando datos de desarrollo. No se pudo conectar al servidor.',
            life: 5000
          });
          
          // Usar datos de desarrollo para continuar trabajando
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
    console.log('Imagen seleccionada:', event);
   
  }
  
  updateProfile(): void {
    this.loading = true;
    
    // Preparar los datos para actualizar - SOLO los campos aceptados por el backend
    const casaData = {
      nombreLegal: this.profile.nombreLegal,
      identificacionFiscal: this.profile.identificacionFiscal,
      domicilio: this.profile.domicilio
      // No incluir datos de usuario ni otros campos para evitar error de "unprocesable content"
    };
    
    console.log('📤 Enviando datos de actualización:', casaData);
    
    this.auctionHouseService.updateAuctionHouse(this.casaId, casaData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('✅ Perfil actualizado con éxito:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Información de la casa actualizada correctamente',
            life: 3000
          });
        },
        error: (error) => {
          console.error('❌ Error al actualizar perfil:', error);
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
