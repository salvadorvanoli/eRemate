import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { UserService } from '../../../../core/services/user.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SecurityService } from '../../../../core/services/security.service';
import { AuctioneerService } from '../../../../core/services/auctioneer.service'; 

interface RematadorProfile {
  nombre: string;         
  numeroMatricula: string;  
  apellido: string;        
  email: string;
  telefono: string;
  direccionFiscal: string;
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
  profile: RematadorProfile = {
    nombre: '',             
    numeroMatricula: '',    
    apellido: '',           
    email: '',
    telefono: '',
    direccionFiscal: ''
  };
  loading: boolean = false;
  
  private rematadorId: number | null = null; 

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private securityService: SecurityService,
    private auctioneerService: AuctioneerService 
  ) { }

  ngOnInit(): void {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      this.rematadorId = currentUser.id;
      console.log('ID de rematador obtenido del SecurityService:', this.rematadorId);
      this.loadProfileData();
    } else {
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) {
            this.rematadorId = user.id;
            console.log('ID de rematador obtenido de la API:', this.rematadorId);
          } else {
            console.warn('No se pudo obtener el usuario');
            this.rematadorId = 1; 
          }
          this.loadProfileData();
        },
        error: (error) => {
          console.error('Error al obtener usuario:', error);
          this.rematadorId = 1; 
          this.loadProfileData();
        }
      });
    }
  }

  loadProfileData(): void {
    if (!this.rematadorId) {
      console.warn('No se ha establecido el ID del rematador, usando valor por defecto');
      this.rematadorId = 1;
    }
    
    this.loading = true;
    console.log('Cargando datos del rematador con ID:', this.rematadorId);
    
    this.userService.getUserProfile(this.rematadorId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('Datos del perfil recibidos:', response);
          
          if (response && response.rematador && response.usuario) {
            const { rematador, usuario } = response;
            
            this.profile = {
              nombre: rematador.nombre || '',            
              numeroMatricula: rematador.numeroMatricula || '', 
              apellido: rematador.apellido || '',         
              email: usuario.email || '',
              telefono: usuario.telefono || '',
              direccionFiscal: rematador.direccionFiscal || ''
            };
            
            if (rematador.imagen) {
              this.profileImage = rematador.imagen;
            }
            
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
          
          this.profile = {
            nombre: 'Juan',              
            numeroMatricula: 'REM-12345', 
            apellido: 'Pérez',            
            email: 'juan.perez@ejemplo.com',
            telefono: '+598 99 123 456',
            direccionFiscal: 'Av. 18 de Julio 1234, Montevideo'
          };
        }
      });
  }

  onImageUpload(event: any): void {
    console.log('Imagen seleccionada:', event);
  }
  
  

  // Función para validar email con expresión regular
  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

  // Función para validar dirección fiscal (letras seguidas de números)
  private validateAddress(address: string): boolean {
    const addressRegex = /^[a-zA-Z\s]+\s+\d+$/;
    return addressRegex.test(address);
  }

  // Función para validar número de matrícula (3 números-3 números)
  private validateMatricula(matricula: string): boolean {
    const matriculaRegex = /^\d{3}-\d{3}$/;
    return matriculaRegex.test(matricula);
  }

  // Función para validar teléfono (9 números)
  private validatePhone(phone: string): boolean {
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(phone);
  }


  updateProfile(): void {
    if (!this.rematadorId) {
      console.warn('No se ha establecido el ID del rematador, usando valor por defecto');
      this.rematadorId = 1;
    }
    

    const validationErrors = [];
    
    if (!this.validateEmail(this.profile.email)) {
      validationErrors.push('El correo electrónico no tiene un formato válido');
    }
    
    if (!this.validateAddress(this.profile.direccionFiscal)) {
      validationErrors.push('La dirección fiscal debe contener letras seguidas de un número');
    }
    
    if (!this.validateMatricula(this.profile.numeroMatricula)) {
      validationErrors.push('El número de matrícula debe tener el formato XXX-XXX (3 números, guion, 3 números)');
    }
    
    if (!this.validatePhone(this.profile.telefono)) {
      validationErrors.push('El teléfono debe contener exactamente 9 números');
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join('\n');
      this.messageService.add({
        severity: 'error',
        summary: 'Error de validación',
        detail: errorMessage,
        life: 5000,
        sticky: true
      });
      return;
    }
    
    this.loading = true;
    
    const rematadorData = {
      numeroMatricula: this.profile.numeroMatricula,
      direccionFiscal: this.profile.direccionFiscal,
      nombre: this.profile.nombre,
      apellido: this.profile.apellido,
      email: this.profile.email,
      telefono: this.profile.telefono
    };
    
    console.log(`📤 Enviando datos de actualización para rematador ID ${this.rematadorId}:`, rematadorData);
    
    this.auctioneerService.updateAuctioneer(this.rematadorId, rematadorData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('✅ Perfil actualizado con éxito:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Información del rematador actualizada correctamente',
            life: 3000
          });
        },
        error: (error) => {
          console.error('❌ Error al actualizar perfil:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la información del rematador',
            life: 3000
          });
        }
      });
  }
}
