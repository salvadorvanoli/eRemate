import { Component } from '@angular/core';
import { CatalogComponent } from '../catalog/catalog.component';
import { ItemService } from '../../core/services/item.service';

@Component({
  selector: 'app-items-catalog',
  standalone: true,
  imports: [
    CatalogComponent
  ],
  templateUrl: './items-catalog.component.html',
  styleUrl: './items-catalog.component.scss'
})
export class ItemsCatalogComponent {
  constructor(public itemService: ItemService) {}
}
