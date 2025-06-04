import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryButtonComponent } from '../buttons/primary-button/primary-button.component';
import { PaypalService } from '../../../core/services/paypal.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment-request-list',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  templateUrl: './payment-request-list.component.html'
})
export class PaymentRequestListComponent implements OnInit, OnDestroy {
  @Input() requests: any[] = [];
  @Input() chatId!: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onProcessPayment = new EventEmitter<any>();
  @Output() onRequestsUpdated = new EventEmitter<any[]>();
  
  processingPayment: boolean = false;
  processingRequestId: number | null = null;
  
  private paymentRequestSubscription?: Subscription;
  private paymentRequestUpdateSubscription?: Subscription;
    constructor(
    private paypalService: PaypalService,
    private websocketService: WebsocketService
  ) {}
  
  ngOnInit() {
    if (this.chatId) {
      this.subscribeToPaymentRequestUpdates();
    }
  }
  
  ngOnDestroy() {
    if (this.paymentRequestSubscription) {
      this.paymentRequestSubscription.unsubscribe();
    }
    if (this.paymentRequestUpdateSubscription) {
      this.paymentRequestUpdateSubscription.unsubscribe();
    }
  }
  
  private subscribeToPaymentRequestUpdates() {
    this.paymentRequestSubscription = this.websocketService.subscribeToPaymentRequests(this.chatId).subscribe({
      next: (event) => {
        console.log('Nueva solicitud de pago recibida en lista:', event);
        this.requests.push(event.payment_request);
        this.onRequestsUpdated.emit(this.requests);
      },
      error: (error) => {
        console.error('Error en suscripción de solicitudes de pago:', error);
      }
    });

    this.paymentRequestUpdateSubscription = this.websocketService.subscribeToPaymentRequestUpdates(this.chatId).subscribe({
      next: (event) => {
        console.log('Actualización de solicitud de pago recibida en lista:', event);
        const index = this.requests.findIndex(req => req.id === event.payment_request.id);
        if (index !== -1) {
          this.requests[index] = event.payment_request;
          this.onRequestsUpdated.emit(this.requests);
        }
      },
      error: (error) => {
        console.error('Error en suscripción de actualizaciones:', error);
      }
    });
  }
  
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
