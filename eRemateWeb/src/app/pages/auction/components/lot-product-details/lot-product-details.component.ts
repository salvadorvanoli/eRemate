import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicCarouselComponent } from '../../../../shared/components/dynamic-carousel/dynamic-carousel.component';
import { LoteService } from '../../../../core/services/lote.service';
import { Lote } from '../../../../core/models/lote';
import { Articulo } from '../../../../core/models/producto';

@Component({
  selector: 'app-lot-product-details',
  standalone: true,
  imports: [
    CommonModule,
    DynamicCarouselComponent
  ],
  templateUrl: './lot-product-details.component.html',
  styleUrl: './lot-product-details.component.scss'
})
export class LotProductDetailsComponent implements OnInit, OnChanges {
  @Input() lote?: Lote;
  
  articulos: Articulo[] = [];
  articuloSeleccionado?: Articulo;
  loading = false;
  error = false;

  constructor(private loteService: LoteService) {}

  ngOnInit() {
    this.loadArticulos();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['lote']) {
      
      this.articulos = [];
      this.articuloSeleccionado = undefined;
      this.error = false;
      
      if (changes['lote'].currentValue) {
        setTimeout(() => {
          this.loadArticulos();
        }, 10);
      }
    }
  }  loadArticulos() {
    if (!this.lote || !this.lote.id) {
      this.articulos = [];
      this.articuloSeleccionado = undefined;
      this.error = false;
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = false;
    this.articulos = [];
    this.articuloSeleccionado = undefined;

    console.log('Cargando artículos para lote ID:', this.lote.id);

    this.loteService.getArticulosByLote(this.lote.id).subscribe({
      next: (articulos: Articulo[]) => {
        console.log('Artículos cargados:', articulos);
        this.articulos = articulos;
        this.articuloSeleccionado = articulos.length > 0 ? articulos[0] : undefined;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar artículos para lote', this.lote?.id, ':', error);
        
        if (error.status === 404 && error.error?.message === 'No hay artículos para este lote') {
          this.articulos = [];
          this.articuloSeleccionado = undefined;
          this.error = false;
        } else {
          this.error = true;
        }
        
        this.loading = false;
      }
    });
  }

  selectArticulo(articulo: Articulo) {
    this.articuloSeleccionado = articulo;
  }
  getImageUrl(image: string): string {
    if (!image || image.trim() === '') {
      return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    }
    return image;
  }

  getDefaultImage(): string {
    return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  parseImages(imagenes: any): string[] {
    if (!imagenes) return [];
    
    if (Array.isArray(imagenes)) {
      return imagenes.filter(img => img && typeof img === 'string');
    }
    
    if (typeof imagenes === 'string') {
      try {
        const parsed = JSON.parse(imagenes);
        if (Array.isArray(parsed)) {
          return parsed.filter(img => img && typeof img === 'string');
        }
      } catch (e) {
        return [imagenes];
      }
    }
    
    return [];
  }
  parseSpecifications(especificaciones: any): string {
    if (!especificaciones) return '';
    
    if (typeof especificaciones === 'string') {
      try {
        const parsed = JSON.parse(especificaciones);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        } else {
          return especificaciones;
        }
      } catch (e) {
        return especificaciones;
      }
    }
    
    if (Array.isArray(especificaciones)) {
      return especificaciones.filter(spec => spec && typeof spec === 'string').join(', ');
    }
    
    return String(especificaciones);
  }

  getArticleImages(): string[] {
    if (!this.articuloSeleccionado) return [];
    const images = this.parseImages(this.articuloSeleccionado.imagenes);
    return images.length > 0 ? images : [this.getDefaultImage()];
  }
  getArticleSpecifications(): string {
    if (!this.articuloSeleccionado) return '';
    return this.parseSpecifications(this.articuloSeleccionado.especificacionesTecnicas);
  }

  getImageTitle = (image: string): string => {
    return '';
  }

  getCarouselImageUrl = (image: string): string => {
    return this.getImageUrl(image);
  }
}
