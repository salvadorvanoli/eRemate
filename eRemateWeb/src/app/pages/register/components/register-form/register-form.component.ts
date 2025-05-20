import { Component, computed, signal } from '@angular/core';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SecurityService } from '../../../../core/services/security.service';

import { FormTextInputComponent } from '../../../../shared/components/inputs/form-text-input/form-text-input.component';
import { InteractivePasswordInputComponent } from '../interactive-password-input/interactive-password-input.component';
import { FormPasswordInputComponent } from '../../../../shared/components/inputs/form-password-input/form-password-input.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { FormSelectInputComponent } from '../../../../shared/components/inputs/form-select-input/form-select-input.component';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [
    Toast,
    FormTextInputComponent,
    InteractivePasswordInputComponent,
    FormPasswordInputComponent,
    PrimaryButtonComponent,
    FormSelectInputComponent
  ],
  providers: [
    MessageService,
    SecurityService
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent {

  email: string = '';
  phone: string = '';
  selectedOption: string = '';
  password = signal('');
  confirmPassword = signal('');

  name: string = '';
  lastname: string = '';
  registrationNumber: string = '';
  fiscalAddress: string = '';
  image: string = '';

  fiscalAddressHouse: string = '';
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

  isFiscalAddressHouseInvalid: boolean = false;
  isTaxIdentificationNumberInvalid: boolean = false;
  isLegalNameInvalid: boolean = false;
  isLegalAddressInvalid: boolean = false;

  arePasswordsDifferent = computed(() => {
    return this.formSubmitted() && this.validatePasswordsAreDifferent();
  });

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
    private SecurityService: SecurityService
  ) {}

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
          imagen: this.image
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
          this.messageService.add({ severity: 'success', summary: 'Operación exitosa', detail: '¡Usuario creado exitosamente!', life: 4000 });
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
      this.isFiscalAddressHouseInvalid ||
      this.isTaxIdentificationNumberInvalid ||
      this.isLegalNameInvalid ||
      this.isLegalAddressInvalid;
    } else {
      return true
    }
  }
}
