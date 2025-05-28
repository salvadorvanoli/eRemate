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
    if (changes['lote'] && changes['lote'].currentValue) {
      this.loadArticulos();
    }
  }
  loadArticulos() {
    if (!this.lote) return;

    this.loading = true;
    this.error = false;

    this.loteService.getArticulosByLote(this.lote.id!).subscribe({
      next: (articulos: Articulo[]) => {
        this.articulos = articulos;
        this.articuloSeleccionado = articulos.length > 0 ? articulos[0] : undefined;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar artículos:', error);
        
        // Si el error es específicamente que no hay artículos, no lo tratamos como error
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

  parseSpecifications(especificaciones: any): { label: string, value: string }[] {
    if (!especificaciones) return [];
    
    let specs: string[] = [];
    
    if (Array.isArray(especificaciones)) {
      specs = especificaciones.filter(spec => spec && typeof spec === 'string');
    }
    else if (typeof especificaciones === 'string') {
      try {
        const parsed = JSON.parse(especificaciones);
        if (Array.isArray(parsed)) {
          specs = parsed.filter(spec => spec && typeof spec === 'string');
        } else {
          specs = [especificaciones];
        }
      } catch (e) {
        specs = [especificaciones];
      }
    }
    
    return specs.map(spec => {
      const colonIndex = spec.indexOf(':');
      if (colonIndex > 0) {
        return {
          label: spec.substring(0, colonIndex).trim(),
          value: spec.substring(colonIndex + 1).trim()
        };
      }
      return {
        label: 'Especificación',
        value: spec.trim()
      };
    });
  }

  getArticleImages(): string[] {
    if (!this.articuloSeleccionado) return [];
    const images = this.parseImages(this.articuloSeleccionado.imagenes);
    return images.length > 0 ? images : [this.getDefaultImage()];
  }

  getArticleSpecifications(): { label: string, value: string }[] {
    if (!this.articuloSeleccionado) return [];
    return this.parseSpecifications(this.articuloSeleccionado.especificacionesTecnicas);
  }

  getImageTitle = (image: string): string => {
    return '';
  }

  getCarouselImageUrl = (image: string): string => {
    return this.getImageUrl(image);
  }
}
