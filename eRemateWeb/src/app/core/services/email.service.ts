import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient } from '@angular/common/http';
import { EmailRequest, EmailResponse } from '../models/email';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService extends BaseHttpService<EmailRequest, EmailResponse> {

  private apiUrl = '/contacto';

  constructor(http: HttpClient) {
    super(http, '/contacto');
  }

  sendEmail(emailRequest: EmailRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl + this.apiUrl}`, emailRequest).pipe(
        tap(response => console.log('Respuesta del backend:', response))
    );
  }
}
