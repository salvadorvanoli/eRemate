import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { Categoria, CategoriaCreate, CategoriaNodo } from '../models/categoria';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends BaseHttpService<CategoriaCreate, Categoria> {

  constructor(http: HttpClient) {
    super(http, '/category');
  }

  getAllCategoriesTree(): Observable<CategoriaNodo[]> {
    return this.http.get<CategoriaNodo[]>(`${this.baseUrl}${this.end}`);
  }

  
  getCategoriesForFilter(): Observable<{value: number, label: string}[]> {
    return this.http.get<any>(`${this.baseUrl}/item/categories`).pipe(
      map((response: any) => {
        console.log('Respuesta de categorías para filtro:', response);
        
        let categorias = [];
        if (response.success && response.data) {
          categorias = response.data;
        } else if (Array.isArray(response)) {
          categorias = response;
        } else {
          throw new Error('Formato de respuesta no válido');
        }

        return categorias.map((cat: any) => ({
          value: cat.id,
          label: cat.nombre
        }));
      }),      catchError((error: any) => {
        console.error('Error al obtener categorías para filtro:', error);
        return of([]);
      })
    );
  }
}
