import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Casa } from '../models/casa';
import { UsuarioRematador } from '../models/usuario';
import { Articulo } from '../models/articulo';
import { Lote } from '../models/lote';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuctionHouseService extends BaseHttpService<Casa, Casa> {

  constructor(http: HttpClient) {
    super(http, '/auction-house');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllAuctioneersByHouse(id: string): Observable<UsuarioRematador[]> {
    const url = `${this.baseUrl}${this.end}/${id}/auctioneers`;
    console.log('URL de la petición:', url);
    return this.http.get<UsuarioRematador[]>(url);
  }
  assignAuctioneerToHouse(houseId: string, auctioneerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/${auctioneerId}/assign`;
    console.log('Asignando rematador:', url);
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    });
  }

  assignAuctioneerByEmail(houseId: string, email: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/assign`;
    console.log('Asignando rematador por email:', url);
    const body = { email: email };
    console.log('Datos enviados:', body);
    return this.http.post<any>(url, body, {
      headers: this.getAuthHeaders()
    });
  }

  removeAuctioneerFromHouse(houseId: string, auctioneerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/${auctioneerId}/remove`;
    console.log('Desasignando rematador:', url);
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getAuctionsByHouseId(houseId: string): Observable<any[]> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctions`;
    console.log('URL de la petición:', url);
    return this.http.get<any[]>(url);
  }

  getLotsByAuctionId(auctionId: string): Observable<any[]> {
    const url = `${this.baseUrl}/auction/${auctionId}/lots`;
    console.log('URL de la petición:', url);
    return this.http.get<any[]>(url);
  } 
  deleteLot(lotId: string): Observable<any> {
    const url = `${this.baseUrl}/lot/${lotId}`;
    console.log('Eliminando lote:', url);
    return this.http.delete<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

  deleteAuction(auctionId: string): Observable<any> {
    const url = `${this.baseUrl}/auction/${auctionId}`;
    console.log('Eliminando subasta:', url);
    return this.http.delete<any>(url, {
      headers: this.getAuthHeaders()
    });
  }
  createAuction(auctionData: any): Observable<any> {
    const url = `${this.baseUrl}/auction`;
    console.log('Creando subasta:', url, auctionData);
    return this.http.post<any>(url, auctionData, {
      headers: this.getAuthHeaders()
    });
  }
  
  createLot(lotData: any): Observable<any> {
    const url = `${this.baseUrl}/lot`;
    console.log('Creando lote:', url, lotData);
    return this.http.post<any>(url, lotData, {
      headers: this.getAuthHeaders()
    });
  }

  createItem(articulo: Articulo): Observable<Articulo> {
    
    console.log('🔄 Artículo para enviar:', JSON.stringify(articulo, null, 2));
    
    const url = `${this.baseUrl}/item`;
    console.log('🌐 URL de creación:', url);
    
    return this.http.post<any>(url, articulo, {
        headers: this.getAuthHeaders()
    }).pipe(
        tap(response => {
            console.log('✅ Respuesta del servidor:', JSON.stringify(response, null, 2));
        }),
        map(response => {
            if (response && response.data) {
                return response.data;
            }
            return response;
        }),
        catchError(error => {
            console.error('❌ Error en createItem:', error);
            return throwError(() => error);
        })
    );
  }

  updateItem(id: string | number, articulo: Articulo): Observable<Articulo> {
    const url = `${this.baseUrl}/item/${id}`;
    console.log('Actualizando artículo:', url, articulo);
    return this.http.put<Articulo>(url, articulo, {
      headers: this.getAuthHeaders()
    });
  }

 
  removeItemFromLot(loteId: string | number, articuloId: string | number): Observable<any> {
    const url = `${this.baseUrl}/lot/${loteId}/items/${articuloId}/remove`;
    console.log('Eliminando artículo del lote:', url);
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    });
  }
  

  getItemsByLotId(loteId: string | number): Observable<Articulo[]> {
    const url = `${this.baseUrl}/lot/${loteId}/items`;
    console.log('Obteniendo artículos del lote:', url);
    return this.http.get<Articulo[]>(url);
  }

  updateAuctionHouse(id: string | number, casaData: any): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${id}`;
    console.log('🔄 Actualizando casa de remates:', url, casaData);
    return this.http.put<any>(url, casaData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Respuesta de actualización:', response);
      }),
      catchError(error => {
        console.error('❌ Error al actualizar casa de remates:', error);
        return throwError(() => error);
      })
    );
  }

 
}
