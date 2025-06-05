import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { SecurityService } from '../../core/services/security.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { PaymentRequestDialogComponent } from './components/payment-request-dialog.component';
import { PaymentRequestListComponent } from './components/payment-request-list.component';
import { PaypalService } from '../../core/services/paypal.service';
import { Subscription } from 'rxjs';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PaymentRequestDialogComponent,
    PaymentRequestListComponent,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.scss']
})
export class ChatDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  chatId: number = 0;
  messages: any[] = [];
  newMessage: string = '';
  loading: boolean = true;
  sending: boolean = false;  currentUser: any = null;
  
  private chatSubscription?: Subscription;
  private paymentRequestSubscription?: Subscription;
  private paymentRequestUpdateSubscription?: Subscription;
  
  isCasaDeRemates: boolean = false;
  isUsuarioRegistrado: boolean = false;
  showPaymentRequestDialog: boolean = false;
  showPaymentRequestList: boolean = false;
  paymentRequests: any[] = [];
    constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private securityService: SecurityService,
    private websocketService: WebsocketService,
    private paypalService: PaypalService,
    private messageService: MessageService
  ) {}
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.chatId = +params['id'];
      this.loadChat();
      this.loadMessages();
      this.subscribeToChat();
      this.subscribeToPaymentRequests();
    });
    
    this.securityService.getActualUser().subscribe(user => {
      this.currentUser = user;
      this.isCasaDeRemates = user?.tipo === 'casa';
      this.isUsuarioRegistrado = user?.tipo === 'registrado';
      
      if (this.isUsuarioRegistrado && this.currentUser?.id) {
        this.loadPaymentRequests();
      }
    });
  }
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  
  ngOnDestroy() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.paymentRequestSubscription) {
      this.paymentRequestSubscription.unsubscribe();
    }
    if (this.paymentRequestUpdateSubscription) {
      this.paymentRequestUpdateSubscription.unsubscribe();
    }
    this.websocketService.leaveChatChannel(this.chatId);
    this.websocketService.leavePaymentRequestChannel(this.chatId);
  }

  private subscribeToChat() {
    this.chatSubscription = this.websocketService.subscribeToChat(this.chatId).subscribe({
      next: (newMessage) => {

        if (newMessage.usuario_id !== this.currentUser?.id) {
          this.messages.push(newMessage);
          this.scrollToBottom();
        }
      },
      error: (error) => {
        console.error('Error en suscripción de chat:', error);
      }
    });
  }

  private subscribeToPaymentRequests() {
    this.paymentRequestSubscription = this.websocketService.subscribeToPaymentRequests(this.chatId).subscribe({
      next: (event) => {
        console.log('Nueva solicitud de pago recibida via WebSocket:', event);        if (this.isUsuarioRegistrado) {
          this.paymentRequests.push(event.payment_request);
          
          this.messageService.add({
            severity: 'info',
            summary: 'Nueva Solicitud de Pago',
            detail: `Se recibió una nueva solicitud de pago por $${event.payment_request.monto}`,
            life: 5000
          });
        }
      },
      error: (error) => {
        console.error('Error en suscripción de solicitudes de pago:', error);
      }
    });
    this.paymentRequestUpdateSubscription = this.websocketService.subscribeToPaymentRequestUpdates(this.chatId).subscribe({
      next: (event) => {
        console.log('Actualización de solicitud de pago recibida via WebSocket:', event);
        this.onPaymentRequestsUpdated(event);
      },
      error: (error) => {
        console.error('Error en suscripción de actualizaciones de solicitudes de pago:', error);
      }
    });
  }
  
  loadChat() {
    this.chatService.getChatById(this.chatId).subscribe({
      next: (chat) => {
        // Éxito
      },
      error: (err) => {
        console.error('Error al cargar chat:', err);
      }
    });
  }
  
  loadMessages() {
    this.loading = true;
    this.chatService.getChatMessages(this.chatId).subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error al cargar mensajes:', err);
        this.loading = false;
      }
    });
  }
  
  sendMessage() {
    if (!this.newMessage.trim() || this.sending) return;
    
    this.sending = true;
    
    this.chatService.sendMessage({
      contenido: this.newMessage,
      chat_id: this.chatId,
      usuario_id: this.currentUser?.id
    }).subscribe({
      next: (response) => {
        // Agregar el mensaje inmediatamente a la lista local
        const newMsg = {
          id: response.id || Date.now(),
          contenido: this.newMessage,
          chat_id: this.chatId,
          usuario_id: this.currentUser?.id,
          created_at: new Date().toISOString(),
          tipo: 'mensaje'
        };
        this.messages.push(newMsg);
        this.newMessage = '';
        this.sending = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
        this.sending = false;
      }
    });
  }
  
  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
  
  formatMessageContent(content: string): string {
    if (content.includes('solicitud de pago')) {
      return content.replace(/([$]\d+(\.\d{1,2})?)/, '<span class="font-bold">$1</span>');
    }
    return content;
  }
  
  loadPaymentRequests() {
    this.paypalService.obtenerSolicitudesPago(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentRequests = response.data.filter((req: any) => req.chat_id === this.chatId);
        }
      },
      error: (err) => {
        console.error('Error al cargar solicitudes de pago:', err);
      }
    });
  }
  
  onPaymentRequestCreated(request: any) {
    this.loadMessages();
  }
  
  onPaymentRequestsUpdated(event: any) {
    const index = this.paymentRequests.findIndex(req => req.id === event.payment_request.id);
    if (index !== -1) {
      this.paymentRequests[index] = event.payment_request;
    }
  }
  
  processPayment(request: any) {
    this.showPaymentRequestList = false;
    
    this.router.navigate(['/pago'], {
      queryParams: {
        chat_id: this.chatId,
        monto: request.monto,
        metodo_entrega: request.metodo_entrega,
        solicitud_id: request.id
      }
    });
  }
}
