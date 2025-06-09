import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';

@Component({
  selector: 'app-form-checkbox',
  standalone: true,
  imports: [
    FormsModule,
    Checkbox
  ],
  templateUrl: './form-checkbox.component.html',
  styleUrl: './form-checkbox.component.scss'
})
export class FormCheckboxComponent {

  isChecked: boolean = false;

  @Input() label: string = '';
  @Input() classes: string = '';

  @Output() checkedChange = new EventEmitter<boolean>();

  onCheckboxChange() {
    this.checkedChange.emit(this.isChecked);
  }

  reset() {
    this.isChecked = false;
    this.checkedChange.emit(false);
  }
}
