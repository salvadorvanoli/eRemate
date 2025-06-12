import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
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

  getLoteById(loteId: number): Observable<Lote> {
    return this.http.get<any>(`${this.baseUrl}/lot/${loteId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener el lote');
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

  getUltimaPuja(loteId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/lot/${loteId}/ultima-puja`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener la última puja');
      })
    );
  }

  obtenerImagenAleatoria(loteId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/lot/${loteId}/random-image`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'No hay imágenes disponibles para este lote');
      })
    );
  }

}