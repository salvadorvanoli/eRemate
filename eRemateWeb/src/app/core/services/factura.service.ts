import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  descargarFacturaPdf(facturaId: number): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.baseUrl}/invoices/${facturaId}/pdf`, {
      headers: headers,
      responseType: 'blob'
    });
  }

  obtenerFactura(facturaId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/invoices/${facturaId}`, {
      headers: this.getAuthHeaders()
    });
  }

  obtenerFacturasPorUsuario(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}/invoices`, {
      headers: this.getAuthHeaders()
    });
  }
}
