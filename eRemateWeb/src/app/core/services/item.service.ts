import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Articulo } from '../models/articulo';
import { CatalogElement } from '../models/catalog-element';
import { Categoria } from '../models/categoria2';

@Injectable({
  providedIn: 'root'
})
export class ItemService extends BaseHttpService<Articulo, Articulo> {

  constructor(http: HttpClient) {
    super(http, '/item');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllCategories(): Observable<any[]> {
    const url = `${this.baseUrl}${this.end}/categories/all`;
    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders()
    });
  }
  
  getAllOrdered(): Observable<CatalogElement[]> {
    return this.http.get<CatalogElement[]>(`${this.baseUrl}/item/ordered`);
  }

  getAllFiltered(textoBusqueda: string | null, cerrada: boolean, categoria: number | null, ubicacion: string | null, fechaCierreLimite: string | null): Observable<CatalogElement[]> {
    return this.http.get<CatalogElement[]>(`${this.baseUrl}/item/filtered?textoBusqueda=${textoBusqueda}&cerrada=${cerrada}&categoria=${categoria}&ubicacion=${ubicacion}&fechaCierreLimite=${fechaCierreLimite}`);
  }

  getCategories(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/item/categories`);
  }
}
