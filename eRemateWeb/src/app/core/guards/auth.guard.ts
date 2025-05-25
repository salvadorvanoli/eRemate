import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.securityService.getActualUser().pipe(
      map(user => {
        if (user) {
          console.log('Auth Guard: Usuario autenticado', user);
          return true;
        } else {
          console.log('Auth Guard: Usuario no autenticado, redirigiendo a login');
          this.router.navigate(['/inicio-sesion'], { 
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }),
      catchError(error => {
        console.error('Auth Guard: Error al verificar autenticación', error);
        this.router.navigate(['/inicio-sesion'], { 
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}
