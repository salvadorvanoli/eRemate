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
    console.log('🔍 Obteniendo lotes con pujas del usuario:', url);
    return this.http.get<Lote[]>(url).pipe(
      tap(response => {
        console.log('✅ Lotes con pujas obtenidos:', response);
      }),
      catchError(error => {
        console.error('❌ Error al obtener lotes con pujas:', error);
        return throwError(() => error);
      })
    );
  }
}