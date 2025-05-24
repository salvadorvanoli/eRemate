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

      if (!this.paymentId || !this.payerId) {
        this.loading = false;
        this.error = 'Parámetros de pago inválidos o faltantes';
      }
    });
  }

  getCurrentUser() {
    this.loadingUser = true;
    this.securityService.getActualUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadingUser = false;
        
        if (user && user.usuarioRegistrado && user.usuarioRegistrado.id) {
          // Si tenemos usuario y parámetros válidos, procesar el pago
          if (this.paymentId && this.payerId) {
            this.executePayment(this.paymentId, this.payerId);
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
          // Verificar que existe el usuario, es de tipo registrado y tiene ID
          if (user && user.tipo === 'registrado' && 'id' in user) {
            this.currentUser = user;
            this.authCheckSubscription?.unsubscribe();
            
            if (this.paymentId && this.payerId) {
              this.executePayment(this.paymentId, this.payerId);
            }
          }
        },
        error: () => {} // Ignorar errores en el polling
      });
    });
  }

  executePayment(paymentId: string, payerId: string) {
    // Verificar que el usuario es válido
    if (!this.currentUser || !('id' in this.currentUser) || this.currentUser.tipo !== 'registrado') {
      this.error = 'Usuario no válido para completar el pago';
      this.loading = false;
      return;
    }
    
    const executionData = {
      payment_id: paymentId,
      payer_id: payerId,
      usuario_registrado_id: this.currentUser.id
    };

    this.paypalService.ejecutarPago(executionData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.success) {
          this.success = true;
          this.paymentData = response.data;
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
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }

  verFactura() {
    if (this.paymentData?.factura?.id) {
      this.router.navigate(['/factura', this.paymentData.factura.id]);
    } else {
      this.error = 'No se puede acceder a la factura en este momento';
    }
  }
}
