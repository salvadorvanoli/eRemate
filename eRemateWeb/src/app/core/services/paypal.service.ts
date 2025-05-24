import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse, PaymentExecution, PaymentResult } from '../models/payment';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  crearPago(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/paypal/create-payment`, paymentData);
  }

  ejecutarPago(executionData: PaymentExecution): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/paypal/execute-payment`, executionData);
  }

  obtenerEstadoPago(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/paypal/payment-status/${paymentId}`);
  }

  procesarPagoPayPal(monto: number, metodoEntrega: string, usuarioId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const paymentRequest: PaymentRequest = {
        monto: monto,
        metodo_entrega: metodoEntrega,
        usuario_registrado_id: usuarioId
      };

      this.crearPago(paymentRequest).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Redirigir a PayPal
            window.location.href = response.data.approval_url;
            resolve();
          } else {
            reject(new Error(response.error || 'Error al crear el pago'));
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}
