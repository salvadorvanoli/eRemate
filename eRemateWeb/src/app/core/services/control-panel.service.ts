import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { PublicationService } from './publication.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ControlPanelService {

  constructor(
    private userService: UserService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private publicationService: PublicationService
  ) {}

  getDataByType(type: string, page: number, size: number): Observable<any[]> | null {
    switch(type) {
      case 'Usuario':
        return this.userService.getPaginated(page, size);
      case 'Categoria':
        return this.categoryService.getPaginated(page, size);
      case 'Producto':
        return this.productService.getPaginated(page, size);
      case 'Publicacion':
        return this.publicationService.getPaginated(page, size);
      default:
        return null;
    }
  }
}
