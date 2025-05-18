import { Component, Input } from '@angular/core';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [
    Message
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() severity: string = 'info';
  @Input() icon?: string;
  @Input() message: string = "";
  @Input() classes: string = "";
}
