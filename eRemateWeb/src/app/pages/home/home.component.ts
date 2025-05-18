import { Component, OnInit } from '@angular/core';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';
import { TitleWithBackgroundImageAndButtonsComponent } from '../../shared/components/title-with-background-image-and-buttons/title-with-background-image-and-buttons.component';
import { DynamicCarouselComponent } from '../../shared/components/dynamic-carousel/dynamic-carousel.component';
import { PublicationService } from '../../core/services/publication.service';
import { PublicacionSimple } from '../../core/models/publicacion';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TitleAndDescriptionComponent,
    TitleWithBackgroundImageAndButtonsComponent,
    DynamicCarouselComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})

export class HomeComponent implements OnInit {

  publicaciones: PublicacionSimple[] = [];
  pagina: number = 0;
  cantidad: number = 6;

  constructor(private publicationService: PublicationService) {}

  ngOnInit() {
    this.getPublications();
  }

  getPublications(): void {
    this.publicationService.getPublicationsPageByDate(this.pagina, this.cantidad)
    .pipe(
      map((response: any) => {
        const data = Array.isArray(response) ? response : response.content || [];
        return data.map((item: PublicacionSimple) => ({
          id: item.id,
          titulo: item.titulo,
          contenido: item.contenido,
          fechaCreacion: new Date(item.fechaCreacion)
        }));
      })
    )
    .subscribe(
      (data: PublicacionSimple[]) => {
        this.publicaciones = data;
      },
      (error) => {
        console.error('Error al obtener las publicaciones:', error);
      }
    );
  }

  getTitle(p: PublicacionSimple): string {
    return p.titulo;
  }

  getLink(p: PublicacionSimple): string {
    return '/publication/' + p.id;
  }

}
