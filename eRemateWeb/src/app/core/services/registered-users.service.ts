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
    console.log('🔍 [BIDDED LOTS] URL completa:', url);
    console.log('🔍 [BIDDED LOTS] Base URL:', this.baseUrl);
    console.log('🔍 [BIDDED LOTS] User ID enviado:', userId);
    
    return this.http.get<Lote[]>(url).pipe(
      tap(response => {
        console.log('✅ [BIDDED LOTS] Respuesta cruda del servidor:', response);
        console.log('✅ [BIDDED LOTS] Tipo de respuesta:', typeof response);
        console.log('✅ [BIDDED LOTS] Es array:', Array.isArray(response));
        if (Array.isArray(response)) {
          console.log('✅ [BIDDED LOTS] Cantidad de lotes:', response.length);
          response.forEach((lote, index) => {
            console.log(`✅ [BIDDED LOTS] Lote ${index + 1}:`, lote);
          });
        }
      }),
      catchError(error => {
        console.error('❌ [BIDDED LOTS] Error completo:', error);
        console.error('❌ [BIDDED LOTS] Status:', error.status);
        console.error('❌ [BIDDED LOTS] Message:', error.message);
        console.error('❌ [BIDDED LOTS] Error body:', error.error);
        return throwError(() => error);
      })
    );
  }

  // ✅ CREAR RATING CON LOGS DETALLADOS - CAMPOS CORREGIDOS
  createRating(ratingData: any): Observable<any> {
    const url = `${this.baseUrl}/ratings`;
    console.log('🔍 [CREATE RATING] URL completa:', url);
    console.log('🔍 [CREATE RATING] Base URL:', this.baseUrl);
    console.log('🔍 [CREATE RATING] Datos enviados:', ratingData);
    console.log('🔍 [CREATE RATING] Tipo de lote_id:', typeof ratingData.lote_id);
    console.log('🔍 [CREATE RATING] Tipo de usuarioRegistrado_id:', typeof ratingData.usuarioRegistrado_id); // ✅ CAMBIAR
    console.log('🔍 [CREATE RATING] Tipo de puntaje:', typeof ratingData.puntaje); // ✅ CAMBIAR
    
    return this.http.post<any>(url, ratingData).pipe(
      tap(response => {
        console.log('✅ [CREATE RATING] Respuesta del servidor:', response);
        console.log('✅ [CREATE RATING] Tipo de respuesta:', typeof response);
        console.log('✅ [CREATE RATING] Headers de respuesta disponibles:', Object.keys(response || {}));
      }),
      catchError(error => {
        console.error('❌ [CREATE RATING] Error completo:', error);
        console.error('❌ [CREATE RATING] Status:', error.status);
        console.error('❌ [CREATE RATING] Status text:', error.statusText);
        console.error('❌ [CREATE RATING] Message:', error.message);
        console.error('❌ [CREATE RATING] Error body:', error.error);
        console.error('❌ [CREATE RATING] URL que falló:', error.url);
        return throwError(() => error);
      })
    );
  }

  // ✅ GET RATING CON LOGS SUPER DETALLADOS
  getRatingByLot(loteId: string | number): Observable<any> {
    const url = `${this.baseUrl}/ratings/by-lot/${loteId}`;
    console.log('🔍 [GET RATING] URL completa:', url);
    console.log('🔍 [GET RATING] Base URL:', this.baseUrl);
    console.log('🔍 [GET RATING] Lote ID enviado:', loteId);
    console.log('🔍 [GET RATING] Tipo de loteId:', typeof loteId);
    
    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log('✅ [GET RATING] Respuesta del servidor:', response);
        console.log('✅ [GET RATING] Tipo de respuesta:', typeof response);
        console.log('✅ [GET RATING] Es array:', Array.isArray(response));
        
        if (Array.isArray(response)) {
          console.log('✅ [GET RATING] Longitud del array:', response.length);
          if (response.length === 0) {
            console.log('ℹ️ [GET RATING] Array vacío - no hay calificación');
          } else {
            console.log('✅ [GET RATING] Primer elemento del array:', response[0]);
            const rating = response[0];
            
            // ✅ MOSTRAR TODOS LOS CAMPOS POSIBLES
            console.log('✅ [GET RATING] Todas las propiedades del objeto:', Object.keys(rating));
            Object.keys(rating).forEach(key => {
              console.log(`✅ [GET RATING] ${key}:`, rating[key], `(tipo: ${typeof rating[key]})`);
            });
          }
        } else if (response === null) {
          console.log('ℹ️ [GET RATING] Respuesta null - no hay calificación');
        } else if (response && typeof response === 'object') {
          console.log('✅ [GET RATING] Objeto directo:');
          console.log('✅ [GET RATING] Todas las propiedades del objeto:', Object.keys(response));
          Object.keys(response).forEach(key => {
            console.log(`✅ [GET RATING] ${key}:`, response[key], `(tipo: ${typeof response[key]})`);
          });
        }
      }),
      catchError(error => {
        console.error('❌ [GET RATING] Error completo:', error);
        console.error('❌ [GET RATING] Status:', error.status);
        console.error('❌ [GET RATING] Status text:', error.statusText);
        console.error('❌ [GET RATING] Message:', error.message);
        console.error('❌ [GET RATING] Error body:', error.error);
        console.error('❌ [GET RATING] URL que falló:', error.url);
        return throwError(() => error);
      })
    );
  }
}