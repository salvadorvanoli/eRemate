import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService extends BaseHttpService<any, any> {

  constructor(http: HttpClient) {
    super(http, '/chats');
  }

  getUserChats(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/${userId}/chats`);
  }

  getChatMessages(chatId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chats/${chatId}/messages`);
  }

  sendMessage(message: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/messages`, message);
  }

  getChatById(chatId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/chats/${chatId}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        return response;
      })
    );
  }

  createChat(data: { usuarioRegistrado_id: number, casa_de_remate_id: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chats`, data);
  }
}
