import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient } from '@angular/common/http';
import { EmailRequest, EmailResponse } from '../models/email';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService extends BaseHttpService<EmailRequest, EmailResponse> {

  private apiUrl = '/email';

  constructor(http: HttpClient) {
    super(http, '/email');
  }

  sendEmail(emailRequest: EmailRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl + this.apiUrl}/send`, emailRequest, { responseType: 'text' as 'json' }).pipe(
        tap(response => console.log('Respuesta del backend:', response))
    );
}
}
