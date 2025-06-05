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

  getSchedule(rematadorId: number): Observable<Subasta[]> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/schedule`;
    
    return this.http.get<Subasta[]>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getRequestedAuctions(rematadorId: number): Observable<Subasta[]> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/requested-auctions`;
    
    return this.http.get<Subasta[]>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  acceptAuction(rematadorId: number, subastaId: number): Observable<any> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/auctions/${subastaId}/accept`;
    
    return this.http.post<any>(url, {}).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  rejectAuction(rematadorId: number, subastaId: number, motivo?: string): Observable<any> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}/auctions/${subastaId}/reject`;
    
    const body = motivo ? { motivo } : {};
    
    return this.http.post<any>(url, body).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  updateAuctioneer(rematadorId: number, rematadorData: any): Observable<any> {
    const url = `${this.baseUrl}/auctioneer/${rematadorId}`;
    
    return this.http.put<any>(url, rematadorData).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
