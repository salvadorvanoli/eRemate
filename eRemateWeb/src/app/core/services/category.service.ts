import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
}
