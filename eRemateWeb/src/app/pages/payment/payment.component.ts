import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaypalService } from '../../core/services/paypal.service';
import { SecurityService } from '../../core/services/security.service';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { ChatService } from '../../core/services/chat.service';

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
  chatId: number | null = null;
  solicitudId: number | null = null;

  metodosEntrega = [
    { value: 'domicilio', label: 'Entrega a domicilio' },
    { value: 'sucursal', label: 'Retiro en sucursal' },
    { value: 'punto_encuentro', label: 'Punto de encuentro' }
  ];

  constructor(
    private paypalService: PaypalService,
    private securityService: SecurityService,
    private chatService: ChatService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit() {
    this.getCurrentUser();
    this.getPaymentData();
    this.verificarCredencialesPayPal();
  }

  verificarCredencialesPayPal() {
    this.paypalService.verificarCredenciales().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (!response.data.credentialsValid) {
            this.error = 'Las credenciales de PayPal no son válidas. Por favor, contacte al administrador.';
            console.error('Credenciales de PayPal inválidas:', response.data);
          }
        } else {
          console.warn('No se pudo verificar las credenciales de PayPal:', response);
        }
      },
      error: (err) => {
        console.error('Error al verificar credenciales de PayPal:', err);
      }
    });
  }
  getCurrentUser() {
    this.loadingUser = true;
    this.securityService.getActualUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadingUser = false;

        if (user && user.tipo === 'registrado') {
          // Una vez que tenemos el usuario, verificar el chat si hay chatId
          if (this.chatId) {
            this.verificarChat();
          }
        } else {
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
      
      if (params['chat_id']) {
        this.chatId = parseInt(params['chat_id'], 10);
        // No verificar el chat aquí, lo haremos después de obtener el usuario
      }
      
      // Si venimos de una solicitud de pago, también tendremos el método de entrega
      if (params['metodo_entrega']) {
        this.metodoEntrega = params['metodo_entrega'];
      }
      
      // Guardamos el ID de la solicitud si existe
      if (params['solicitud_id']) {
        this.solicitudId = parseInt(params['solicitud_id'], 10);
      }
    });
  }
  verificarChat() {
    if (!this.chatId) return;
    
    console.log('Verificando chat ID:', this.chatId);
    console.log('Usuario actual:', this.currentUser);
    
    this.chatService.getChatById(this.chatId).subscribe({
      next: (chat) => {
        console.log('Chat obtenido:', chat);
        
        if (!this.currentUser) {
          console.log('No hay usuario autenticado, esperando...');
          return; // No verificar permisos hasta que tengamos usuario
        }
        
        if (!chat) {
          this.error = 'Chat no encontrado';
          this.chatId = null;
          return;
        }
        
        // Log detallado para debugging
        console.log('Verificando permisos:');
        console.log('- Usuario ID:', this.currentUser.id);
        console.log('- Usuario tipo:', this.currentUser.tipo);
        console.log('- Chat usuarioRegistrado_id:', chat.usuarioRegistrado_id);
        console.log('- Chat casa_de_remate_id:', chat.casa_de_remate_id);
        
        // Verificar que el usuario actual pertenece a este chat
        const tienePermiso = (
          chat.usuarioRegistrado_id === this.currentUser.id || 
          chat.casa_de_remate_id === this.currentUser.id
        );
        
        if (tienePermiso) {
          console.log('Chat verificado correctamente - Usuario tiene permisos');
          // Limpiar cualquier error previo
          if (this.error === 'No tiene permisos para realizar pagos en este chat') {
            this.error = '';
          }
        } else {
          console.log('Usuario sin permisos para este chat');
          this.error = 'No tiene permisos para realizar pagos en este chat';
          this.chatId = null;
        }
      },
      error: (err) => {
        console.error('Error al verificar chat:', err);
        this.error = 'Error al verificar el chat';
        this.chatId = null;
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

    // Verificar usuario registrado
    if (!this.currentUser || this.currentUser.tipo !== 'registrado') {
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
      // Si tenemos un chatId, usamos ese método
      if (this.chatId) {
        console.log('Procesando pago desde chat ID:', this.chatId);
        
        // Si venimos de una solicitud, procesamos el pago desde la solicitud
        if (this.solicitudId) {
          console.log('Procesando pago desde solicitud ID:', this.solicitudId);
          await this.paypalService.procesarPagoDesdeSolicitud(
            this.solicitudId,
            this.chatId
          );
        } else {
          await this.paypalService.procesarPagoDesdeChatId(
            this.monto,
            this.metodoEntrega,
            this.chatId
          );
        }
      } else {
        // Si no tenemos chat, intentamos usar el ID del usuario directamente
        console.log('No hay chat ID, procesando pago directo con usuario ID');
        // No necesitamos obtenerIdUsuario ya que la identidad se manejará en el backend
        await this.paypalService.procesarPagoPayPal(
          this.monto,
          this.metodoEntrega,
          this.currentUser.id  // El backend verificará la identidad con el token
        );
      }
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
    if (this.chatId) {
      this.router.navigate(['/chat-detail', this.chatId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  // Método para determinar si el botón debe estar deshabilitado
  isButtonDisabled(): boolean {
    return this.loading || 
           this.loadingUser || 
           !this.monto || 
           this.monto <= 0 || 
           !this.metodoEntrega || 
           !this.currentUser || 
           this.currentUser.tipo !== 'registrado';
  }
}
