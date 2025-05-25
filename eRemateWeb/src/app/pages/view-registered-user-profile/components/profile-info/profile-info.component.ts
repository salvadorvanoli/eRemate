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

// Interfaz para el perfil de usuario registrado
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
  
  // ID hardcodeado para desarrollo
  private userId: number = 1;

  constructor(
    private userService: UserService,
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
          
          // Verificar que exista el objeto usuario en la respuesta
          if (response && response.usuario) {
            const { usuario } = response;
            
            // Mapear los datos del usuario
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
          
          // Usar datos de desarrollo para continuar trabajando
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
    // No hacer nada con la imagen seleccionada
  }
  
  updateProfile(): void {
    this.loading = true;
    
    // Preparar los datos para actualizar
    const userData = {
      nombre: this.profile.nombre,
      direccion: this.profile.direccion,
      telefono: this.profile.telefono,
      email: this.profile.email
    };
    
    console.log('📤 Enviando datos de actualización:', userData);
    
    
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
    

    /*
    this.userService.updateUserProfile(this.userId, userData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('✅ Perfil actualizado con éxito:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Información del usuario actualizada correctamente',
            life: 3000
          });
        },
        error: (error) => {
          console.error('❌ Error al actualizar perfil:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la información del usuario',
            life: 3000
          });
        }
      });
    */
  }
}
