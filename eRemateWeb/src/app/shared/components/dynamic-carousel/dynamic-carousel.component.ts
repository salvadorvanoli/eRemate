import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dynamic-carousel',
  templateUrl: './dynamic-carousel.component.html',
  imports: [ 
    CarouselModule,
    CommonModule,
    RouterModule
   ]
})
export class DynamicCarouselComponent implements OnInit {
  @Input() items: any[] = [];
  @Input() showPrice: boolean = false;
  @Input() showLink: boolean = false;

  @Input() getLink!: (item: any) => string;
  @Input() getTitle!: (item: any) => string;
  @Input() getImageUrl?: (item: any) => string;
  @Input() getPrice?: (item: any) => string | number;
  @Input() getCountdown?: (item: any) => string;
  @Input() usarModal: boolean = false;
  @Output() itemClick = new EventEmitter<any>();

  responsiveOptions: any;
  itemsPerPage: number = 3; // Modificar esta variable para cambiar el número de elementos por página
  scrollsPerScroll: number = 3; // Modificar esta variable para cambiar el número de scrolls por scroll

  onItemClick(item: any): void {
    this.itemClick.emit(item);
  }
  
  ngOnInit() {
    this.responsiveOptions = [
      { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
      { breakpoint: '768px', numVisible: 2, numScroll: 2 },
      { breakpoint: '560px', numVisible: 1, numScroll: 1 }
    ];
  }
}