import { Component, signal } from '@angular/core';
import { FormTextInputComponent } from '../../../../shared/components/inputs/form-text-input/form-text-input.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { CommonModule } from '@angular/common';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormSelectInputComponent } from '../../../../shared/components/inputs/form-select-input/form-select-input.component';
import { EmailService } from '../../../../core/services/email.service';
import { EmailRequest } from '../../../../core/models/email';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-contact-us-form',
  standalone: true,
  imports: [
    CommonModule,
    FormTextInputComponent,
    PrimaryButtonComponent,
    Toast,
    FormSelectInputComponent
  ],
  providers: [MessageService],
  templateUrl: './contact-us-form.component.html',
  styleUrls: ['./contact-us-form.component.scss']
})
export class ContactUsFormComponent {
    
    @ViewChild('emailInput') emailInput: any;
    @ViewChild('asuntoInput') asuntoInput: any;
    @ViewChild('messageInput') messageInput: any;

    email: string = '';
    asunto: string = '';
    question: string = '';
    message: string = '';
    selectedOption: string = '';

    formSubmitted = signal(false);

    isEmailInvalid: boolean = false;
    isHeaderInvalid: boolean = false;
    isMessageInvalid: boolean = false;
    isOptionInvalid: boolean = false;

    emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    textAreaPattern = /^[a-zA-Z0-9\s.,;:!?'"(){}[\]<>%&$#@!^*+=áéíóúÁÉÍÓÚñÑüÜ-]+$/;

    constructor(
        private emailService: EmailService,
        private messageService: MessageService
    ) {}

    enviarConsulta() {
        this.formSubmitted.set(true);

        if (this.validateForm()) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, corrige los errores en el formulario.' });
            return;
        }

        const emailData: EmailRequest = {
            to: this.email,
            from: "libreriaalfa@gmail.com",
            subject: this.asunto,
            body: `Consulta: ${this.message}\nCategoría: ${this.selectedOption}`
        };

        this.emailService.sendEmail(emailData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'El correo fue enviado correctamente.' });
                this.resetForm();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al enviar el correo.' });
            }
        });
    }

    validateForm() {
        return this.isEmailInvalid && this.isHeaderInvalid && this.isMessageInvalid && this.isOptionInvalid;
    }

    resetForm() {
        
        this.emailInput?.reset();
        this.asuntoInput?.reset();
        this.messageInput?.reset();
        
        this.email = '';
        this.asunto = '';
        this.message = '';
        this.formSubmitted.set(false);
        
        this.isEmailInvalid = false;
        this.isHeaderInvalid = false;
        this.isMessageInvalid = false;
    }
}
