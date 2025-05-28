import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataView } from 'primeng/dataview';
import { FormsModule } from "@angular/forms";
import { DropdownModule } from 'primeng/dropdown';
import { SearchBarComponent } from '../../../../shared/components/inputs/search-bar/search-bar.component';
import { ElementRowComponent } from "../element-row/element-row.component";
import { FormSelectInputComponent } from '../../../../shared/components/inputs/form-select-input/form-select-input.component';

@Component({
  selector: 'app-elements-catalog',
  standalone: true,
  imports: [
    CommonModule,
    DataView,
    FormsModule,
    FormSelectInputComponent,
    SearchBarComponent,
    ElementRowComponent
],
  templateUrl: './elements-catalog.component.html',
  styleUrl: './elements-catalog.component.scss'
})
export class ElementsCatalogComponent {
  
  rows: number = 10;
  first: number = 0;
  rowsPerPageOptions: number[] = [10, 20, 30];

  sortByTerminationOptions: { label: string, value: any }[] = [
    { label: 'Precio ascendente', value: '!precio' },
    { label: 'Precio descendente', value: 'precio' },
  ];
  sortOrder!: number;
  sortField!: string;

  @Input() elements!: any[];
  @Input() dataType: 'item' | 'auction' = 'item';

  @Output() searchTextChange = new EventEmitter<string>();

  ngOnInit() {

  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }
  
  onRowsChange(event: any) {
    this.rows = event.value;
  }

  onSortChange(event: any) {
    let value = event.value;

    if (value.indexOf('!') === 0) {
        this.sortOrder = -1;
        this.sortField = value.substring(1, value.length);
    } else {
        this.sortOrder = 1;
        this.sortField = value;
    }
}
}
