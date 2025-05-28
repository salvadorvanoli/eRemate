import { Component } from '@angular/core';
import { CatalogComponent } from '../catalog/catalog.component';
import { SubastaService } from '../../core/services/subasta.service';

@Component({
  selector: 'app-auctions-catalog',
  standalone: true,
  imports: [
    CatalogComponent
  ],
  templateUrl: './auctions-catalog.component.html',
  styleUrl: './auctions-catalog.component.scss'
})
export class AuctionsCatalogComponent {
  constructor(public subastaService: SubastaService) {}
}
