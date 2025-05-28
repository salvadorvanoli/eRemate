import { Component, Input } from '@angular/core';
import { ElementsCatalogComponent } from './components/elements-catalog/elements-catalog.component';
import { MessageComponent } from '../../shared/components/message/message.component';
import { ProductService } from '../../core/services/product.service';
import { Articulo } from '../../core/models/articulo';
import { Subasta } from '../../core/models/subasta';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    ElementsCatalogComponent,
    MessageComponent
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent<T extends { id: number }> {

  elements: T[] = [];
  @Input() dataType: 'item' | 'auction' = 'item';
  @Input() closedSelected: boolean = false;
  @Input() selectedCategory: number | null = null;
  @Input() selectedLocation: string | null = null;
  @Input() searchText: string = '';
  @Input() service: any;

  ngOnInit() {
    if (this.service && this.elements.length === 0) {
      this.service.getAll().subscribe((data: T[]) => {
        this.elements = data;
      });
    }
  }

  filterElements() {
    this.service.getFiltered(
      this.closedSelected,
      this.selectedCategory,
      this.selectedLocation,
      this.searchText
    ).subscribe((data: T[]) => {
      this.elements = data;
    });
  }

  onClosedCheck(closed: boolean) {
    this.closedSelected = closed;
    this.filterElements();
  }

  onCategorySelection(category: number) {
    this.selectedCategory = category;
    this.filterElements();
  }

  onLocationSelection(location: string) {
    this.selectedLocation = location;
    this.filterElements();
  }

  onSearchTextChange(searchText: string) {
    this.searchText = searchText;
    this.filterElements();
  }

}
