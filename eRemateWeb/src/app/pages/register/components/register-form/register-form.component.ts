import { Component, computed, signal } from '@angular/core';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../../core/services/user.service';
import { AccesoUsuario, UsuarioSimple } from '../../../../core/models/usuario';

import { FormTextInputComponent } from '../../../../shared/components/inputs/form-text-input/form-text-input.component';
import { InteractivePasswordInputComponent } from '../interactive-password-input/interactive-password-input.component';
import { FormPasswordInputComponent } from '../../../../shared/components/inputs/form-password-input/form-password-input.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [
    Toast,
    FormTextInputComponent,
    InteractivePasswordInputComponent,
    FormPasswordInputComponent,
    PrimaryButtonComponent
  ],
  providers: [
    MessageService
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent {

  email: string = '';
  password = signal('');
  confirmPassword = signal('');
  formSubmitted = signal(false);

  isEmailInvalid: boolean = false;
  isPasswordInvalid: boolean = false;

  arePasswordsDifferent = computed(() => {
    return this.formSubmitted() && this.validatePasswordsAreDifferent();
  });

  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private messageService: MessageService,
    private userService: UserService
  ) {}

  register() {
    this.formSubmitted.set(true);
    if (!this.validateForm()) {

      const usuario: AccesoUsuario = {
        email: this.email,
        contrasenia: this.password()
      };
      
      this.userService.post(usuario).subscribe({
        next: (response: UsuarioSimple) => {
          this.messageService.add({ severity: 'success', summary: 'Operación exitosa', detail: "¡Usuario creado exitosamente!", life: 4000 });
          console.log(response);
        },
        error: (err) => {
          if (err.error.error !== undefined) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.error, life: 4000 });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: "No fue posible conectar con el servidor", life: 4000 });
          }
        }
      });

    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: "Datos ingresados inválidos", life: 4000 });
    }
  }

  validatePasswordsAreDifferent() {
    return this.password() !== this.confirmPassword();
  }

  validateForm() {
    return this.isEmailInvalid || this.isPasswordInvalid || this.arePasswordsDifferent();
  }
}
