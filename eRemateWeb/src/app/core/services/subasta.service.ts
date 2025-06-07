import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap, catchError } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Subasta } from '../models/subasta';
import { CatalogElement } from '../models/catalog-element';
import { Lote } from '../models/lote';
import { PujaAutomatica } from '../models/puja-automatica';

@Injectable({
  providedIn: 'root'
})
export class SubastaService extends BaseHttpService<any, Subasta> {

  private apiUrl = '/auction';
  constructor(http: HttpClient) {
    super(http, '/auction');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUltimasSubastas(pagina: number, cantidad: number): Observable<Subasta[]> {
    return this.http.get<any>(`${this.baseUrl}/auction/page?pagina=${pagina}&cantidad=${cantidad}`);
  }
  
  getSubastaById(id: number): Observable<Subasta> {
    return this.http.get<any>(`${this.baseUrl}/auction/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return {
            ...response.data,
            fechaInicio: new Date(response.data.fechaInicio),
            fechaCierre: new Date(response.data.fechaCierre)
          };
        }
        throw new Error(response.message || 'Error al obtener la subasta');
      })
    );
  }  
  
  getLoteActual(subastaId: number): Observable<Lote> {
    return this.http.get<any>(`${this.baseUrl}/auction/${subastaId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      switchMap((response: any) => {
        if (response.success && response.data.loteActual_id) {
          return this.http.get<any>(`${this.baseUrl}/lot/${response.data.loteActual_id}`, {
            headers: this.getAuthHeaders()
          }).pipe(
            map((lotResponse: any) => {
              if (lotResponse.success) {
                return lotResponse.data;
              }
              throw new Error(lotResponse.message || 'Error al obtener el lote actual');
            })
          );
        }
        throw new Error('No hay un lote actual en esta subasta');
      })
    );
  }
  realizarPuja(subastaId: number, loteId: number, monto: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auction/${subastaId}/bid`, {
      lote_id: loteId,
      monto: monto
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al realizar la puja');
      })
    );
  }

  obtenerImagenAleatoria(subastaId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auction/${subastaId}/random-image`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'No hay imágenes disponibles para esta subasta');
      })
    );
  }

  getAllOrdered(): Observable<CatalogElement[]> {
    return this.http.get<CatalogElement[]>(`${this.baseUrl}/auction/ordered`);
  }

  getAllFiltered(textoBusqueda: string | null, cerrada: boolean, categoria: number | null, ubicacion: string | null, fechaCierreLimite: string | null): Observable<CatalogElement[]> {
    return this.http.get<CatalogElement[]>(`${this.baseUrl}/auction/filtered?textoBusqueda=${textoBusqueda}&cerrada=${cerrada}&categoria=${categoria}&ubicacion=${ubicacion}&fechaCierreLimite=${fechaCierreLimite}`);
  }
  getLocations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/auction/locations`);
  }

  // Métodos para el rematador
  iniciarSubasta(subastaId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auction/${subastaId}/start`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al iniciar la subasta');
      })
    );
  }

  cerrarSubasta(subastaId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auction/${subastaId}/end`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al cerrar la subasta');
      })
    );
  }

  actualizarUrlTransmision(subastaId: number, urlTransmision: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/auction/${subastaId}`, {
      urlTransmision: urlTransmision
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al actualizar URL de transmisión');
      })
    );
  }
  // Métodos para el usuario registrado
  crearPujaAutomatica(subastaId: number, pujaAutomatica: PujaAutomatica): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auction/${subastaId}/auto-bid`, pujaAutomatica, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Error al crear la puja automática');
      }),      catchError((error: any) => {
        // Si es un error HTTP (como 422), extraer el mensaje del backend
        if (error.error && error.error.message) {
          throw new Error(error.error.message);
        }
        // Si ya es un Error personalizado del map anterior, mantenerlo
        throw error;
      })
    );
  }

}