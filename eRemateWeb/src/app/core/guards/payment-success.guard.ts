import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';
import { PaypalService } from '../services/paypal.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentSuccessGuard implements CanActivate {

  constructor(
    private securityService: SecurityService,
    private paypalService: PaypalService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    // Obtener los parámetros de la URL
    const paymentId = route.queryParams['paymentId'];
    const payerId = route.queryParams['PayerID'];

    if (!paymentId || !payerId) {
      console.warn('Payment Success Guard: Parámetros de pago faltantes');
      this.router.navigate(['/inicio']);
      return of(false);
    }

    return this.securityService.getActualUser().pipe(
      switchMap(user => {
        if (!user) {
          // Usuario no autenticado
          this.router.navigate(['/inicio-sesion'], { 
            queryParams: { returnUrl: state.url }
          });
          return of(false);
        }

        if (user.tipo !== 'registrado') {
          console.warn('Payment Success Guard: Solo usuarios registrados pueden ver páginas de pago', {
            userId: user.id,
            userType: user.tipo
          });
          this.router.navigate(['/inicio']);
          return of(false);
        }

        // Verificar si el usuario tiene acceso a este pago específico
        return this.paypalService.verificarPagoProcesado(paymentId).pipe(
          map(response => {
            if (response.success && response.processed) {
              // El pago existe y el usuario tiene acceso (verificado en el backend)
              return true;
            } else if (!response.processed) {
              // El pago aún no fue procesado, permitir acceso para que se procese
              return true;
            } else {
              // Error de autorización o pago no encontrado
              console.warn('Payment Success Guard: Sin autorización para este pago', {
                paymentId,
                userId: user.id,
                response
              });
              this.router.navigate(['/inicio']);
              return false;
            }
          }),
          catchError(error => {
            if (error.status === 403) {
              console.warn('Payment Success Guard: Usuario sin permisos para este pago', {
                paymentId,
                userId: user.id,
                error
              });
              this.router.navigate(['/inicio'], {
                queryParams: { error: 'payment_access_denied' }
              });
            } else {
              console.error('Payment Success Guard: Error al verificar pago', error);
              this.router.navigate(['/inicio']);
            }
            return of(false);
          })
        );
      }),
      catchError(error => {
        console.error('Payment Success Guard: Error al obtener usuario', error);
        this.router.navigate(['/inicio-sesion']);
        return of(false);
      })
    );
  }
}
