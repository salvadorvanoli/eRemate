import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    FormsModule,
    DatePicker,
    FloatLabel
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss'
})
export class DatePickerComponent {

  dateTime: string | undefined;

  @Input() label: string = '';
  @Input() classes: string = '';

  @Output() dateTimeChange = new EventEmitter<string | null>();

  onDateChange(date: Date) {
    if (date) {
      const formattedDate = this.formatDate(date);
      this.dateTimeChange.emit(formattedDate);
    } else {
      this.dateTimeChange.emit(null);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

}
