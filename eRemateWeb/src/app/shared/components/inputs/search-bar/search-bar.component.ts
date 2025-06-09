import { Component, EventEmitter, Output } from '@angular/core';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    InputIcon,
    IconField,
    InputTextModule,
    FormsModule
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent {

  searchText: string = '';

  @Output() textValue = new EventEmitter<string>();

  onInputChange(): void {
    this.textValue.emit(this.searchText);
  }

  reset() {
    this.searchText = '';
    this.textValue.emit('');
  }
}
