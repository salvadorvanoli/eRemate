import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseHttpService<Producto, Producto> {

  constructor(http: HttpClient) {
    super(http, '/product');
  }
}
