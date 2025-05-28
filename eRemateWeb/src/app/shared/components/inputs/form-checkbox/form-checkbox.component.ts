import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Checkbox } from 'primeng/checkbox';

@Component({
  selector: 'app-form-checkbox',
  standalone: true,
  imports: [
    Checkbox
  ],
  templateUrl: './form-checkbox.component.html',
  styleUrl: './form-checkbox.component.scss'
})
export class FormCheckboxComponent {

  @Input() label: string = '';
  @Input() classes: string = '';

  @Output() checked = new EventEmitter<boolean>();

}
