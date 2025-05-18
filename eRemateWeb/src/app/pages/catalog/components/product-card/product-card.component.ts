import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { Producto } from '../../../../core/models/producto';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    RouterModule,
    CardModule
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {

  @Input() product!: Producto;

}
