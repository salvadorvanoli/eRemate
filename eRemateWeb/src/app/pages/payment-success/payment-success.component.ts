import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaypalService } from '../../core/services/paypal.service';
import { SecurityService } from '../../core/services/security.service';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  
  loading: boolean = true;
  loadingUser: boolean = true;
  success: boolean = false;
  error: string = '';
  paymentData: any = null;
  currentUser: any = null;
  paymentId: string = '';
  payerId: string = '';
  chatId: number | null = null;
  
  private authCheckSubscription?: Subscription;
  private maxRetries = 10;
  private retryCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paypalService: PaypalService,
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    this.getPaymentParams();
    this.getCurrentUser();
  }

  ngOnDestroy() {
    if (this.authCheckSubscription) {
      this.authCheckSubscription.unsubscribe();
    }
  }

  getPaymentParams() {
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['paymentId'] || '';
      this.payerId = params['PayerID'] || '';
      this.chatId = params['chat_id'] ? parseInt(params['chat_id'], 10) : null;

      if (!this.paymentId || !this.payerId) {
        this.loading = false;
        this.error = 'Parámetros de pago inválidos o faltantes';
      }
    });
  }  getCurrentUser() {
    this.loadingUser = true;
    this.securityService.getActualUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadingUser = false;
        if (user) {
          // Primero verificar con el backend si el pago ya fue procesado
          if (this.paymentId) {
            this.checkPaymentAlreadyProcessed();
          }
        } else {
          // Iniciar polling para verificar autenticación
          this.startAuthCheckPolling();
        }
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.loadingUser = false;
        this.startAuthCheckPolling();
      }
    });
  }
  startAuthCheckPolling() {
    // Verificar la autenticación cada 2 segundos
    this.authCheckSubscription = interval(2000).subscribe(() => {
      if (this.retryCount >= this.maxRetries) {
        this.authCheckSubscription?.unsubscribe();
        this.loading = false;
        this.error = 'No se pudo autenticar al usuario. Por favor, inicie sesión e intente nuevamente.';
        return;
      }

      this.retryCount++;
      this.securityService.getActualUser().subscribe({
        next: (user) => {
          if (user && user.tipo === 'registrado') {
            this.currentUser = user;
            this.authCheckSubscription?.unsubscribe();
            
            // Verificar con el backend si el pago ya fue procesado
            if (this.paymentId) {
              this.checkPaymentAlreadyProcessed();
            }
          }
        },
        error: () => {} 
      });
    });
  }

  checkPaymentAlreadyProcessed() {
    // Verificar primero con el backend
    this.paypalService.verificarPagoProcesado(this.paymentId).subscribe({
      next: (response) => {
        if (response.success && response.processed) {
          // El pago ya fue procesado en el backend
          this.paymentData = response.data;
          this.success = true;
          this.loading = false;
          
          // Actualizar localStorage con los datos del backend
          const paymentProcessedKey = `payment_processed_${this.paymentId}`;
          const paymentDataKey = `payment_data_${this.paymentId}`;
          localStorage.setItem(paymentProcessedKey, 'true');
          localStorage.setItem(paymentDataKey, JSON.stringify(response.data));
        } else {
          // El pago no fue procesado, verificar localStorage como fallback
          this.checkLocalStorageAndProcess();
        }
      },
      error: (error) => {
        console.error('Error al verificar pago procesado:', error);
        // En caso de error, verificar localStorage como fallback
        this.checkLocalStorageAndProcess();
      }
    });
  }

  checkLocalStorageAndProcess() {
    // Verificar si el pago ya fue procesado localmente
    const paymentProcessedKey = `payment_processed_${this.paymentId}`;
    const paymentAlreadyProcessed = localStorage.getItem(paymentProcessedKey);
    
    if (paymentAlreadyProcessed) {
      // El pago ya fue procesado, mostrar la información guardada
      const savedPaymentData = localStorage.getItem(`payment_data_${this.paymentId}`);
      if (savedPaymentData) {
        this.paymentData = JSON.parse(savedPaymentData);
        this.success = true;
        this.loading = false;
        return;
      }
    }
    
    // Si tenemos usuario y parámetros válidos, procesar el pago
    if (this.paymentId && this.payerId) {
      this.executePayment(this.paymentId, this.payerId);
    }
  }
  executePayment(paymentId: string, payerId: string) {
    // Verificar que el usuario es válido
    if (!this.currentUser || this.currentUser.tipo !== 'registrado') {
      this.error = 'Usuario no válido para completar el pago';
      this.loading = false;
      return;
    }
    
    const executionData: any = {
      payment_id: paymentId,
      payer_id: payerId,
      usuario_registrado_id: this.currentUser.id
    };

    // Si tenemos un chat ID, lo incluimos
    if (this.chatId) {
      executionData.chat_id = this.chatId;
    }    // Incluir el payment_request_id si está disponible en sessionStorage
    const storedRequestId = sessionStorage.getItem('payment_request_id');
    console.log('Verificando payment_request_id en sessionStorage:', storedRequestId);
    
    if (storedRequestId) {
      executionData.payment_request_id = parseInt(storedRequestId, 10);
      console.log('Payment request ID agregado a executionData:', executionData.payment_request_id);
    } else {
      console.log('No se encontró payment_request_id en sessionStorage');
    }

    console.log('Datos completos para ejecutar pago:', executionData);

    this.paypalService.ejecutarPago(executionData).subscribe({
      next: (response) => {
        this.loading = false;        if (response && response.success) {
          this.success = true;
          this.paymentData = response.data;
            // Guardar el estado del pago procesado y los datos en localStorage (permanente)
          const paymentProcessedKey = `payment_processed_${this.paymentId}`;
          const paymentDataKey = `payment_data_${this.paymentId}`;
          localStorage.setItem(paymentProcessedKey, 'true');
          localStorage.setItem(paymentDataKey, JSON.stringify(response.data));
          
          // Limpiar el payment_request_id del sessionStorage después del éxito
          sessionStorage.removeItem('payment_request_id');
          
          // Guardar el chat_id si viene en la respuesta
          if (response.data?.chat_id) {
            this.chatId = response.data.chat_id;
          }
        } else {
          this.error = response.error || 'Error al procesar el pago';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error ejecutando pago:', error);
        this.error = error.error?.error || error.message || 'Error al ejecutar el pago';
      }
    });
  }  volverAlInicio() {
    // No limpiar los datos del pago para mantenerlos permanentemente
    if (this.chatId) {
      this.router.navigate(['/chat-detail/', this.chatId]);
    } else {
      this.router.navigate(['/inicio']);
    }
  }

  verFactura() {
    if (this.paymentData?.factura?.id) {
      this.router.navigate(['/factura', this.paymentData.factura.id]);
    } else {
      this.error = 'No se puede acceder a la factura en este momento';
    }
  }

  private clearPaymentData() {
    if (this.paymentId) {
      localStorage.removeItem(`payment_processed_${this.paymentId}`);
      localStorage.removeItem(`payment_data_${this.paymentId}`);
    }
  }
}
