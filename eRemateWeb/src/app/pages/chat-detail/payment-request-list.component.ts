import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { PaypalService } from '../../core/services/paypal.service';

@Component({
  selector: 'app-payment-request-list',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  templateUrl: './payment-request-list.component.html'
})
export class PaymentRequestListComponent {
  @Input() requests: any[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onProcessPayment = new EventEmitter<any>();
  
  processingPayment: boolean = false;
  processingRequestId: number | null = null;
  
  constructor(private paypalService: PaypalService) {}
  
  getMetodoEntregaLabel(metodo: string): string {
    const metodos: { [key: string]: string } = {
      'domicilio': 'Entrega a domicilio',
      'sucursal': 'Retiro en sucursal',
      'punto_encuentro': 'Punto de encuentro'
    };
    
    return metodos[metodo] || metodo;
  }
  
  processPayment(request: any): void {
    this.processingPayment = true;
    this.processingRequestId = request.id;
    
    // Usar el servicio para procesar el pago
    this.onProcessPayment.emit(request);
  }
}
