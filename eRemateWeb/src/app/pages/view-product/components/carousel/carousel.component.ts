import { Component, OnInit } from '@angular/core';
import { Producto } from '../../../../core/models/producto';  
import { ProductService } from '../../../../core/services/product.service'; 
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-carousel',
    templateUrl: './carousel.component.html',
    standalone: true,
    imports: [CarouselModule, ButtonModule, TagModule, CommonModule],
    providers: [ProductService]
})
export class CarouselComponent {
    //Productos de prueba
    products = [
        {
            name: 'Libro de Prueba 1',
            price: 50.00, 
            image: 'bamboo-watch.jpg',
        },
        {
            name: 'Libro de Prueba 2',
            price: 75.00,  
            image: 'bamboo-watch.jpg',
           
        }
    ];

    responsiveOptions: any[] = [
        {
            breakpoint: '1400px',
            numVisible: 1,
            numScroll: 1,
        },
        {
            breakpoint: '1199px',
            numVisible: 1,
            numScroll: 1,
        },
        {
            breakpoint: '767px',
            numVisible: 1,
            numScroll: 1,
        }
    ];

    constructor(private productService: ProductService) {}


}