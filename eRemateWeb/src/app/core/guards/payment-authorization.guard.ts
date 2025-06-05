import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';
import { ChatService } from '../services/chat.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentAuthorizationGuard implements CanActivate {
  
  constructor(
    private securityService: SecurityService,
    private chatService: ChatService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    return this.securityService.getActualUser().pipe(
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/inicio-sesion'], { 
            queryParams: { returnUrl: state.url }
          });
          return of(false);
        }

        if (user.tipo !== 'registrado') {
          console.warn('Payment Auth Guard: Solo usuarios registrados pueden realizar pagos', {
            userId: user.id,
            userType: user.tipo
          });
          this.router.navigate(['/inicio']);
          return of(false);
        }

        const chatId = route.queryParams['chat_id'];
        if (chatId) {
          return this.chatService.getChatById(chatId).pipe(
            map(chat => {
              if (!chat) {
                console.error('Payment Auth Guard: Chat no encontrado', chatId);
                this.router.navigate(['/inicio']);
                return false;
              }

              if (chat.usuarioRegistrado_id !== user.id) {
                console.warn('Payment Auth Guard: Usuario no autorizado para pagar en este chat', {
                  chatId,
                  userId: user.id,
                  chatUsuarioRegistrado: chat.usuarioRegistrado_id
                });
                this.router.navigate(['/inicio']);
                return false;
              }

              return true;
            }),
            catchError(error => {
              console.error('Payment Auth Guard: Error al verificar chat', error);
              this.router.navigate(['/inicio']);
              return of(false);
            })
          );
        }

        return of(true);
      }),
      catchError(error => {
        console.error('Payment Auth Guard: Error al obtener usuario', error);
        this.router.navigate(['/inicio-sesion']);
        return of(false);
      })
    );
  }
}
