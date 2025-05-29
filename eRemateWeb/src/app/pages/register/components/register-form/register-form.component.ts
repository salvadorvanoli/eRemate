import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SecurityService } from '../../../../core/services/security.service';
import { ImageService } from '../../../../core/services/image.service';
import { ViewChild } from '@angular/core';

import { FormTextInputComponent } from '../../../../shared/components/inputs/form-text-input/form-text-input.component';
import { InteractivePasswordInputComponent } from '../interactive-password-input/interactive-password-input.component';
import { FormPasswordInputComponent } from '../../../../shared/components/inputs/form-password-input/form-password-input.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { FormSelectInputComponent } from '../../../../shared/components/inputs/form-select-input/form-select-input.component';
import { ImageUploadInputComponent } from '../../../../shared/components/inputs/image-upload-input/image-upload-input.component';

import { GoogleSigninComponent } from '../../../../shared/components/google-signin/google-signin.component';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';

@Component({
  selector: 'app-register-form',
  standalone: true,  imports: [
    Toast,
    FormTextInputComponent,
    InteractivePasswordInputComponent,
    FormPasswordInputComponent,
    PrimaryButtonComponent,
    FormSelectInputComponent,
    ImageUploadInputComponent,
    GoogleSigninComponent
  ],
  providers: [
    MessageService,
    SecurityService
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent implements OnInit, OnDestroy {

  // Campos de usuario compartidos
  @ViewChild('emailInput') emailInput: any;
  @ViewChild('phoneInput') phoneInput: any;
  @ViewChild('passwordInput') passwordInput: any;
  @ViewChild('confirmPasswordInput') confirmPasswordInput: any;

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

  email: string = '';
  phone: string = '';  selectedOption: string = '';
  previousSelectedOption: string = ''; // Para rastrear cambios de tipo
  registrationSuccessful: boolean = false; // Para rastrear si el registro fue exitoso
  password = signal('');
  confirmPassword = signal('');
  name: string = '';
  lastname: string = '';
  registrationNumber: string = '';
  fiscalAddress: string = '';
  images: any[] = []; // Cambiado de image: string a images: any[]

  taxIdentificationNumber: string = '';
  legalName: string = '';
  legalAddress: string = '';

  formSubmitted = signal(false);

  isEmailInvalid: boolean = false;
  isPasswordInvalid: boolean = false;
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

  arePasswordsDifferent = computed(() => {
    return this.formSubmitted() && this.validatePasswordsAreDifferent();
  });

  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  phonePattern = /^[0-9]{9,15}$/;  namePattern = /^[a-zA-ZÀ-ÿ\s]+$/;
  registrationNumberPattern = /^[a-zA-Z0-9-]{5,15}$/;
  fiscalAddressPattern = /^[a-zA-Z0-9\s.,-]{5,100}$/;
  taxIdentificationNumberPattern = /^[a-zA-Z0-9-]{5,20}$/;
  addressPattern = /^[a-zA-Z0-9\s.,#-]{5,100}$/;  constructor(
    private messageService: MessageService,
    private SecurityService: SecurityService,
    private imageService: ImageService,
    private googleAuthService: GoogleAuthService,
    private router: Router
  ) {}

  ngOnInit() {
  }

  ngOnDestroy() {
    if (!this.registrationSuccessful && this.images.length > 0) {
      this.cleanupPreviousImages();
    }
  }

  register() {
    this.formSubmitted.set(true);
    if (!this.validateForm()) {
      const usuario: any = {
        email: this.email,
        telefono: this.phone,
        contrasenia: this.password(),
        tipo: this.selectedOption
      };
      
      if (this.selectedOption === 'rematador') {        
        Object.assign(usuario, {
          nombre: this.name,
          apellido: this.lastname,
          numeroMatricula: this.registrationNumber,
          direccionFiscal: this.fiscalAddress,
          imagenes: this.images // Para el backend será un array, pero solo contendrá 1 imagen
        });
      } else if (this.selectedOption === 'casa') {
        Object.assign(usuario, {
          identificacionFiscal: this.taxIdentificationNumber,
          nombreLegal: this.legalName,
          domicilio: this.legalAddress
        });
      }      
      
      this.SecurityService.register(usuario).subscribe({
        next: () => {
          this.registrationSuccessful = true;
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Operación exitosa', 
            detail: '¡Usuario creado exitosamente!', 
            life: 4000 
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        error: (err: any) => {
          if (err.error.errors) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: JSON.stringify(err.error.errors), life: 4000 });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No fue posible conectar con el servidor', life: 4000 });
          }
        }
      });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Datos ingresados inválidos', life: 4000 });
    }
  }

  validatePasswordsAreDifferent() {
    return this.password() !== this.confirmPassword();
  }

  validateForm() {
    if(this.selectedOption === 'registrado') {
      return this.isEmailInvalid ||
      this.isPasswordInvalid ||
      this.arePasswordsDifferent() ||
      this.isOptionInvalid ||
      this.isPhoneInvalid;
    } else if(this.selectedOption === 'rematador') {
      return this.isEmailInvalid ||
      this.isPasswordInvalid ||
      this.arePasswordsDifferent() ||
      this.isOptionInvalid ||
      this.isPhoneInvalid ||
      this.isNameInvalid ||
      this.isLastnameInvalid ||
      this.isRegistrationNumberInvalid ||
      this.isFiscalAddressInvalid ||
      this.isImageInvalid;
    } else if(this.selectedOption === 'casa') {
      return this.isEmailInvalid ||
      this.isPasswordInvalid ||
      this.arePasswordsDifferent() ||
      this.isOptionInvalid ||
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
    this.emailInput?.reset();
    this.phoneInput?.reset();
    this.passwordInput?.reset();
    this.confirmPasswordInput?.reset();

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
    this.email = '';
    this.phone = '';
    this.password.set('');
    this.confirmPassword.set('');    this.name = '';
    this.lastname = '';
    this.registrationNumber = '';
    this.fiscalAddress = '';
    this.images = []; // Cambiado de image a images

    this.taxIdentificationNumber = '';
    this.legalName = '';
    this.legalAddress = '';

    // Resetear estado del formulario
    this.formSubmitted.set(false);

    // Resetear estados de validación
    this.isEmailInvalid = false;
    this.isPasswordInvalid = false;
    this.isPhoneInvalid = false;

    this.isNameInvalid = false;
    this.isLastnameInvalid = false;
    this.isRegistrationNumberInvalid = false;
    this.isFiscalAddressInvalid = false;
    this.isImageInvalid = false;

    this.isTaxIdentificationNumberInvalid = false;
    this.isLegalNameInvalid = false;    this.isLegalAddressInvalid = false;
  }
  
  resetFormWithoutImages() {
    // Resetear inputs básicos
    this.emailInput?.reset();
    this.phoneInput?.reset();
    this.passwordInput?.reset();
    this.confirmPasswordInput?.reset();

    // Resetear inputs de rematador (excepto imagen)
    this.nameInput?.reset();
    this.lastnameInput?.reset();
    this.registrationNumberInput?.reset();
    this.fiscalAddressInput?.reset();

    // Resetear inputs de casa de remates
    this.taxIdInput?.reset();
    this.legalNameInput?.reset();
    this.legalAddressInput?.reset();

    // Resetear variables locales (excepto images)
    this.email = '';
    this.phone = '';
    this.password.set('');
    this.confirmPassword.set('');
    this.name = '';
    this.lastname = '';
    this.registrationNumber = '';
    this.fiscalAddress = '';

    this.taxIdentificationNumber = '';
    this.legalName = '';
    this.legalAddress = '';

    // Resetear estado del formulario
    this.formSubmitted.set(false);

    // Resetear estados de validación
    this.isEmailInvalid = false;
    this.isPasswordInvalid = false;
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
  
  onImagesSelected(images: any[]) {
    this.images = images;
  }

  onImageValidationChange(isInvalid: boolean) {
    this.isImageInvalid = isInvalid;
  }

  onUserTypeChange(newType: string) {
    if (this.previousSelectedOption !== newType && this.images.length > 0) {
      
      this.cleanupPreviousImages();
      
      if (this.imageInput) {
        this.imageInput.reset();
      }
      
      this.images = [];
      this.isImageInvalid = false;
    }
    
    this.previousSelectedOption = this.selectedOption;
    this.selectedOption = newType;
  }

  private cleanupPreviousImages() {
    // Crear una copia del array antes de limpiarlo
    const imagesToDelete = [...this.images];
    
    imagesToDelete.forEach(image => {
      if (image.filename && image.folder) {
        this.imageService.deleteImage(image.folder, image.filename).subscribe({
          next: (response) => {
            console.log('Imagen eliminada del servidor (registro):', image.filename, response.message);
          },
          error: (error) => {
            console.warn('Error al eliminar imagen (registro):', image.filename, error);
          }
        });
      }
    });
  }

  onGoogleAuth(event: any): void {
    
    if (event && event.token) {
      this.SecurityService.googleRegister(event.token).subscribe({
        next: (response) => {
          
          if (event.user) {
            localStorage.setItem('google_registration_data', JSON.stringify({
              name: event.user.name,
              email: event.user.email,
              picture: event.user.picture,
              token: event.token
            }));
          }
          
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Operación exitosa', 
            detail: '¡Registro inicial exitoso! Completa tu perfil', 
            life: 4000 
          });
          
          this.router.navigate(['/completar-perfil']);
        },
        error: (err) => {
          let errorMessage = 'Error en autenticación con Google';
          if (err.error?.error) {
            errorMessage = err.error.error;
          }
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: errorMessage, 
            life: 4000 
          });
        }
      });
    }
  }
}
