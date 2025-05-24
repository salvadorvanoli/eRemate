import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaypalService } from '../../core/services/paypal.service';
import { SecurityService } from '../../core/services/security.service';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimaryButtonComponent],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  
  monto: number = 0;
  metodoEntrega: string = '';
  loading: boolean = false;
  error: string = '';
  currentUser: any = null;

  metodosEntrega = [
    { value: 'domicilio', label: 'Entrega a domicilio' },
    { value: 'sucursal', label: 'Retiro en sucursal' },
    { value: 'punto_encuentro', label: 'Punto de encuentro' }
  ];

  constructor(
    private paypalService: PaypalService,
    private securityService: SecurityService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getCurrentUser();
    this.getPaymentData();
  }

  getCurrentUser() {
    this.securityService.getActualUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.router.navigate(['/inicio-sesion']);
      }
    });
  }

  getPaymentData() {
    // Obtener datos del query params si están disponibles
    this.route.queryParams.subscribe(params => {
      if (params['monto']) {
        this.monto = parseFloat(params['monto']);
      }
    });
  }

  async procesarPago() {
    if (!this.validarFormulario()) {
        return;
    }

    // Obtener usuario actual del SecurityService
    if (!this.currentUser?.usuarioRegistrado?.id) {
        this.error = 'Debe iniciar sesión para realizar pagos';
        return;
    }

    this.loading = true;
    this.error = '';

    try {
        await this.paypalService.procesarPagoPayPal(
            this.monto,
            this.metodoEntrega,
            this.currentUser.usuarioRegistrado.id
        );
    } catch (error: any) {
        this.error = error.message || 'Error al procesar el pago';
        this.loading = false;
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

    return true;
  }

  cancelar() {
    this.router.navigate(['/']);
  }
}
