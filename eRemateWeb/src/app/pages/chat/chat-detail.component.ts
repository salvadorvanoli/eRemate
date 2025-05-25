import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { SecurityService } from '../../core/services/security.service';
import { FormsModule } from '@angular/forms';
import { CasaPaymentDialogComponent } from './casa-payment-dialog.component';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CasaPaymentDialogComponent],
  template: `
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header p-4 border-b flex justify-between items-center">
        <h2 class="text-xl font-semibold">Chat #{{ chatId }}</h2>
        
        @if (currentUser && currentUser.tipo === 'casa') {
          <button 
            (click)="mostrarPagoDialog = true"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none">
            Solicitar Pago
          </button>
        }
      </div>

      <!-- Messages -->
      <div class="chat-messages p-4 overflow-y-auto" #messagesContainer>
        @if (loading) {
          <div class="flex justify-center my-4">
            <div class="loader"></div>
          </div>
        } @else if (messages.length === 0) {
          <div class="text-center text-gray-500 my-4">
            No hay mensajes. ¡Inicia la conversación!
          </div>
        } @else {
          @for (message of messages; track message.id) {
            <div class="message my-2" [ngClass]="{'self-message': message.usuario_id === currentUser?.id}">
              <div class="message-bubble p-3 rounded-lg" 
                   [ngClass]="{'bg-blue-100': message.usuario_id !== currentUser?.id, 
                              'bg-green-100 self-bubble': message.usuario_id === currentUser?.id}">
                <p>{{ message.contenido }}</p>
                <small class="block text-xs text-gray-500">{{ message.created_at | date:'short' }}</small>
              </div>
            </div>
          }
        }
      </div>

      <!-- Input -->
      <div class="chat-input p-4 border-t">
        <form (ngSubmit)="enviarMensaje()" class="flex">
          <input 
            type="text" 
            [(ngModel)]="nuevoMensaje" 
            name="mensaje"
            placeholder="Escribe un mensaje..." 
            class="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            [disabled]="enviando">
          <button 
            type="submit" 
            class="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
            [disabled]="!nuevoMensaje.trim() || enviando">
            Enviar
          </button>
        </form>
      </div>
      
      <!-- Payment Dialog (Conditional Render) -->
      @if (mostrarPagoDialog) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <app-casa-payment-dialog
            [chatId]="chatId"
            [onComplete]="cerrarPagoDialog.bind(this)"
            [onCancel]="cerrarPagoDialog.bind(this)">
          </app-casa-payment-dialog>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 100px);
    }
    
    .chat-messages {
      flex-grow: 1;
    }
    
    .message {
      margin-bottom: 12px;
      max-width: 80%;
    }
    
    .self-message {
      margin-left: auto;
    }
    
    .loader {
      border: 3px solid #f3f3f3;
      border-radius: 50%;
      border-top: 3px solid #3498db;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ChatDetailComponent implements OnInit {
  chatId: number = 0;
  messages: any[] = [];
  nuevoMensaje: string = '';
  loading: boolean = true;
  enviando: boolean = false;
  currentUser: any = null;
  mostrarPagoDialog: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private securityService: SecurityService
  ) {}

  ngOnInit(): void {
    this.securityService.getActualUser().subscribe(user => {
      this.currentUser = user;
    });
    
    this.route.params.subscribe(params => {
      this.chatId = +params['id'];
      this.cargarMensajes();
    });
  }

  cargarMensajes(): void {
    this.loading = true;
    this.chatService.getChatMessages(this.chatId).subscribe({
      next: (data: any) => {
        this.messages = data;
        this.loading = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error al cargar mensajes:', error);
        this.loading = false;
      }
    });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || this.enviando) return;
    
    this.enviando = true;
    this.chatService.sendMessage({
      contenido: this.nuevoMensaje,
      chat_id: this.chatId,
      usuario_id: this.currentUser?.id
    }).subscribe({
      next: () => {
        this.nuevoMensaje = '';
        this.enviando = false;
        this.cargarMensajes();
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        this.enviando = false;
      }
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }

  cerrarPagoDialog(): void {
    this.mostrarPagoDialog = false;
  }
}
