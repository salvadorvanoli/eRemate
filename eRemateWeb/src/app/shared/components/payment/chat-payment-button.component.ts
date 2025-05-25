import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PrimaryButtonComponent } from '../buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-chat-payment-button',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  template: `
    <div>
      <app-primary-button
        [label]="'Solicitar Pago'"
        (onClick)="irAPago()"
        [disabled]="disabled">
      </app-primary-button>
    </div>
  `,
  styles: []
})
export class ChatPaymentButtonComponent {
  @Input() chatId: number = 0;
  @Input() disabled: boolean = false;

  constructor(private router: Router) {}

  irAPago(): void {
    if (!this.chatId) {
      console.error('No hay ID de chat disponible');
      return;
    }
    
    this.router.navigate(['/pago'], { 
      queryParams: { 
        chat_id: this.chatId 
      }
    });
  }
}
