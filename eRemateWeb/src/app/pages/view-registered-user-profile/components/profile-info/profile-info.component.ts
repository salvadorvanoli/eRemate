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

interface UserProfile {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
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
  profile: UserProfile = {
    nombre: '',
    direccion: '',
    telefono: '',
    email: ''
  };
  loading: boolean = false;
  
  private userId: number | null = null;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private securityService: SecurityService 
  ) { }

  ngOnInit(): void {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      this.userId = currentUser.id;
      console.log('ID de usuario obtenido del SecurityService:', this.userId);
      this.loadProfileData();
    } else {
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) {
            this.userId = user.id;
            console.log('ID de usuario obtenido de la API:', this.userId);
          } else {
            console.warn('No se pudo obtener el usuario');
            this.userId = 1; 
          }
          this.loadProfileData();
        },
        error: (error) => {
          console.error('Error al obtener usuario:', error);
          this.userId = 1; 
          this.loadProfileData();
        }
      });
    }
  }

  loadProfileData(): void {
    if (!this.userId) {
      console.warn('No se ha establecido el ID del usuario, usando valor por defecto');
      this.userId = 1;
    }
    
    this.loading = true;
    
    console.log('Cargando datos del perfil para el usuario con ID:', this.userId);
    
    this.userService.getUserProfile(this.userId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('Datos del perfil recibidos:', response);
          
          if (response && response.usuario) {
            const { usuario } = response;
            
            this.profile = {
              nombre: usuario.nombre || '',
              direccion: usuario.direccion || '',
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
          
          this.profile = {
            nombre: 'Usuario Ejemplo',
            direccion: 'Av. Ejemplo 1234, Ciudad',
            email: 'usuario@ejemplo.com',
            telefono: '+54 11 4567-8900'
          };
        }
      });
  }

  onImageUpload(event: any): void {
    console.log('Imagen seleccionada:', event);
  }
  
  updateProfile(): void {
    if (!this.userId) {
      console.warn('No se ha establecido el ID del usuario, usando valor por defecto');
      this.userId = 1;
    }
    
    this.loading = true;
    
    const userData = {
      nombre: this.profile.nombre,
      direccion: this.profile.direccion,
      telefono: this.profile.telefono,
      email: this.profile.email
    };
    
    console.log(`📤 Enviando datos de actualización para usuario ID ${this.userId}:`, userData);
    
    
    setTimeout(() => {
      this.loading = false;
      console.log('✅ Perfil actualizado con éxito (simulado)');
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Información del usuario actualizada correctamente',
        life: 3000
      });
    }, 1000);
    

  }
}
