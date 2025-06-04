import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { SecurityService } from '../../core/services/security.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { PaymentRequestDialogComponent } from '../../shared/components/payment/payment-request-dialog.component';
import { PaymentRequestListComponent } from '../../shared/components/payment/payment-request-list.component';
import { PaypalService } from '../../core/services/paypal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-detail',
  standalone: true,  imports: [
    CommonModule, 
    FormsModule, 
    PaymentRequestDialogComponent,
    PaymentRequestListComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold">Chat #{{ chatId }}</h1>
            <p class="text-sm opacity-90">
              {{ isCasaDeRemates ? 'Chat con Cliente' : 'Chat con Casa de Remates' }}
            </p>
          </div>
          
          <div class="flex gap-2">
            @if (isCasaDeRemates) {
              <button 
                (click)="showPaymentRequestDialog = true"
                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Solicitar Pago
              </button>
            }
            
            @if (isUsuarioRegistrado) {
              <button 
                (click)="showPaymentRequestList = true"
                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Solicitudes de Pago
                @if (paymentRequests.length > 0) {
                  <span class="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {{ paymentRequests.length }}
                  </span>
                }
              </button>
            }
          </div>
        </div>
        
        <!-- Messages container -->
        <div class="p-4 h-96 overflow-y-auto bg-gray-50" #messagesContainer>
          @if (loading) {
            <div class="flex justify-center items-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          } @else if (messages.length === 0) {
            <div class="flex justify-center items-center h-full text-gray-500">
              No hay mensajes. ¡Comienza la conversación!
            </div>
          } @else {
            @for (message of messages; track message.id) {
              <div class="mb-3" [ngClass]="{'text-right': message.usuario_id === currentUser?.id}">
                <div class="inline-block max-w-[80%] px-4 py-2 rounded-lg" 
                     [ngClass]="message.tipo === 'solicitud_pago' ? 
                                'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                                message.usuario_id === currentUser?.id ? 
                                'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'">
                  <p [innerHTML]="formatMessageContent(message.contenido)"></p>
                  <p class="text-xs opacity-70 mt-1">{{ message.created_at | date:'short' }}</p>
                </div>
              </div>
            }
          }
        </div>
        
        <!-- Message input -->
        <div class="p-4 border-t">
          <div class="flex">
            <input 
              type="text" 
              [(ngModel)]="newMessage" 
              (keydown.enter)="sendMessage()"
              placeholder="Escribe un mensaje..." 
              class="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button 
              (click)="sendMessage()" 
              [disabled]="!newMessage.trim() || sending"
              class="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400">
              {{ sending ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Request Dialog -->
    @if (showPaymentRequestDialog) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <app-payment-request-dialog
          [chatId]="chatId"
          (onClose)="showPaymentRequestDialog = false"
          (onRequestCreated)="onPaymentRequestCreated($event)">
        </app-payment-request-dialog>
      </div>
    }
    
    <!-- Payment Request List -->
    @if (showPaymentRequestList) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <app-payment-request-list
          [requests]="paymentRequests"
          (onClose)="showPaymentRequestList = false"
          (onProcessPayment)="processPayment($event)">
        </app-payment-request-list>
      </div>
    }
  `
})
export class ChatDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  chatId: number = 0;
  messages: any[] = [];
  newMessage: string = '';
  loading: boolean = true;
  sending: boolean = false;
  currentUser: any = null;
    // WebSocket subscription
  private chatSubscription?: Subscription;
  private paymentRequestSubscription?: Subscription;
  private paymentRequestUpdateSubscription?: Subscription;
  
  // Payment related
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
    private paypalService: PaypalService
  ) {}
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.chatId = +params['id'];      this.loadChat();
      this.loadMessages();
      this.subscribeToChat(); // Suscribirse al WebSocket del chat
      this.subscribeToPaymentRequests(); // Suscribirse a las solicitudes de pago
    });
      this.securityService.getActualUser().subscribe(user => {
      this.currentUser = user;
      this.isCasaDeRemates = user?.tipo === 'casa';
      this.isUsuarioRegistrado = user?.tipo === 'registrado';
      
      console.log('Current user:', user);
      console.log('User type:', user?.tipo);
      console.log('Is Casa de Remates:', this.isCasaDeRemates);
      console.log('Is Usuario Registrado:', this.isUsuarioRegistrado);
      
      if (this.isUsuarioRegistrado && this.currentUser?.id) {
        this.loadPaymentRequests();
      }
    });
  }
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
    ngOnDestroy() {
    // Limpiar suscripciones al salir del componente
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
    // Suscribirse a mensajes en tiempo real para este chat
    this.chatSubscription = this.websocketService.subscribeToChat(this.chatId).subscribe({
      next: (newMessage) => {
        console.log('Nuevo mensaje recibido via WebSocket:', newMessage);
        // Solo agregar el mensaje si no es del usuario actual (evitar duplicados)
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
    // Suscribirse a nuevas solicitudes de pago
    this.paymentRequestSubscription = this.websocketService.subscribeToPaymentRequests(this.chatId).subscribe({
      next: (event) => {
        console.log('Nueva solicitud de pago recibida via WebSocket:', event);
        if (this.isUsuarioRegistrado) {
          // Agregar la nueva solicitud a la lista
          this.paymentRequests.push(event.payment_request);
          
          // Opcional: mostrar notificación
          alert('¡Nueva solicitud de pago recibida!');
        }
      },
      error: (error) => {
        console.error('Error en suscripción de solicitudes de pago:', error);
      }
    });

    // Suscribirse a actualizaciones de estado de solicitudes de pago
    this.paymentRequestUpdateSubscription = this.websocketService.subscribeToPaymentRequestUpdates(this.chatId).subscribe({
      next: (event) => {
        console.log('Actualización de solicitud de pago recibida via WebSocket:', event);
        // Actualizar el estado en la lista local
        const index = this.paymentRequests.findIndex(req => req.id === event.payment_request.id);
        if (index !== -1) {
          this.paymentRequests[index] = event.payment_request;
        }
      },
      error: (error) => {
        console.error('Error en suscripción de actualizaciones de solicitudes de pago:', error);
      }
    });
  }
  
  loadChat() {
    this.chatService.getChatById(this.chatId).subscribe({
      next: (chat) => {
        console.log('Chat cargado:', chat);
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
