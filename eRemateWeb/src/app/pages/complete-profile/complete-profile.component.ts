import { Component, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SecurityService } from '../../core/services/security.service';
import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormTextInputComponent } from '../../shared/components/inputs/form-text-input/form-text-input.component';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { FormSelectInputComponent } from '../../shared/components/inputs/form-select-input/form-select-input.component';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    CommonModule,
    Toast,
    FormTextInputComponent,
    PrimaryButtonComponent,
    FormSelectInputComponent
  ],
  providers: [
    MessageService,
    SecurityService
  ],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss'
})
export class CompleteProfileComponent implements OnInit {

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

  // Campos de rematador
  name: string = '';
  lastname: string = '';
  registrationNumber: string = '';
  fiscalAddress: string = '';
  image: string = '';

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
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener datos de Google del localStorage
    const googleDataString = localStorage.getItem('google_registration_data');
    if (googleDataString) {
      this.googleData = JSON.parse(googleDataString);
    } else {
      // Si no hay datos de Google, redirigir al registro
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Advertencia', 
        detail: 'No se encontraron datos de registro de Google', 
        life: 4000 
      });
      this.router.navigate(['/register']);
    }
  }

  completeProfile() {
    this.formSubmitted.set(true);
    
    if (!this.validateForm()) {
      const profileData: any = {
        telefono: this.phone,
        tipo: this.selectedOption
      };

      // Agregar campos específicos según el tipo de usuario
      if (this.selectedOption === 'rematador') {
        Object.assign(profileData, {
          nombre: this.name,
          apellido: this.lastname,
          numeroMatricula: this.registrationNumber,
          direccionFiscal: this.fiscalAddress,
          imagen: this.image
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
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Operación exitosa', 
            detail: '¡Perfil completado exitosamente!', 
            life: 4000 
          });
          
          // Limpiar datos de Google del localStorage
          localStorage.removeItem('google_registration_data');
          
          // Redirigir a la página principal
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          if (err.error.errors) {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: JSON.stringify(err.error.errors), 
              life: 4000 
            });
          } else {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'No fue posible completar el perfil', 
              life: 4000 
            });
          }
        }
      });
    } else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Datos ingresados inválidos', 
        life: 4000 
      });
    }
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
    this.image = '';

    this.taxIdentificationNumber = '';
    this.legalName = '';
    this.legalAddress = '';

    // Resetear estado del formulario
    this.formSubmitted.set(false);

    // Resetear estados de validación
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
}
