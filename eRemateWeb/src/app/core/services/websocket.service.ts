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
  
  /**
   * Suscribirse a los eventos de nueva puja para una subasta específica
   */
  subscribeToPujas(subastaId: number): Observable<any> {
    try {
      if (window.Echo) {
        // El nombre del canal debe coincidir exactamente con el definido en el backend
        const channelName = `subasta.${subastaId}`;
        
        // El nombre del evento debe coincidir con el nombre completo de la clase de evento en Laravel
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
  
  /**
   * Dejar de escuchar eventos de una subasta específica
   */
  leaveChannel(subastaId: number): void {
    if (window.Echo) {
      window.Echo.leaveChannel(`subasta.${subastaId}`);
      console.log(`Desuscrito del canal de subasta.${subastaId}`);
    }
  }
}