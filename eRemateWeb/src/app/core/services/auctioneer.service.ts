import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Casa } from '../models/casa';
import { UsuarioCasaDeRemates } from '../models/usuario';
import { UsuarioRematador } from '../models/usuario';
import { Articulo } from '../models/articulo';
import { Lote } from '../models/lote';
import { Subasta } from '../models/subasta';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuctioneerService extends BaseHttpService<UsuarioRematador, UsuarioRematador> {

  constructor(http: HttpClient) {
    super(http, '/auctioneer');
  }

  // 1. Obtener agenda de subastas del rematador
  getSchedule(rematadorId: number): Observable<Subasta[]> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/schedule`;
    console.log('🔍 Obteniendo agenda del rematador:', url);
    
    return this.http.get<Subasta[]>(url).pipe(
      tap(response => {
        console.log('✅ Agenda obtenida:', response);
      }),
      catchError(error => {
        console.error('❌ Error al obtener agenda:', error);
        return throwError(() => error);
      })
    );
  }

  // 2. Obtener subastas solicitadas (pendientes de aceptar)
  getRequestedAuctions(rematadorId: number): Observable<Subasta[]> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/requested-auctions`;
    console.log('🔍 Obteniendo subastas solicitadas:', url);
    
    return this.http.get<Subasta[]>(url).pipe(
      tap(response => {
        console.log('✅ Subastas solicitadas obtenidas:', response);
      }),
      catchError(error => {
        console.error('❌ Error al obtener subastas solicitadas:', error);
        return throwError(() => error);
      })
    );
  }

  // 3. Aceptar una subasta
  acceptAuction(rematadorId: number, subastaId: number): Observable<any> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/auctions/${subastaId}/accept`;
    console.log('🔍 Aceptando subasta:', url);
    
    return this.http.post<any>(url, {}).pipe(
      tap(response => {
        console.log('✅ Subasta aceptada:', response);
      }),
      catchError(error => {
        console.error('❌ Error al aceptar subasta:', error);
        return throwError(() => error);
      })
    );
  }

  // 4. Rechazar/cancelar una subasta
  rejectAuction(rematadorId: number, subastaId: number, motivo?: string): Observable<any> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/auctions/${subastaId}/reject`;
    console.log('🔍 Rechazando subasta:', url);
    
    const body = motivo ? { motivo } : {};
    
    return this.http.post<any>(url, body).pipe(
      tap(response => {
        console.log('✅ Subasta rechazada:', response);
      }),
      catchError(error => {
        console.error('❌ Error al rechazar subasta:', error);
        return throwError(() => error);
      })
    );
  }

  // 5. Actualizar datos del rematador
  updateAuctioneer(rematadorId: number, rematadorData: any): Observable<any> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}`;
    console.log('🔍 Actualizando datos del rematador:', url);
    console.log('📝 Datos enviados:', rematadorData);
    
    return this.http.put<any>(url, rematadorData).pipe(
      tap(response => {
        console.log('✅ Rematador actualizado:', response);
      }),
      catchError(error => {
        console.error('❌ Error al actualizar rematador:', error);
        return throwError(() => error);
      })
    );
  }
}
