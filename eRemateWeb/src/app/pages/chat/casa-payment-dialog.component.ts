import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaypalService } from '../../core/services/paypal.service';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-casa-payment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimaryButtonComponent],
  template: `
    <div class="payment-dialog p-4 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-bold mb-4 text-center">Solicitar Pago</h2>
      
      @if (error) {
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ error }}
        </div>
      }
      
      <form (ngSubmit)="solicitarPago()" #paymentForm="ngForm">
        <div class="mb-4">
          <label for="monto" class="block text-sm font-medium text-gray-700 mb-2">
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

        <div class="mb-4">
          <label for="metodoEntrega" class="block text-sm font-medium text-gray-700 mb-2">
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

        <div class="flex gap-3">
          <app-primary-button
            [label]="'Solicitar Pago'"
            [disabled]="!paymentForm.form.valid || loading"
            (onClick)="solicitarPago()"
            class="flex-1">
          </app-primary-button>
          
          <button
            type="button"
            (click)="cancelar()"
            [disabled]="loading"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
        </div>
        
        <div class="mt-3 text-center text-gray-500 text-sm">
          <p>El pago se procesará a través de PayPal</p>
          <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" class="h-5 mx-auto mt-1">
        </div>
      </form>
    </div>
  `,
  styles: [`
    .payment-dialog {
      min-width: 320px;
      max-width: 400px;
    }
  `]
})
export class CasaPaymentDialogComponent implements OnInit {
  @Input() chatId!: number;
  @Input() onComplete: () => void = () => {};
  @Input() onCancel: () => void = () => {};
  
  monto: number = 0;
  metodoEntrega: string = '';
  loading: boolean = false;
  error: string = '';

  metodosEntrega = [
    { value: 'domicilio', label: 'Entrega a domicilio' },
    { value: 'sucursal', label: 'Retiro en sucursal' },
    { value: 'punto_encuentro', label: 'Punto de encuentro' }
  ];

  constructor(private paypalService: PaypalService) {}

  ngOnInit(): void {}

  async solicitarPago() {
    if (this.validarFormulario()) {
      this.loading = true;
      this.error = '';
      
      try {
        await this.paypalService.procesarPagoDesdeChatId(
          this.monto,
          this.metodoEntrega,
          this.chatId
        );
        this.onComplete();
      } catch (error: any) {
        this.error = error.message || 'Error al procesar la solicitud de pago';
        this.loading = false;
      }
    }
  }

  private validarFormulario(): boolean {
    if (!this.monto || this.monto <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return false;
    }

    if (!this.metodoEntrega) {
      this.error = 'Debe seleccionar un método de entrega';
      return false;
    }

    if (!this.chatId) {
      this.error = 'Error interno: ID de chat no válido';
      return false;
    }

    return true;
  }

  cancelar() {
    this.onCancel();
  }
}
