import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService, GoogleUser } from '../../../core/services/google-auth.service';
import { SecurityService } from '../../../core/services/security.service';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-google-signin',
  standalone: true,
  imports: [CommonModule],
  providers: [MessageService],
  templateUrl: './google-signin.component.html',
  styleUrls: ['./google-signin.component.scss']
})
export class GoogleSigninComponent implements OnInit, OnDestroy {
  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef;
  @Input() buttonText: string = 'Continuar con Google';
  @Output() onAuth = new EventEmitter<any>();
  
  showFallback = false;
  isLoading = false;
  errorMessage = '';
  private credentialSubscription?: Subscription;

  constructor(
    private googleAuthService: GoogleAuthService,
    private securityService: SecurityService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Suscribirse a las credenciales de Google
    this.credentialSubscription = this.googleAuthService.getCredentialObservable()
      .subscribe(credential => {
        this.handleGoogleCredential(credential);
      });

    // Intentar renderizar el botón oficial de Google después de un breve delay
    setTimeout(() => {
      this.initializeGoogleButton();
    }, 100);
  }

  ngOnDestroy() {
    if (this.credentialSubscription) {
      this.credentialSubscription.unsubscribe();
    }
  }
  private initializeGoogleButton() {
    try {
      if (this.googleButton?.nativeElement) {
        this.googleAuthService.renderButton(this.googleButton.nativeElement, this.buttonText);
        this.showFallback = false;
      } else {
        this.showFallback = true;
      }
    } catch (error) {
      this.showFallback = true;
    }
  }

  private handleGoogleCredential(credential: string) {
    if (!credential) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const userData = this.googleAuthService.parseJwt(credential);
      
      // Emitir el evento con el token y datos del usuario
      this.onAuth.emit({
        token: credential,
        user: userData
      });
      
    } catch (error) {
      console.error('Error al procesar credencial de Google:', error);
      this.errorMessage = 'Error al procesar la autenticación de Google';
    } finally {
      this.isLoading = false;
    }
  }

  handleManualSignIn() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      this.googleAuthService.prompt();
    } catch (error) {
      console.error('Error al iniciar sesión manual con Google:', error);
      this.errorMessage = 'Error al conectar con Google';
      this.isLoading = false;
    }
  }
}
