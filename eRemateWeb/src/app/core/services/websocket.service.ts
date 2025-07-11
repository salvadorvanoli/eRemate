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
  private actualizacionUrlTransmisionSubject = new Subject<any>();
  private nuevoMensajeSubject = new Subject<any>();
  private nuevaSolicitudPagoSubject = new Subject<any>();
  private estadoSolicitudPagoSubject = new Subject<any>();
  private inicioSubastaSubject = new Subject<any>();
  private cierreSubastaSubject = new Subject<any>();
  
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
            this.nuevaPujaSubject.next(event);
          })
          .listen('.actualizacion.url.transmision', (event: any) => {
            this.actualizacionUrlTransmisionSubject.next(event);
          })
          .listen('.subasta.iniciada', (event: any) => {
            this.inicioSubastaSubject.next(event);
          })
          .listen('.subasta.cerrada', (event: any) => {
            this.cierreSubastaSubject.next(event);
          });
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
    }
  }

  subscribeToPaymentRequests(chatId: number): Observable<any> {
    try {
      if (window.Echo) {
        const channelName = `payment-request.${chatId}`;
        
        window.Echo.channel(channelName)
          .listen('.nueva-solicitud-pago', (event: any) => {
            this.nuevaSolicitudPagoSubject.next(event);
          })
          .listen('.estado-solicitud-pago', (event: any) => {
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
              this.nuevaSolicitudPagoSubject.next(event);
            })
            .listen('.estado-solicitud-pago', (event: any) => {
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
    }
  }

  // Métodos específicos para eventos de subasta
  subscribeToAuctionStart(subastaId: number): Observable<any> {
    return this.inicioSubastaSubject.asObservable();
  }

  subscribeToAuctionClose(subastaId: number): Observable<any> {
    return this.cierreSubastaSubject.asObservable();
  }

  subscribeToTransmissionUrlUpdate(subastaId: number): Observable<any> {
    return this.actualizacionUrlTransmisionSubject.asObservable();
  }
}