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
import { FormTextareaInputComponent } from '../../../../shared/components/inputs/form-textarea-input/form-textarea-input.component';

@Component({
  selector: 'app-contact-us-form',
  standalone: true,
  imports: [
    CommonModule,
    FormTextInputComponent,
    PrimaryButtonComponent,
    Toast,
    FormSelectInputComponent,
    FormTextareaInputComponent
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
    messagePattern = /^.{1,}$/;

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
            from: "ereamteutec@gmail.com",
            subject: `[eRemate] ${this.asunto} - ${this.getSelectedOptionLabel()}`,
            body: this.createHtmlEmailBody(),
            isHtml: true
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

    private createHtmlEmailBody(): string {
        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Consulta - eLibreriaAlfa</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        background-color: #2c3e50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        margin: -30px -30px 30px -30px;
                        border-radius: 8px 8px 0 0;
                    }
                    .content {
                        margin: 20px 0;
                    }
                    .info-row {
                        margin: 15px 0;
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                    }
                    .label {
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .message-content {
                        background-color: #ecf0f1;
                        padding: 20px;
                        border-radius: 5px;
                        margin: 20px 0;
                        border: 1px solid #bdc3c7;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ecf0f1;
                        text-align: center;
                        color: #7f8c8d;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nueva Consulta - eRemate</h1>
                    </div>
                    
                    <div class="content">
                        <p>Se ha recibido una nueva consulta a través del formulario de contacto:</p>
                        
                        <div class="info-row">
                            <span class="label">Email del remitente:</span> ${this.email}
                        </div>
                        
                        <div class="info-row">
                            <span class="label">Categoría:</span> ${this.getSelectedOptionLabel()}
                        </div>
                        
                        <div class="info-row">
                            <span class="label">Asunto:</span> ${this.asunto}
                        </div>
                        
                        <div class="message-content">
                            <div class="label">Mensaje:</div>
                            <p>${this.message.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Este correo fue enviado desde el formulario de contacto de eLibreriaAlfa</p>
                        <p>Fecha: ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES')}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    private getSelectedOptionLabel(): string {
        const options = [
            { label: 'Consulta general', value: 'general' },
            { label: 'Soporte técnico', value: 'soporte' },
            { label: 'Sugerencias', value: 'sugerencias' },
            { label: 'Problema con la compra', value: 'compra' },
            { label: 'Problema con el acceso', value: 'acceso' },
            { label: 'Problema con el contenido', value: 'contenido' },
            { label: 'Problema con la cuenta', value: 'cuenta' },
            { label: 'Problema con el pago', value: 'pago' },
            { label: 'Otro', value: 'otro' }
        ];
        
        const option = options.find(opt => opt.value === this.selectedOption);
        return option ? option.label : this.selectedOption;
    }
}
