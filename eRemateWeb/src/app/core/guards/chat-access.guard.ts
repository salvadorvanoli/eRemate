import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';
import { ChatService } from '../services/chat.service';

@Injectable({
  providedIn: 'root'
})
export class ChatAccessGuard implements CanActivate {
  
  constructor(
    private securityService: SecurityService,
    private chatService: ChatService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const chatId = route.params['id'];
    
    if (!chatId) {
      console.error('Chat Access Guard: No se proporcionó ID de chat');
      this.router.navigate(['/inicio']);
      return of(false);
    }

    return this.securityService.getActualUser().pipe(
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/inicio-sesion'], { 
            queryParams: { returnUrl: state.url }
          });
          return of(false);
        }

        // Verificar acceso al chat específico
        return this.chatService.getChatById(chatId).pipe(
          map(chat => {
            if (!chat) {
              console.error('Chat Access Guard: Chat no encontrado', chatId);
              this.router.navigate(['/inicio']);
              return false;
            }

            // Verificar que el usuario pertenece a este chat
            const hasAccess = (
              chat.usuarioRegistrado_id === user.id || 
              chat.casa_de_remate_id === user.id
            );

            if (!hasAccess) {
              this.router.navigate(['/inicio']);
              return false;
            }

            return true;
          }),
          catchError(error => {
            console.error('Chat Access Guard: Error al verificar acceso al chat', error);
            this.router.navigate(['/inicio']);
            return of(false);
          })
        );
      }),
      catchError(error => {
        console.error('Chat Access Guard: Error al obtener usuario', error);
        this.router.navigate(['/inicio-sesion']);
        return of(false);
      })
    );
  }
}
