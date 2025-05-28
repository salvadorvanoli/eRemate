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

    (window as any).handleCredentialResponse = this.handleCredentialResponse.bind(this);
    
    if (typeof google !== 'undefined') {
      this.initializeGoogleAuth();
      this.isGoogleLoaded = true;
    } else {
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
    } else {
      console.error('Google object not available');
    }
  }

  private handleCredentialResponse(response: any): void {
    this.credentialSubject.next(response.credential);
  }

  getCredentialObservable(): Observable<string> {
    return this.credentialSubject.asObservable();
  }  
  
  renderButton(element: HTMLElement, buttonText?: string): void {
    
    if (!this.isGoogleLoaded) {
      console.warn('Google not loaded yet, retrying in 500ms...');
      setTimeout(() => this.renderButton(element, buttonText), 500);
      return;
    }

    if (typeof google !== 'undefined' && google.accounts?.id) {
      try {
        
        let googleTextType = 'signin_with'; // Default
        if (buttonText) {
          if (buttonText.toLowerCase().includes('registr')) {
            googleTextType = 'signup_with';
          } else if (buttonText.toLowerCase().includes('continu')) {
            googleTextType = 'continue_with';
          }
        }
        
        google.accounts.id.renderButton(element, {
          theme: 'outline',
          size: 'large',
          text: googleTextType,
          width: '100%',
          shape: 'rectangular'
        });
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    } else {
      console.error('Google accounts not available');
    }
  }
  prompt(): void {
    
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
