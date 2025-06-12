import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SecurityService } from '../../core/services/security.service';
import { ImageService } from '../../core/services/image.service';
import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormTextInputComponent } from '../../shared/components/inputs/form-text-input/form-text-input.component';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { FormSelectInputComponent } from '../../shared/components/inputs/form-select-input/form-select-input.component';
import { ImageUploadInputComponent } from '../../shared/components/inputs/image-upload-input/image-upload-input.component';

@Component({
  selector: 'app-complete-profile',
  standalone: true,  imports: [
    CommonModule,
    Toast,
    FormTextInputComponent,
    PrimaryButtonComponent,
    FormSelectInputComponent,
    ImageUploadInputComponent
  ],
  providers: [
    MessageService,
    SecurityService
  ],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss'
})

export class CompleteProfileComponent implements OnInit, OnDestroy {

  // Campo de usuario compartido
  @ViewChild('phoneInput') phoneInput: any;

  // Campos de rematador
  @ViewChild('nameInput') nameInput: any;
  @ViewChild('lastnameInput') lastnameInput: any;
  @ViewChild('registrationNumberInput') registrationNumberInput: any;
  @ViewChild('fiscalAddressInput') fiscalAddressInput: any;
  @ViewChild('imageInput') imageInput: any;

  // Campos de casa de remates
  @ViewChild('taxIdInput') taxIdInput: any;
  @ViewChild('legalNameInput') legalNameInput: any;
  @ViewChild('legalAddressInput') legalAddressInput: any;

  // Datos de Google
  googleData: any = null;

  // Campos básicos
  phone: string = '';
  selectedOption: string = '';
  previousSelectedOption: string = '';
  profileCompletionSuccessful: boolean = false;

  // Campos de rematador
  name: string = '';
  lastname: string = '';
  registrationNumber: string = '';
  fiscalAddress: string = '';
  images: File[] = [];

  // Campos de casa de remates
  taxIdentificationNumber: string = '';
  legalName: string = '';
  legalAddress: string = '';

  formSubmitted = signal(false);

  // Estados de validación
  isPhoneInvalid: boolean = false;
  isOptionInvalid: boolean = false;

  isNameInvalid: boolean = false;
  isLastnameInvalid: boolean = false;
  isRegistrationNumberInvalid: boolean = false;
  isFiscalAddressInvalid: boolean = false;
  isImageInvalid: boolean = false;

  isTaxIdentificationNumberInvalid: boolean = false;
  isLegalNameInvalid: boolean = false;
  isLegalAddressInvalid: boolean = false;

  // Patrones de validación
  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  phonePattern = /^[0-9]{9,15}$/;
  namePattern = /^[a-zA-ZÀ-ÿ\s]+$/;
  registrationNumberPattern = /^[a-zA-Z0-9-]{5,15}$/;
  fiscalAddressPattern = /^[a-zA-Z0-9\s.,-]{5,100}$/;
  imagePattern = /\.(jpg|jpeg|png|gif)$/i;
  taxIdentificationNumberPattern = /^[a-zA-Z0-9-]{5,20}$/;
  addressPattern = /^[a-zA-Z0-9\s.,#-]{5,100}$/;

  constructor(
    private messageService: MessageService,
    private securityService: SecurityService,
    private imageService: ImageService,
    private router: Router
  ) {}  
  
  ngOnInit() {
    const googleDataString = localStorage.getItem('google_registration_data');
    if (googleDataString) {
      this.googleData = JSON.parse(googleDataString);
      return;
    }

    const currentUser = this.securityService.actualUser;
    if (currentUser) {
      this.checkUserProfileStatus(currentUser);
    } else {

      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user) {
            this.checkUserProfileStatus(user);
          } else {
            this.redirectToRegister('No se encontró información del usuario');
          }
        },
        error: () => {
          this.redirectToRegister('Error al obtener información del usuario');
        }
      });
    }
  }

  ngOnDestroy(): void {
      
  }
  
  private checkUserProfileStatus(user: any) {

    if (user.perfil_completo === 1 || user.perfil_completo === '1' || user.perfil_completo === true) {
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Perfil completo', 
        detail: 'Tu perfil ya está completo', 
        life: 3000 
      });
      this.router.navigate(['/']);
      return;
    }
    
    this.googleData = {
      email: user.email,
      name: user.nombre || '',
      picture: user.imagen || ''
    };
  }

  private redirectToRegister(message: string) {
    this.messageService.clear();
    this.messageService.add({ 
      severity: 'warn', 
      summary: 'Advertencia', 
      detail: message, 
      life: 4000 
    });
    this.router.navigate(['/register']);
  }

  completeProfile() {
    this.formSubmitted.set(true);
    
    if (!this.validateForm()) {
      if (this.images.length > 0) {
        this.uploadImagesAndCompleteProfile();
      } else {
        this.performProfileCompletion([]);
      }
    } else {
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Datos ingresados inválidos', 
        life: 4000 
      });
    }
  }

  private async uploadImagesAndCompleteProfile() {
    try {
      const folder = this.getSelectedFolder();
      const uploadedImages: any[] = [];

      // Subir todas las imágenes
      for (const file of this.images) {
        const response = await this.imageService.uploadImage(file, folder).toPromise();
        if (response && response.success && response.data) {
          uploadedImages.push(response.data);
        }
      }

      this.performProfileCompletion(uploadedImages);
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Error al subir las imágenes. Intente nuevamente.', 
        life: 4000 
      });
    }
  }

  private performProfileCompletion(uploadedImages: any[]) {
    const profileData: any = {
      telefono: this.phone,
      tipo: this.selectedOption
    };

    if (this.selectedOption === 'rematador') {        
      Object.assign(profileData, {
        nombre: this.name,
        apellido: this.lastname,
        numeroMatricula: this.registrationNumber,
        direccionFiscal: this.fiscalAddress,
        imagenes: uploadedImages
      });
    } else if (this.selectedOption === 'casa') {
      Object.assign(profileData, {
        identificacionFiscal: this.taxIdentificationNumber,
        nombreLegal: this.legalName,
        domicilio: this.legalAddress
      });
    }      
    
    this.securityService.completeProfile(profileData).subscribe({
      next: () => {
        this.profileCompletionSuccessful = true;
        this.messageService.clear();
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Operación exitosa', 
          detail: '¡Perfil completado exitosamente!', 
          life: 4000 
        });
        
        localStorage.removeItem('google_registration_data');

        setTimeout(() => {
          this.router.navigate(['/']).then(() => {
            window.location.reload(); // Fuerza recarga completa
          });
        }, 500);
      },
      error: (err: any) => {
        if (err.error.errors) {
          this.messageService.clear();
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: JSON.stringify(err.error.errors), 
            life: 4000 
          });
        } else {
          this.messageService.clear();
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'No fue posible completar el perfil', 
            life: 4000 
          });
        }
      }
    });
  }

  validateForm() {
    if(this.selectedOption === 'registrado') {
      return this.isOptionInvalid ||
      this.isPhoneInvalid;
    } else if(this.selectedOption === 'rematador') {
      return this.isOptionInvalid ||
      this.isPhoneInvalid ||
      this.isNameInvalid ||
      this.isLastnameInvalid ||
      this.isRegistrationNumberInvalid ||
      this.isFiscalAddressInvalid ||
      this.isImageInvalid;
    } else if(this.selectedOption === 'casa') {
      return this.isOptionInvalid ||
      this.isPhoneInvalid ||
      this.isTaxIdentificationNumberInvalid ||
      this.isLegalNameInvalid ||
      this.isLegalAddressInvalid;
    } else {
      return true
    }
  }

  resetForm() {
    // Resetear inputs básicos
    this.phoneInput?.reset();
    
    // Resetear inputs de rematador
    this.nameInput?.reset();
    this.lastnameInput?.reset();
    this.registrationNumberInput?.reset();
    this.fiscalAddressInput?.reset();
    this.imageInput?.reset();

    // Resetear inputs de casa de remates
    this.taxIdInput?.reset();
    this.legalNameInput?.reset();
    this.legalAddressInput?.reset();

    // Resetear variables locales
    this.phone = '';    
    this.name = '';
    this.lastname = '';
    this.registrationNumber = '';
    this.fiscalAddress = '';
    this.images = [];

    this.taxIdentificationNumber = '';
    this.legalName = '';
    this.legalAddress = '';

    this.formSubmitted.set(false);

    this.isPhoneInvalid = false;

    this.isNameInvalid = false;
    this.isLastnameInvalid = false;
    this.isRegistrationNumberInvalid = false;
    this.isFiscalAddressInvalid = false;
    this.isImageInvalid = false;

    this.isTaxIdentificationNumberInvalid = false;
    this.isLegalNameInvalid = false;    
    this.isLegalAddressInvalid = false;
  }
  onImagesSelected(images: File[]) {
    this.images = images;
  }

  onImageValidationChange(isInvalid: boolean) {
    this.isImageInvalid = isInvalid;
  }

  onUserTypeChange(newType: string) {
    if (this.previousSelectedOption !== newType && this.images.length > 0) {
      if (this.imageInput) {
        this.imageInput.reset();
      }
      
      this.images = [];
      this.isImageInvalid = false;
    }
    
    this.previousSelectedOption = this.selectedOption;
    this.selectedOption = newType;
  }

  private getSelectedFolder(): string {
    switch (this.selectedOption) {
      case 'rematador':
        return 'rematadores';
      case 'casa':
        return 'casas';
      default:
        return 'usuarios';
    }
  }
}
