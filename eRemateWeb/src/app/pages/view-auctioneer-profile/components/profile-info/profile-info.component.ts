import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../../../core/services/user.service';
import { ImageService } from '../../../../core/services/image.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SecurityService } from '../../../../core/services/security.service';
import { AuctioneerService } from '../../../../core/services/auctioneer.service';
import { ImageUploadInputComponent } from '../../../../shared/components/inputs/image-upload-input/image-upload-input.component';

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
  selector: 'app-profile-info-auctioneer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    ImageUploadInputComponent
  ],
  providers: [MessageService],
  templateUrl: './profile-info.component.html',
  styleUrl: './profile-info.component.scss'
})
export class ProfileInfoComponent implements OnInit {
  @ViewChild(ImageUploadInputComponent) imageUploadComponent!: ImageUploadInputComponent;

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
  selectedImages = signal<File[]>([]);
  imagesInvalid = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private securityService: SecurityService,
    private auctioneerService: AuctioneerService,
    private imageService: ImageService
  ) { }

  ngOnInit(): void {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      this.rematadorId = currentUser.id;
      this.loadProfileData();
    } else {
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) {
            this.rematadorId = user.id;
          } else {
            this.rematadorId = 1; 
          }
          this.loadProfileData();
        },
        error: (error) => {
          this.rematadorId = 1; 
          this.loadProfileData();
        }
      });
    }
  }

  loadProfileData(): void {
    if (!this.rematadorId) {
      this.rematadorId = 1;
    }
    
    this.loading = true;
    
    this.userService.getUserProfile(this.rematadorId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
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

  onImagesSelected(images: File[]): void {
    this.selectedImages.set(images);
  }

  onImageValidationChange(isInvalid: boolean): void {
    this.imagesInvalid.set(isInvalid);
  }

  private async uploadImages(): Promise<string[]> {
    const images = this.selectedImages();
    if (images.length === 0) {
      return [];
    }

    const uploadPromises = images.map(image => 
      this.imageService.uploadImage(image, 'rematadores').toPromise()
    );

    try {
      const results = await Promise.all(uploadPromises);
      const imageUrls: string[] = [];
      
      for (const result of results) {
        if (result && result.success && result.data && result.data.url) {
          imageUrls.push(result.data.url);
        }
      }
      
      return imageUrls;
    } catch (error) {
      throw error;
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

  private validateAddress(address: string): boolean {
    const addressRegex = /^[a-zA-Z\s]+\s+\d+$/;
    return addressRegex.test(address);
  }

  private validateMatricula(matricula: string): boolean {
    const matriculaRegex = /^\d{3}-\d{3}$/;
    return matriculaRegex.test(matricula);
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(phone);
  }

  updateProfile(): void {
    if (!this.rematadorId) {
      this.rematadorId = 1;
    }
    
    this.formSubmitted.set(true);

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

    if (this.imagesInvalid()) {
      validationErrors.push('Las imágenes seleccionadas no son válidas');
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join('\n');
      this.messageService.clear();
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
    
    this.uploadImages().then(imageUrls => {
      const rematadorData = {
        numeroMatricula: this.profile.numeroMatricula,
        direccionFiscal: this.profile.direccionFiscal,
        nombre: this.profile.nombre,
        apellido: this.profile.apellido,
        email: this.profile.email,
        telefono: this.profile.telefono,
        ...(imageUrls.length > 0 && { imagen: imageUrls[0] })
      };
      
      if (!this.rematadorId) {
        this.loading = false;
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo identificar el rematador',
          life: 3000
        });
        return;
      }
      
      this.auctioneerService.updateAuctioneer(this.rematadorId, rematadorData)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (response) => {
            this.messageService.clear();
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Información del rematador actualizada correctamente',
              life: 3000
            });

            if (imageUrls.length > 0) {
              this.profileImage = imageUrls[0];
            }

            this.selectedImages.set([]);
            this.formSubmitted.set(false);
            if (this.imageUploadComponent) {
              this.imageUploadComponent.reset();
            }
          },
          error: (error) => {
            this.messageService.clear();
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar la información del rematador',
              life: 3000
            });
          }
        });
    }).catch(error => {
      this.loading = false;
      this.messageService.clear();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron subir las imágenes',
        life: 3000
      });
    });
  }
}
