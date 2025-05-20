import { Injectable } from '@angular/core';
import { AccesoUsuario, UsuarioSimple, UsuarioRegistrado, UsuarioRematador, UsuarioCasaDeRemates } from '../models/usuario';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  private apiUrl = 'http://localhost:8000/api';
  private userSubject = new BehaviorSubject<UsuarioRegistrado | UsuarioRematador | UsuarioCasaDeRemates | null>(null);
  user = this.userSubject.asObservable();

  constructor(private http: HttpClient) { }

  getActualUser(): Observable<UsuarioRegistrado | UsuarioRematador | UsuarioCasaDeRemates | null> {
    
    const token = localStorage.getItem('token');

    if (!token) {
      this.userSubject.next(null);
      return of(null);
    }
    
    return this.http.get<UsuarioRegistrado | UsuarioRematador | UsuarioCasaDeRemates>(`${this.apiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
      }
    }).pipe(
      tap(user => this.userSubject.next(user)),
      catchError(() => {
        this.userSubject.next(null);
        return of(null);
      })
    );
  }

  get actualUser(): UsuarioRegistrado | UsuarioRematador | UsuarioCasaDeRemates | null {
    return this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
  }

  auth(usuario: AccesoUsuario): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, usuario).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
        this.getActualUser().subscribe();
      })
    );
  }

  register(usuario: UsuarioRegistrado | UsuarioRematador | UsuarioCasaDeRemates): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, usuario);
  }

  logout(): Observable<void> {
    const token = localStorage.getItem('token');

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      tap(() => {
        localStorage.removeItem('token');
        this.clearUser();
      })
    );
  }

}
