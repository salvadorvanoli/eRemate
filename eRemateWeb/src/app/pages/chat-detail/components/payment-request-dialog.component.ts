import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaypalService } from '../../../core/services/paypal.service';
import { PrimaryButtonComponent } from '../../../shared/components/buttons/primary-button/primary-button.component';
import { ChatService } from '../../../core/services/chat.service';
import { SecurityService } from '../../../core/services/security.service';

@Component({
  selector: 'app-payment-request-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimaryButtonComponent],
  template: `
    <div class="payment-dialog p-4 bg-white rounded-lg shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Solicitar Pago</h2>
        <button (click)="onClose.emit()" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      @if (error) {
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4">
          {{ error }}
        </div>
      }
      
      <form (ngSubmit)="enviarSolicitud()" #solicitudForm="ngForm">
        <div class="mb-4">
          <label for="monto" class="block text-sm font-medium text-gray-700 mb-1">
            Monto (USD)
          </label>
          <input
            type="number"
            id="monto"
            name="monto"
            [(ngModel)]="monto"
            step="0.01"
            min="0.01"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00">
        </div>

        <div class="mb-6">
          <label for="metodoEntrega" class="block text-sm font-medium text-gray-700 mb-1">
            Método de Entrega
          </label>
          <select
            id="metodoEntrega"
            name="metodoEntrega"
            [(ngModel)]="metodoEntrega"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccione un método</option>
            @for (metodo of metodosEntrega; track metodo.value) {
              <option [value]="metodo.value">{{ metodo.label }}</option>
            }
          </select>
        </div>

        <div class="flex justify-end gap-2">
          <button 
            type="button" 
            (click)="onClose.emit()" 
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Cancelar
          </button>
          
          <app-primary-button
            [label]="enviando ? 'Enviando...' : 'Enviar Solicitud'"
            [disabled]="!solicitudForm.form.valid || enviando"
            (onClick)="enviarSolicitud()">
          </app-primary-button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .payment-dialog {
      min-width: 320px;
      max-width: 450px;
    }
  `]
})
export class PaymentRequestDialogComponent implements OnInit {
  @Input() chatId!: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRequestCreated = new EventEmitter<any>();
  
  monto: number | null = null;
  metodoEntrega: string = '';
  error: string = '';
  enviando: boolean = false;
  currentUser: any = null;
  
  metodosEntrega = [
    { value: 'domicilio', label: 'Entrega a domicilio' },
    { value: 'sucursal', label: 'Retiro en sucursal' },
    { value: 'punto_encuentro', label: 'Punto de encuentro' }
  ];
  
  constructor(
    private paypalService: PaypalService,
    private chatService: ChatService,
    private securityService: SecurityService
  ) {}
  
  ngOnInit() {
    this.securityService.getActualUser().subscribe(user => {
      this.currentUser = user;
    });
  }
  
  enviarSolicitud() {
    if (!this.monto || this.monto <= 0 || !this.metodoEntrega || !this.chatId) {
      this.error = 'Por favor, complete todos los campos correctamente';
      return;
    }
    
    this.enviando = true;
    this.error = '';
    
    this.paypalService.crearSolicitudPago(
      this.monto,
      this.metodoEntrega,
      this.chatId
    ).subscribe({
      next: (response) => {
        console.log('Solicitud de pago creada:', response);
          // Enviar un mensaje al chat informando de la solicitud
        this.chatService.sendMessage({
          contenido: `💰 Se ha enviado una solicitud de pago por $${this.monto}. El cliente puede procesar el pago accediendo a "Solicitudes de Pago" desde el chat.`,
          chat_id: this.chatId,
          usuario_id: this.currentUser?.id,
          tipo: 'solicitud_pago'
        }).subscribe({
          next: () => {
            this.enviando = false;
            this.onRequestCreated.emit(response.data);
            this.onClose.emit();
          },
          error: (err) => {
            console.error('Error al enviar mensaje:', err);
            this.enviando = false;
            this.error = 'Se creó la solicitud pero no se pudo enviar el mensaje al chat';
          }
        });
      },
      error: (err) => {
        console.error('Error al crear solicitud de pago:', err);
        this.enviando = false;
        this.error = err.error?.error || 'Error al enviar la solicitud de pago';
      }
    });
  }
}
