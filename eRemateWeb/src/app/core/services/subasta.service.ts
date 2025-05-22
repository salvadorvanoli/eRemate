import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { Subasta } from '../models/subasta';

@Injectable({
  providedIn: 'root'
})
export class SubastaService extends BaseHttpService<any, Subasta> {

  private apiUrl = '/auction';

  constructor(http: HttpClient) {
    super(http, '/auction');
  }

  getUltimasSubastas(pagina: number, cantidad: number): Observable<Subasta[]> {
    return this.http.get<any>(`${this.baseUrl}/auction/page?pagina=${pagina}&cantidad=${cantidad}`);
  }

getSubastaById(id: number): Observable<Subasta> {
    return this.http.get<any>(`${this.baseUrl}/auction/${id}`).pipe(
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
  
}