import { Injectable } from '@angular/core';
import { AccesoUsuario, UsuarioSimple } from '../models/usuario';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  private apiUrl = 'http://localhost:8080/elibreriaalfa/security';
  private userSubject = new BehaviorSubject<UsuarioSimple | null>(null);
  user = this.userSubject.asObservable();

  constructor(private http: HttpClient) { }

  getActualUser(): Observable<UsuarioSimple | null> {
    return this.http.get<UsuarioSimple>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(user => this.userSubject.next(user)),
      catchError(() => {
        this.userSubject.next(null);
        return of(null);
      })
    );
  }

  get actualUser(): UsuarioSimple | null {
    return this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
  }

  auth(usuario: AccesoUsuario): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth`, usuario, { withCredentials: true }).pipe(
      tap(() => {
        this.getActualUser().subscribe();
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearUser())
    );
  }

}
