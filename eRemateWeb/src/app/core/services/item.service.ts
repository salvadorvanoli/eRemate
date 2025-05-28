import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Articulo } from '../models/articulo';

@Injectable({
  providedIn: 'root'
})
export class ItemService extends BaseHttpService<Articulo, Articulo> {

  constructor(http: HttpClient) {
    super(http, '/item');
  }
}
