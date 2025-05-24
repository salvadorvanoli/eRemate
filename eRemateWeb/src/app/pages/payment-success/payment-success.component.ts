import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaypalService } from '../../core/services/paypal.service';
import { SecurityService } from '../../core/services/security.service';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  
  loading: boolean = true;
  success: boolean = false;
  error: string = '';
  paymentData: any = null;
  currentUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paypalService: PaypalService,
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    this.getCurrentUser();
    this.processPaymentSuccess();
  }

  getCurrentUser() {
    this.securityService.getActualUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
      }
    });
  }

  processPaymentSuccess() {
    this.route.queryParams.subscribe(params => {
      const paymentId = params['paymentId'];
      const payerId = params['PayerID'];

      if (!paymentId || !payerId) {
        this.error = 'Parámetros de pago inválidos';
        this.loading = false;
        return;
      }

      if (!this.currentUser?.usuarioRegistrado?.id) {
        setTimeout(() => this.processPaymentSuccess(), 1000);
        return;
      }

      this.executePayment(paymentId, payerId);
    });
  }

  executePayment(paymentId: string, payerId: string) {
    const executionData = {
      payment_id: paymentId,
      payer_id: payerId,
      usuario_registrado_id: this.currentUser.usuarioRegistrado.id
    };

    this.paypalService.ejecutarPago(executionData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          this.paymentData = response.data;
        } else {
          this.error = response.error || 'Error al procesar el pago';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Error al ejecutar el pago';
      }
    });
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }

  verFactura() {
    if (this.paymentData?.factura?.id) {
      this.router.navigate(['/factura', this.paymentData.factura.id]);
    }
  }
}
