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
    return this.http.get<UsuarioRematador[]>(url);
  }
  
  assignAuctioneerToHouse(houseId: string, auctioneerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/${auctioneerId}/assign`;
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    });
  }

  assignAuctioneerByEmail(houseId: string, email: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/assign`;
    const body = { email: email };
    return this.http.post<any>(url, body, {
      headers: this.getAuthHeaders()
    });
  }

  removeAuctioneerFromHouse(houseId: string, auctioneerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/${auctioneerId}/remove`;
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getAuctionsByHouseId(houseId: string): Observable<any[]> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctions`;
    return this.http.get<any[]>(url);
  }

  getLotsByAuctionId(auctionId: string): Observable<any[]> {
    const url = `${this.baseUrl}/auction/${auctionId}/lots`;
    return this.http.get<any[]>(url);
  } 
  
  deleteLot(lotId: string): Observable<any> {
    const url = `${this.baseUrl}/lot/${lotId}`;
    return this.http.delete<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

  deleteAuction(auctionId: string): Observable<any> {
    const url = `${this.baseUrl}/auction/${auctionId}`;
    return this.http.delete<any>(url, {
      headers: this.getAuthHeaders()
    });
  }
  
  createAuction(auctionData: any): Observable<any> {
    const url = `${this.baseUrl}/auction`;
    return this.http.post<any>(url, auctionData, {
      headers: this.getAuthHeaders()
    });
  }
  
  createLot(lotData: any): Observable<any> {
    const url = `${this.baseUrl}/lot`;
    return this.http.post<any>(url, lotData, {
      headers: this.getAuthHeaders()
    });
  }

  createItem(articulo: Articulo): Observable<Articulo> {
    const url = `${this.baseUrl}/item`;
    
    return this.http.post<any>(url, articulo, {
        headers: this.getAuthHeaders()
    }).pipe(
        map(response => {
            if (response && response.data) {
                return response.data;
            }
            return response;
        }),
        catchError(error => {
            return throwError(() => error);
        })
    );
  }

  updateItem(id: string | number, articulo: Articulo): Observable<Articulo> {
    const url = `${this.baseUrl}/item/${id}`;
    return this.http.put<Articulo>(url, articulo, {
      headers: this.getAuthHeaders()
    });
  }

  removeItemFromLot(loteId: string | number, articuloId: string | number): Observable<any> {
    const url = `${this.baseUrl}/lot/${loteId}/items/${articuloId}/remove`;
    return this.http.post<any>(url, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getItemsByLotId(loteId: string | number): Observable<Articulo[]> {
    const url = `${this.baseUrl}/lot/${loteId}/items`;
    return this.http.get<Articulo[]>(url);
  }

  updateAuctionHouse(id: string | number, casaData: any): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${id}`;
    return this.http.put<any>(url, casaData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  updateAuction(auctionId: string | number, auctionData: any): Observable<any> {
    const url = `${this.baseUrl}/auction/${auctionId}`;
    return this.http.put<any>(url, auctionData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  updateLot(lotId: string | number, lotData: any): Observable<any> {
    const url = `${this.baseUrl}/lot/${lotId}`;
    return this.http.put<any>(url, lotData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getSalesStatistics(auctionHouseId: string | number): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${auctionHouseId}/sales-statistics`;
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getCategoryStatistics(auctionHouseId: string | number): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${auctionHouseId}/category-statistics`;
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getBidStatistics(auctionHouseId: string | number): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${auctionHouseId}/bid-statistics`;
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
