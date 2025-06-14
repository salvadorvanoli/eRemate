import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Producto } from '../../core/models/producto';
import { CarouselComponent } from './components/carousel/carousel.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-view-product',
  standalone: true,
  imports: [
    CommonModule, 
    CarouselComponent,
    ModalComponent 
  ],
  templateUrl: './view-product.component.html',
  styleUrls: ['./view-product.component.scss']
})

export class ViewProductComponent implements OnInit {
  producto?: Producto;
  loading = true;
  error?: string;
  modalVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (!id || isNaN(id)) {
        console.error('ID inválido:', params['id']);
        this.router.navigate(['/']);
        return;
      }
      this.productService.getById(id).subscribe({
        next: (producto: Producto) => {
          this.producto = producto;
          this.loading = false;
        },
        error: error => {
          console.error('Error obteniendo el producto:', error);
          if (error.status === 404) {
            this.router.navigate(['/']); // Redirige a la ruta raíz (home)
          } else {
            this.error = `Error al cargar el producto: ${error.message}`;
            this.loading = false;
          }
        }
      });
    });  
  }
}