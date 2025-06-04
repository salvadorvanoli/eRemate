import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import LaravelEcho from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Echo: any;
    Pusher: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private nuevaPujaSubject = new Subject<any>();
  private nuevoMensajeSubject = new Subject<any>();
  private nuevaSolicitudPagoSubject = new Subject<any>();
  private estadoSolicitudPagoSubject = new Subject<any>();
  
  constructor() {
    this.initializeEcho();
  }
  
  private initializeEcho(): void {
    try {
      window.Pusher = Pusher;
      
      window.Echo = new LaravelEcho({
        broadcaster: 'pusher',
        key: 'app-key',
        wsHost: window.location.hostname,
        wsPort: 6001,
        forceTLS: false,
        disableStats: true,
        cluster: 'mt1',
        enabledTransports: ['ws', 'wss']
      });
      
      console.log('Echo inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar Echo:', error);
    }
  }

  subscribeToPujas(subastaId: number): Observable<any> {
    try {
      if (window.Echo) {
        const channelName = `subasta.${subastaId}`;
        
        window.Echo.channel(channelName)
          .listen('.nueva.puja', (event: any) => {
            console.log('Nueva puja recibida:', event);
            this.nuevaPujaSubject.next(event);
          });
          
        console.log(`Suscrito al canal ${channelName}`);
      } else {
        console.error('Echo no está inicializado');
      }
    } catch (error) {
      console.error('Error al suscribirse al canal:', error);
    }
    
    return this.nuevaPujaSubject.asObservable();
  }

  leaveChannel(subastaId: number): void {
    if (window.Echo) {
      window.Echo.leaveChannel(`subasta.${subastaId}`);
      console.log(`Desuscrito del canal de subasta.${subastaId}`);
    }
  }

  subscribeToChat(chatId: number): Observable<any> {
    try {
      if (window.Echo) {
        const channelName = `chat.${chatId}`;
        
        window.Echo.channel(channelName)
          .listen('.nuevo.mensaje', (event: any) => {
            this.nuevoMensajeSubject.next(event);
          });
      } else {
        console.error('Echo no está inicializado');
      }
    } catch (error) {
      console.error('Error al suscribirse al canal de chat:', error);
    }
    
    return this.nuevoMensajeSubject.asObservable();
  }
  
  leaveChatChannel(chatId: number): void {
    if (window.Echo) {
      window.Echo.leaveChannel(`chat.${chatId}`);
      console.log(`Desuscrito del canal de chat.${chatId}`);
    }
  }

  subscribeToPaymentRequests(chatId: number): Observable<any> {
    try {
      if (window.Echo) {
        const channelName = `payment-request.${chatId}`;
        
        window.Echo.channel(channelName)
          .listen('.nueva-solicitud-pago', (event: any) => {
            console.log('Nueva solicitud de pago recibida:', event);
            this.nuevaSolicitudPagoSubject.next(event);
          })
          .listen('.estado-solicitud-pago', (event: any) => {
            console.log('Estado de solicitud de pago actualizado:', event);
            this.estadoSolicitudPagoSubject.next(event);
          });
          
      } else {
        console.error('Echo no está inicializado');
      }
    } catch (error) {
      console.error('Error al suscribirse al canal de solicitudes de pago:', error);
    }
    
    return this.nuevaSolicitudPagoSubject.asObservable();
  }

  subscribeToPaymentRequestUpdates(chatId: number): Observable<any> {
    try {
      if (window.Echo) {
        const channelName = `payment-request.${chatId}`;
        
        // Si no está ya suscrito, suscribirse al canal
        if (!window.Echo.connector.channels[channelName]) {
          window.Echo.channel(channelName)
            .listen('.nueva-solicitud-pago', (event: any) => {
              console.log('Nueva solicitud de pago recibida:', event);
              this.nuevaSolicitudPagoSubject.next(event);
            })
            .listen('.estado-solicitud-pago', (event: any) => {
              console.log('Estado de solicitud de pago actualizado:', event);
              this.estadoSolicitudPagoSubject.next(event);
            });
        }
      } else {
        console.error('Echo no está inicializado');
      }
    } catch (error) {
      console.error('Error al suscribirse a las actualizaciones de solicitudes de pago:', error);
    }
    
    return this.estadoSolicitudPagoSubject.asObservable();
  }

  leavePaymentRequestChannel(chatId: number): void {
    if (window.Echo) {
      window.Echo.leaveChannel(`payment-request.${chatId}`);
      console.log(`Desuscrito del canal de solicitudes de pago.${chatId}`);
    }
  }
}