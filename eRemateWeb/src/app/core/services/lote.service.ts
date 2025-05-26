import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Lote } from '../models/lote';
import { Articulo } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class LoteService extends BaseHttpService<any, Lote> {

  private apiUrl = '/lot';

  constructor(http: HttpClient) {
    super(http, '/lot');
  }

  getLotesBySubasta(id: number): Observable<Lote[]> {
    return this.http.get<any>(`${this.baseUrl}/lot/auction/${id}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener los lotes');
      })
    );
  }

  getArticulosByLote(loteId: number): Observable<Articulo[]> {
    return this.http.get<any>(`${this.baseUrl}/lot/${loteId}/items`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener los artículos');
      })
    );
  }

}