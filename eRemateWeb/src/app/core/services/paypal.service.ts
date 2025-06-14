import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse, PaymentExecution, PaymentResult } from '../models/payment';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  
  private baseUrl = 'http://127.0.0.1:8000/api';
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  crearPago(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/paypal/create-payment`, paymentData, {
      headers: this.getAuthHeaders()
    });
  }

  crearPagoDesdeChatId(monto: number, metodoEntrega: string, chatId: number): Observable<PaymentResponse> {
    const paymentData: PaymentRequest = {
      monto: monto,
      metodo_entrega: metodoEntrega,
      chat_id: chatId
    };
    return this.http.post<PaymentResponse>(`${this.baseUrl}/paypal/create-payment-from-chat`, paymentData, {
      headers: this.getAuthHeaders()
    });
  }  
  
  ejecutarPago(executionData: PaymentExecution): Observable<PaymentResult> {
    // Si hay un ID de solicitud almacenado, incluirlo en la petición
    if (!executionData.payment_request_id) {
      const storedRequestId = sessionStorage.getItem('payment_request_id');
      if (storedRequestId) {
        executionData.payment_request_id = parseInt(storedRequestId, 10);
        // Limpiar después de usarlo
        sessionStorage.removeItem('payment_request_id');
      }
    }
    
    return this.http.post<PaymentResult>(`${this.baseUrl}/paypal/execute-payment`, executionData, {
      headers: this.getAuthHeaders()
    });
  }

  obtenerEstadoPago(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/paypal/payment-status/${paymentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  procesarPagoPayPal(monto: number, metodoEntrega: string, usuarioId: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Asegurarnos de que el ID sea un número
      let id: number;
      if (typeof usuarioId === 'number') {
        id = usuarioId;
      } else {
        // Si no es un número, intentar convertirlo
        try {
          id = Number(usuarioId);
          if (isNaN(id)) {
            throw new Error('ID de usuario no válido');
          }
        } catch (e) {
          reject(new Error('ID de usuario no válido'));
          return;
        }
      }

      const paymentRequest: PaymentRequest = {
        monto: monto,
        metodo_entrega: metodoEntrega,
        usuario_registrado_id: id
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

  procesarPagoDesdeChatId(monto: number, metodoEntrega: string, chatId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.crearPagoDesdeChatId(monto, metodoEntrega, chatId).subscribe({
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
  // Agregar estos métodos para gestionar solicitudes de pago
  crearSolicitudPago(monto: number, metodoEntrega: string, chatId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payment-requests`, {
      monto: monto,
      metodo_entrega: metodoEntrega,
      chat_id: chatId
    }, {
      headers: this.getAuthHeaders()
    });
  }

  obtenerSolicitudesPago(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/payment-requests/user/${usuarioId}`, {
      headers: this.getAuthHeaders()
    });
  }  procesarPagoDesdeSolicitud(solicitudId: number, chatId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Primero obtenemos los detalles de la solicitud
      this.http.get<any>(`${this.baseUrl}/payment-requests/${solicitudId}`, {
        headers: this.getAuthHeaders()
      }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const solicitud = response.data;
                        
            if (!solicitud.monto || !solicitud.metodo_entrega) {
              reject(new Error('La solicitud de pago no contiene los datos necesarios'));
              return;
            }
            
            // Luego procesamos el pago con esos datos
            this.crearPagoDesdeChatId(
              solicitud.monto,
              solicitud.metodo_entrega,
              chatId
            ).subscribe({
              next: (paymentResponse) => {
                  if (paymentResponse.success && paymentResponse.data) {
                  // Almacenamos el ID de la solicitud en sessionStorage para recuperarlo después del pago
                  sessionStorage.setItem('payment_request_id', solicitudId.toString());
                  
                  // Verificar que se guardó correctamente
                  const stored = sessionStorage.getItem('payment_request_id');
                  
                  // Asegurarnos que tenemos la URL de aprobación
                  if (paymentResponse.data.approval_url) {
                    // Redirigir a PayPal
                    window.location.href = paymentResponse.data.approval_url;
                    resolve();
                  } else {
                    reject(new Error('No se recibió URL de aprobación de PayPal'));
                  }
                } else {
                  reject(new Error(paymentResponse.error || 'Error al crear el pago'));
                }
              },
              error: (err) => {
                console.error('Error al crear pago en PayPal:', err);
                reject(err);
              }
            });
          } else {
            reject(new Error('No se pudieron obtener los detalles de la solicitud'));
          }
        },
        error: (err) => {
          console.error('Error al obtener detalles de la solicitud:', err);
          reject(err);
        }
      });
    });
  }
  verificarCredenciales(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/paypal/verify-credentials`, {
      headers: this.getAuthHeaders()
    });
  }

  verificarPagoProcesado(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/paypal/verify-payment-processed/${paymentId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
