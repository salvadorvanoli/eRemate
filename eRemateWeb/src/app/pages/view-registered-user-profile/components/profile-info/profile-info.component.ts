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
import { RegisteredUsersService } from '../../../../core/services/registered-users.service';

interface UserProfile {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  imagen?: string;
}

interface FormErrors {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
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
    apellido: '',
    telefono: '',
    email: ''
  };
  loading: boolean = false;
  
  formErrors: FormErrors = {
    nombre: '',
    apellido: '',
    telefono: '',
    email: ''
  };
  
  private userId: number | null = null;
  
 
  private nameRegex = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private phoneRegex = /^\d{9}$/;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private securityService: SecurityService,
    private registeredUsersService: RegisteredUsersService
  ) { }

  ngOnInit(): void {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      this.userId = currentUser.id;
      this.loadProfileData();
    } else {
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) {
            this.userId = user.id;
          } else {
            this.userId = 1; 
          }
          this.loadProfileData();
        },
        error: (error) => {
          this.userId = 1; 
          this.loadProfileData();
        }
      });
    }
  }

  loadProfileData(): void {
    if (!this.userId) {
      this.userId = 1;
    }
    
    this.loading = true;
    
    this.userService.getUserProfile(this.userId)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (response) => {
        console.log('Respuesta del perfil:', response);
        

        if (response && response.usuario && response.usuarioRegistrado) {
          const { usuario, usuarioRegistrado } = response;
          
          this.profile = {
            nombre: usuarioRegistrado?.nombre || '',
            apellido: usuarioRegistrado?.apellido || '',
            email: usuario?.email || '',
            telefono: usuario?.telefono || ''
          };
          
          console.log('Perfil cargado:', this.profile);
        } 

        else if (response && response.data) {
          const { usuarioRegistrado, usuario } = response.data;
          
          this.profile = {
            nombre: usuarioRegistrado?.nombre || '',
            apellido: usuarioRegistrado?.apellido || '',
            email: usuario?.email || '',
            telefono: usuario?.telefono || ''
          };
          
          console.log('Perfil cargado (estructura data):', this.profile);
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
        
        // Datos de prueba
        this.profile = {
          nombre: 'Usuario Ejemplo',
          apellido: 'Apellido Ejemplo',
          email: 'usuario@ejemplo.com',
          telefono: '+54 11 4567-8900'
        };
      }
    });
  }

  onImageUpload(event: any): void {
  }
  
  validateName(): void {
    if (!this.profile.nombre || this.profile.nombre.trim() === '') {
      this.formErrors.nombre = 'El nombre es obligatorio';
    } else if (!this.nameRegex.test(this.profile.nombre)) {
      this.formErrors.nombre = 'El nombre debe contener solo letras';
    } else if (this.profile.nombre.length > 50) {
      this.formErrors.nombre = 'El nombre no debe exceder 50 caracteres';
    } else {
      this.formErrors.nombre = '';
    }
  }
  
  validateLastName(): void {
    if (!this.profile.apellido || this.profile.apellido.trim() === '') {
      this.formErrors.apellido = 'El apellido es obligatorio';
    } else if (!this.nameRegex.test(this.profile.apellido)) {
      this.formErrors.apellido = 'El apellido debe contener solo letras';
    } else if (this.profile.apellido.length > 50) {
      this.formErrors.apellido = 'El apellido no debe exceder 50 caracteres';
    } else {
      this.formErrors.apellido = '';
    }
  }
  
  validateEmail(): void {
    if (!this.profile.email || this.profile.email.trim() === '') {
      this.formErrors.email = 'El email es obligatorio';
    } else if (!this.emailRegex.test(this.profile.email)) {
      this.formErrors.email = 'El formato del email no es válido';
    } else if (this.profile.email.length > 100) {
      this.formErrors.email = 'El email no debe exceder 100 caracteres';
    } else {
      this.formErrors.email = '';
    }
  }
  
  validatePhone(): void {
    if (!this.profile.telefono || this.profile.telefono.trim() === '') {
      this.formErrors.telefono = 'El teléfono es obligatorio';
    } else if (!this.phoneRegex.test(this.profile.telefono)) {
      this.formErrors.telefono = 'El teléfono debe contener exactamente 9 dígitos';
    } else {
      this.formErrors.telefono = '';
    }
  }
  
  validateAll(): boolean {
    this.validateName();
    this.validateLastName();
    this.validateEmail();
    this.validatePhone();
    
    return !this.hasErrors();
  }
  
  hasErrors(): boolean {
    return !!(this.formErrors.nombre || 
             this.formErrors.apellido || 
             this.formErrors.email || 
             this.formErrors.telefono);
  }
  
  updateProfile(): void {
    if (!this.userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al usuario',
        life: 3000
      });
      return;
    }
    
  
    if (!this.validateAll()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de validación',
        detail: 'Por favor, corrija los errores en el formulario',
        life: 3000
      });
      return;
    }
    
    this.loading = true;
    
    const userData = {
      nombre: this.profile.nombre,
      apellido: this.profile.apellido, 
      email: this.profile.email,
      telefono: this.profile.telefono
    };
    
    this.registeredUsersService.updateUserProfile(this.userId, userData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('Respuesta de actualización:', response);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Información del usuario actualizada correctamente',
            life: 3000
          });
          
          if (response && response.data) {
            const { usuarioRegistrado, usuario } = response.data;
            
            this.profile = {
              nombre: usuarioRegistrado?.nombre || this.profile.nombre,
              apellido: usuarioRegistrado?.apellido || this.profile.apellido,
              email: usuario?.email || this.profile.email,
              telefono: usuario?.telefono || this.profile.telefono
            };
          }
        },
        error: (error) => {
          console.error('Error al actualizar perfil:', error);
          
          let errorMsg = 'No se pudo actualizar la información del usuario';
          
          if (error.error && error.error.message) {
            errorMsg = error.error.message;
          } else if (error.error && error.error.errors) {
            const firstErrorField = Object.keys(error.error.errors)[0];
            if (firstErrorField && error.error.errors[firstErrorField][0]) {
              errorMsg = error.error.errors[firstErrorField][0];
            }
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg,
            life: 5000
          });
        }
      });
  }
}
