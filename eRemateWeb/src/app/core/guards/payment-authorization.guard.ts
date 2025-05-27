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
          console.log('Payment Auth Guard: Usuario no autenticado');
          this.router.navigate(['/inicio-sesion'], { 
            queryParams: { returnUrl: state.url }
          });
          return of(false);
        }

        // Solo usuarios registrados pueden realizar pagos
        if (user.tipo !== 'registrado') {
          console.warn('Payment Auth Guard: Solo usuarios registrados pueden realizar pagos', {
            userId: user.id,
            userType: user.tipo
          });
          this.router.navigate(['/inicio']);
          return of(false);
        }

        // Si hay chat_id en los query params, verificar permisos
        const chatId = route.queryParams['chat_id'];
        if (chatId) {
          return this.chatService.getChatById(chatId).pipe(
            map(chat => {
              if (!chat) {
                console.error('Payment Auth Guard: Chat no encontrado', chatId);
                this.router.navigate(['/inicio']);
                return false;
              }

              // Verificar que el usuario registrado pertenece a este chat
              if (chat.usuarioRegistrado_id !== user.id) {
                console.warn('Payment Auth Guard: Usuario no autorizado para pagar en este chat', {
                  chatId,
                  userId: user.id,
                  chatUsuarioRegistrado: chat.usuarioRegistrado_id
                });
                this.router.navigate(['/inicio']);
                return false;
              }

              console.log('Payment Auth Guard: Autorización de pago aprobada', {
                chatId,
                userId: user.id
              });
              return true;
            }),
            catchError(error => {
              console.error('Payment Auth Guard: Error al verificar chat', error);
              this.router.navigate(['/inicio']);
              return of(false);
            })
          );
        }

        // Si no hay chat_id, permitir acceso (para otros tipos de pago)
        console.log('Payment Auth Guard: Acceso autorizado sin chat específico');
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
