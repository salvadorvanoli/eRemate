import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DynamicCarouselComponent } from '../../../../shared/components/dynamic-carousel/dynamic-carousel.component';
import { LoteService } from '../../../../core/services/lote.service';
import { RegisteredUsersService } from '../../../../core/services/registered-users.service';
import { SecurityService } from '../../../../core/services/security.service';
import { Lote } from '../../../../core/models/lote';
import { Articulo } from '../../../../core/models/producto';

@Component({
  selector: 'app-lot-product-details',
  standalone: true,
  imports: [
    CommonModule,
    DynamicCarouselComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './lot-product-details.component.html',
  styleUrl: './lot-product-details.component.scss'
})
export class LotProductDetailsComponent implements OnInit, OnChanges {
  @Input() lote?: Lote;
  
  articulos: Articulo[] = [];
  articuloSeleccionado?: Articulo;
  loading = false;
  error = false;
  isFavorite = false;
  favoritesLoading = false;
  constructor(
    private loteService: LoteService,
    private registeredUsersService: RegisteredUsersService,
    private securityService: SecurityService,
    private messageService: MessageService
  ) {}  ngOnInit() {
    this.loadArticulos();
    this.checkFavoriteStatus();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['lote']) {
      this.articulos = [];
      this.articuloSeleccionado = undefined;
      this.error = false;
      this.isFavorite = false;
      
      if (changes['lote'].currentValue) {
        setTimeout(() => {
          this.loadArticulos();
          this.checkFavoriteStatus();
        }, 10);
      }
    }
  }loadArticulos() {
    if (!this.lote || !this.lote.id) {
      this.articulos = [];
      this.articuloSeleccionado = undefined;
      this.error = false;
      this.loading = false;
      return;
    }    this.loading = true;
    this.error = false;
    this.articulos = [];
    this.articuloSeleccionado = undefined;

    this.loteService.getArticulosByLote(this.lote.id).subscribe({      next: (articulos: Articulo[]) => {
        this.articulos = articulos;
        this.articuloSeleccionado = articulos.length > 0 ? articulos[0] : undefined;
        this.loading = false;
      },      error: (error) => {
        
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
  }  // Métodos para gestión de favoritos
  checkFavoriteStatus() {
    if (!this.lote || !this.lote.id) {
      this.isFavorite = false;
      return;
    }

    const currentUser = this.securityService.actualUser;
    if (!currentUser || !currentUser.id) {
      this.isFavorite = false;
      return;
    }

    this.favoritesLoading = true;
    
    this.registeredUsersService.checkIfFavoriteAuth(this.lote.id).subscribe({
      next: (isFavorite) => {
        this.isFavorite = isFavorite;
        this.favoritesLoading = false;
      },
      error: (error) => {
        this.isFavorite = false;
        this.favoritesLoading = false;
      }
    });
  }
  toggleFavorite() {
    if (this.favoritesLoading || !this.lote || !this.lote.id) {
      return;
    }

    const currentUser = this.securityService.actualUser;
    if (!currentUser || !currentUser.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción requerida',
        detail: 'Debes iniciar sesión para agregar favoritos',
        life: 4000
      });
      return;
    }

    this.favoritesLoading = true;

    if (this.isFavorite) {
      // Remover de favoritos
      this.registeredUsersService.removeFromFavoritesAuth(this.lote.id).subscribe({
        next: () => {
          this.isFavorite = false;
          this.favoritesLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Lote removido de favoritos',
            life: 3000
          });
        },        error: (error) => {
          this.favoritesLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al remover de favoritos',
            life: 4000
          });
        }
      });
    } else {
      // Agregar a favoritos
      this.registeredUsersService.addToFavoritesAuth(this.lote.id).subscribe({
        next: () => {
          this.isFavorite = true;
          this.favoritesLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Lote agregado a favoritos',
            life: 3000
          });
        },        error: (error) => {
          this.favoritesLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al agregar a favoritos',
            life: 4000
          });
        }
      });
    }
  }

  isUserLoggedIn(): boolean {
    const currentUser = this.securityService.actualUser;
    return !!currentUser && !!currentUser.id;
  }
}
