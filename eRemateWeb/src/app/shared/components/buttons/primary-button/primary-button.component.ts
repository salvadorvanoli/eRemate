import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [
    ButtonModule
  ],
  templateUrl: './primary-button.component.html',
  styleUrl: './primary-button.component.scss'
})
export class PrimaryButtonComponent {
  @Input() label: string = '';
  @Input() classes: string = '';
  @Input() disabled: boolean = false;

  @Output() onClick = new EventEmitter<Event>();

  handleClick(event: Event) {
    if (!this.disabled) {
      this.onClick.emit(event);
    }
  }
}
