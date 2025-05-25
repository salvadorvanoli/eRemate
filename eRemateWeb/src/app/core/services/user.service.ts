import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { UsuarioSimple, AccesoUsuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseHttpService<AccesoUsuario, UsuarioSimple> {

  constructor(http: HttpClient) {
    super(http, '/user');
  }

  override getAll(): Observable<UsuarioSimple[]> {
    return this.http.get<UsuarioSimple[]>(`${this.baseUrl}${this.end}`, { withCredentials: true });
  }

  override getById(id: number): Observable<UsuarioSimple> {
    return this.http.get<UsuarioSimple>(`${this.baseUrl}${this.end}/${id}`, { withCredentials: true });
  }

  override post(user: AccesoUsuario): Observable<UsuarioSimple> {
    return this.http.post<UsuarioSimple>(`${this.baseUrl}${this.end}`, user);
  }

  getUserProfile(id: number): Observable<any> {

    return this.http.get<any>(`${this.baseUrl}/usuarios/${id}/perfil`);
  }
  
}
