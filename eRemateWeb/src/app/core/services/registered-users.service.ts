import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Casa } from '../models/casa';
import { UsuarioRematador, UsuarioRegistrado } from '../models/usuario';
import { Articulo } from '../models/articulo';
import { Lote } from '../models/lote';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegisteredUsersService extends BaseHttpService<UsuarioRegistrado, UsuarioRegistrado> {

  constructor(http: HttpClient) {
    super(http, '/registered-users');
  }
 getBiddedLotsByUserId(userId: string | number): Observable<any> {
    const url = `${this.baseUrl}/registered-users/${userId}/bidded-lots`;
    
    return this.http.get<Lote[]>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

    createRating(ratingData: any): Observable<any> {
    const url = `${this.baseUrl}/ratings`;
    
    return this.http.post<any>(url, ratingData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getRatingByLot(loteId: string | number): Observable<any> {
    const url = `${this.baseUrl}/ratings/by-lot/${loteId}`;
    
    return this.http.get<any>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get authentication headers with Bearer token
   */
  private getAuthHeaders(): { [header: string]: string } {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

   // Métodos para gestión de favoritos
  getFavoriteLots(userId: string | number): Observable<Lote[]> {
    const url = `${this.baseUrl}/registered-users/${userId}/favorite-lots`;
    return this.http.get<Lote[]>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
  addToFavorites(userId: string | number, loteId: string | number): Observable<any> {
    const url = `${this.baseUrl}/registered-users/${userId}/favorite-lots`;
    const body = { lote_id: loteId };
    return this.http.post(url, body).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
  removeFromFavorites(userId: string | number, loteId: string | number): Observable<any> {
    const url = `${this.baseUrl}/registered-users/${userId}/favorite-lots/${loteId}`;
    return this.http.delete(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }  
  
  checkIfFavorite(userId: string | number, loteId: string | number): Observable<boolean> {
    return this.getFavoriteLots(userId).pipe(
      map(favorites => {
        const isFavorite = favorites.some(lote => lote.id == loteId);
        return isFavorite;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }


   getFavoriteLotsAuth(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/lotes-favoritos`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return of([]);
      })
    );
  }

    addToFavoritesAuth(loteId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/lotes-favoritos`, { lote_id: loteId }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }
  /**
   * Remove a lot from user's favorites (using the authenticated API)
   */
  removeFromFavoritesAuth(loteId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/lotes-favoritos/${loteId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }
  /**
   * Check if a specific lot is in user's favorites (using the authenticated API)
   */
  checkIfFavoriteAuth(loteId: number): Observable<boolean> {
    return this.getFavoriteLotsAuth().pipe(
      map(favorites => {
        const isFavorite = favorites.some(fav => fav.lote_id === loteId || fav.id === loteId);
        return isFavorite;
      }),
      catchError(error => {
        return of(false);
      })
    );
  }

aceptarLote(loteId: string | number): Observable<any> {
    const url = `${this.baseUrl.replace('/registered-users', '')}/lot/${loteId}/accept`;
    
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  rechazarLote(loteId: string | number): Observable<any> {
    const url = `${this.baseUrl.replace('/registered-users', '')}/lot/${loteId}/reject`;
    
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

updateUserProfile(userId: string | number, userData: any): Observable<any> {
  const url = this.baseUrl.includes('/registered-users') 
    ? `${this.baseUrl}/${userId}`
    : `${this.baseUrl}/registered-users/${userId}`;
  
  console.log('URL para actualizar usuario:', url);
  console.log('Datos enviados:', userData);
  
  return this.http.put<any>(url, userData, {
    headers: this.getAuthHeaders()
  }).pipe(
    tap(response => {
      console.log('Usuario actualizado:', response);
    }),
    catchError(error => {
      console.error('Error al actualizar usuario:', error);
      return throwError(() => error);
    })
  );
}

}