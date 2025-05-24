import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

declare const google: any;

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private clientId = '739005296713-bb4kp0nmphocbq8tig49l157p3s70hhn.apps.googleusercontent.com';
  private isGoogleLoaded = false;
  private credentialSubject = new Subject<string>();  constructor() {
    console.log('GoogleAuthService initialized');
    // Hacer la función global para que Google la encuentre
    (window as any).handleCredentialResponse = this.handleCredentialResponse.bind(this);
    
    // Verificar si Google ya está disponible o esperar a que se cargue
    if (typeof google !== 'undefined') {
      console.log('Google already available, initializing...');
      this.initializeGoogleAuth();
      this.isGoogleLoaded = true;
    } else {
      // Esperar a que el script se cargue
      this.waitForGoogleScript();
    }
  }
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isGoogleLoaded || typeof google !== 'undefined') {
        console.log('Google script already loaded');
        this.isGoogleLoaded = true;
        resolve();
        return;
      }

      console.log('Loading Google script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google script loaded successfully');
        this.initializeGoogleAuth();
        this.isGoogleLoaded = true;
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google script:', error);
      };
      document.head.appendChild(script);
    });
  }

  private waitForGoogleScript(): void {
    const checkForGoogle = () => {
      if (typeof google !== 'undefined') {
        console.log('Google script detected, initializing...');
        this.initializeGoogleAuth();
        this.isGoogleLoaded = true;
      } else {
        console.log('Waiting for Google script...');
        setTimeout(checkForGoogle, 100);
      }
    };
    checkForGoogle();
  }
  private initializeGoogleAuth(): void {
    if (typeof google !== 'undefined') {
      console.log('Initializing Google Auth with client ID:', this.clientId);
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      console.log('Google Auth initialized successfully');
    } else {
      console.error('Google object not available');
    }
  }
  private handleCredentialResponse(response: any): void {
    console.log('Token recibido:', response.credential);
    this.credentialSubject.next(response.credential);
  }

  getCredentialObservable(): Observable<string> {
    return this.credentialSubject.asObservable();
  }
  renderButton(element: HTMLElement): void {
    console.log('Attempting to render Google button...');
    
    if (!this.isGoogleLoaded) {
      console.warn('Google not loaded yet, retrying in 500ms...');
      setTimeout(() => this.renderButton(element), 500);
      return;
    }

    if (typeof google !== 'undefined' && google.accounts?.id) {
      try {
        console.log('Rendering Google button...');
        google.accounts.id.renderButton(element, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
          shape: 'rectangular'
        });
        console.log('Google button rendered successfully');
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    } else {
      console.error('Google accounts not available');
    }
  }
  prompt(): void {
    console.log('Attempting to show Google prompt...');
    
    if (!this.isGoogleLoaded) {
      console.warn('Google not loaded yet for prompt');
      return;
    }

    if (typeof google !== 'undefined' && google.accounts?.id) {
      try {
        google.accounts.id.prompt();
        console.log('Google prompt shown');
      } catch (error) {
        console.error('Error showing Google prompt:', error);
      }
    } else {
      console.error('Google accounts not available for prompt');
    }
  }

  getClientId(): string {
    return this.clientId;
  }

  parseJwt(token: string): GoogleUser | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }
}
