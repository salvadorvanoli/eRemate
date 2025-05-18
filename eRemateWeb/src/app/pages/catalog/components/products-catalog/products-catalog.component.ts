import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataView } from 'primeng/dataview';
import { SelectButton } from 'primeng/selectbutton';
import { FormsModule } from "@angular/forms";
import { DropdownModule } from 'primeng/dropdown';
import { SelectItem } from 'primeng/api';
import { SearchBarComponent } from '../../../../shared/components/inputs/search-bar/search-bar.component';
import { ProductRowComponent } from "../product-row/product-row.component";
import { ProductCardComponent } from "../product-card/product-card.component";
import { Producto } from '../../../../core/models/producto';

@Component({
  selector: 'app-products-catalog',
  standalone: true,
  imports: [
    CommonModule,
    DataView,
    SelectButton,
    FormsModule,
    DropdownModule,
    SearchBarComponent,
    ProductRowComponent,
    ProductCardComponent
],
  templateUrl: './products-catalog.component.html',
  styleUrl: './products-catalog.component.scss'
})
export class ProductsCatalogComponent {

  // Attributes for layout
  layout: 'list' | 'grid' = 'grid';
  options = ['list', 'grid'];
  
  // Attributes for pagination
  rows: number = 6;
  first: number = 0;
  rowsPerPageOptions: number[] = [6, 12, 18];

  // Attributes for sorting
  sortOptions: SelectItem[] = [
    { label: 'Precio ascendente', value: '!precio' },
    { label: 'Precio descendente', value: 'precio' },
  ];
  sortOrder!: number;
  sortField!: string;

  @Input() products!: Producto[];

  @Output() searchTextChange = new EventEmitter<string>();

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
