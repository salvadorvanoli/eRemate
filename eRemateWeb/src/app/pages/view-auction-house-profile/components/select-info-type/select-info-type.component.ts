import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

interface InfoTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select-info-type',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule],
  templateUrl: './select-info-type.component.html',
  styleUrl: './select-info-type.component.scss'
})
export class SelectInfoTypeComponent implements OnInit {
  @Input() defaultOption: string = 'profile';
  @Output() optionChanged = new EventEmitter<string>();
  
  selectedOption: InfoTypeOption | undefined;
  
  options: InfoTypeOption[] = [
    { label: 'Información del perfil', value: 'profile' },
    { label: 'Subastas y Lotes', value: 'auctions' },
    { label: 'Rematadores', value: 'auctioneers' },
    { label: 'Panel de Estadísticas', value: 'statistics' }
  ];
  
  ngOnInit() {
 
    this.selectedOption = this.options.find(opt => opt.value === this.defaultOption);
  }
  
  onOptionChange() {
    if (this.selectedOption) {
      this.optionChanged.emit(this.selectedOption.value);
    }
  }
}
