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
  loadingUser: boolean = true;
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
    this.loadingUser = true;
    this.securityService.getActualUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadingUser = false;

        // Verificar si el usuario es de tipo 'registrado'
        if (!user || user.tipo !== 'registrado') {
          this.error = 'Debe iniciar sesión como usuario registrado para realizar pagos';
          setTimeout(() => {
            this.router.navigate(['/inicio-sesion'], { 
              queryParams: { returnUrl: this.router.url }
            });
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.loadingUser = false;
        this.error = 'Error al obtener información del usuario';
        setTimeout(() => {
          this.router.navigate(['/inicio-sesion'], { 
            queryParams: { returnUrl: this.router.url }
          });
        }, 2000);
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

    if (this.loadingUser) {
      this.error = 'Espere mientras cargamos su información...';
      return;
    }

    // Verificar usuario registrado con verificación segura de tipo
    if (!this.currentUser || this.currentUser.tipo !== 'registrado' || !('id' in this.currentUser)) {
      this.error = 'Debe iniciar sesión como usuario registrado para realizar pagos';
      setTimeout(() => {
        this.router.navigate(['/inicio-sesion'], { 
          queryParams: { returnUrl: this.router.url }
        });
      }, 2000);
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      console.log('Procesando pago con usuario ID:', this.currentUser.id);
      await this.paypalService.procesarPagoPayPal(
        this.monto,
        this.metodoEntrega,
        this.currentUser.id
      );
      // No necesitamos manejar el redireccionamiento aquí, ya que PayPal lo hará
    } catch (error: any) {
      this.loading = false;
      this.error = error.message || 'Error al procesar el pago. Intente nuevamente.';
      console.error('Error de pago:', error);
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

  // Método para determinar si el botón debe estar deshabilitado
  isButtonDisabled(): boolean {
    return this.loading || 
           this.loadingUser || 
           !this.monto || 
           this.monto <= 0 || 
           !this.metodoEntrega || 
           !this.currentUser || 
           this.currentUser.tipo !== 'registrado' || 
           !('id' in this.currentUser);
  }
}
