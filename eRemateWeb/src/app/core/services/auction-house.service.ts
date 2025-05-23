import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Casa } from '../models/casa';
import { UsuarioRematador } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class AuctionHouseService extends BaseHttpService<Casa, Casa> {

  constructor(http: HttpClient) {
    super(http, '/auction-house');
  }

  getAllAuctioneersByHouse(id: string): Observable<UsuarioRematador[]> {
    const url = `${this.baseUrl}${this.end}/${id}/auctioneers`;
    console.log('URL de la petición:', url);
    return this.http.get<UsuarioRematador[]>(url);
  }

  assignAuctioneerToHouse(houseId: string, auctioneerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/${auctioneerId}/assign`;
    console.log('Asignando rematador:', url);
    return this.http.post<any>(url, {});
  }

  assignAuctioneerByEmail(houseId: string, email: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/assign`;
    console.log('Asignando rematador por email:', url);
    const body = { email: email };
    console.log('Datos enviados:', body);
    return this.http.post<any>(url, body);
  }

  removeAuctioneerFromHouse(houseId: string, auctioneerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.end}/${houseId}/auctioneers/${auctioneerId}/remove`;
    console.log('Desasignando rematador:', url);
    return this.http.post<any>(url, {});
  }
}
