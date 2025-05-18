import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { PublicacionSimple, AgregarPublicacion } from '../models/publicacion';

@Injectable({
  providedIn: 'root'
})
export class PublicationService extends BaseHttpService<AgregarPublicacion, PublicacionSimple> {

  private apiUrl = '/publication';

  constructor(http: HttpClient) {
    super(http, '/publication');
  }

  getPublicationsPageByDate(pagina: number, cantidad: number): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + this.apiUrl + '/page/date' + `?pagina=${pagina}&cantidad=${cantidad}`);
  }
}
