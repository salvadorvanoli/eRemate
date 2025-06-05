import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
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
}