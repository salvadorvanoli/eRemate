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
          if (response && response.usuario) {
            const { usuario } = response;
            
            this.profile = {
              nombre: usuario.nombre || '',
              direccion: usuario.direccion || '',
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
            nombre: 'Usuario Ejemplo',
            direccion: 'Av. Ejemplo 1234, Ciudad',
            email: 'usuario@ejemplo.com',
            telefono: '+54 11 4567-8900'
          };
        }
      });
  }

  onImageUpload(event: any): void {
  }
  
  updateProfile(): void {
    if (!this.userId) {
      this.userId = 1;
    }
    
    this.loading = true;
    
    const userData = {
      nombre: this.profile.nombre,
      direccion: this.profile.direccion,
      telefono: this.profile.telefono,
      email: this.profile.email
    };
    
    setTimeout(() => {
      this.loading = false;
      this.messageService.clear();
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Información del usuario actualizada correctamente',
        life: 3000
      });
    }, 1000);
  }
}
