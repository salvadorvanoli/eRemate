import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';
import { SubastaService } from '../services/subasta.service';

@Injectable({
  providedIn: 'root'
})
export class AuctioneerGuard implements CanActivate {
  
  constructor(
    private securityService: SecurityService,
    private router: Router,
    private subastaService: SubastaService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {

    const subastaId = Number(route.paramMap.get('id'));
  
    if (!subastaId) {
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

        if (user.tipo !== 'rematador') {
          // Usuario autenticado pero no es rematador
          this.router.navigate(['/inicio'], { 
            queryParams: { error: 'access_denied' }
          });
          return of(false);
        }

        // Verificar que el rematador esté asignado a esta subasta específica
        return this.subastaService.getSubastaById(subastaId).pipe(
          map(subasta => {
            if (!subasta) {
              console.error('Auctioneer Guard: Subasta no encontrada', subastaId);
              this.router.navigate(['/inicio'], { 
                queryParams: { error: 'auction_not_found' }
              });
              return false;
            }

            if (subasta.rematador_id !== user.id) {
              console.warn('Auctioneer Guard: Rematador no asignado a esta subasta', {
                userId: user.id,
                subastaId: subastaId,
                rematadorAsignado: subasta.rematador_id
              });
              this.router.navigate(['/inicio'], { 
                queryParams: { error: 'unauthorized_auction_access' }
              });
              return false;
            }

            return true;
          }),
          catchError(error => {
            console.error('Auctioneer Guard: Error al verificar asignación de subasta', error);
            this.router.navigate(['/inicio'], { 
              queryParams: { error: 'auction_verification_failed' }
            });
            return of(false);
          })
        );
      }),
      catchError(error => {
        console.error('Auctioneer Guard: Error al verificar acceso de rematador', error);
        this.router.navigate(['/inicio-sesion'], { 
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}
