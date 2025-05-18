import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../core/models/producto';

@Component({
  selector: 'app-product-row',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './product-row.component.html',
  styleUrl: './product-row.component.scss'
})
export class ProductRowComponent {

  @Input() product!: Producto;
  @Input() first!: boolean;

}
