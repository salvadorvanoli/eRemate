import { Component, OnDestroy, OnInit } from '@angular/core';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';
import { TitleWithBackgroundImageAndButtonsComponent } from '../../shared/components/title-with-background-image-and-buttons/title-with-background-image-and-buttons.component';
import { DynamicCarouselComponent } from '../../shared/components/dynamic-carousel/dynamic-carousel.component';
import { PublicationService } from '../../core/services/publication.service';
import { Subasta } from '../../core/models/subasta';
import { map } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { SubastaService } from '../../core/services/subasta.service';

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

export class HomeComponent implements OnInit, OnDestroy {

  subastas: Subasta[] = [];
  countdowns: { [id: number]: string } = {};
  imagenesAleatorias: { [id: number]: string } = {};
  private timerSub?: Subscription;
  pagina: number = 1;
  cantidad: number = 6;


  constructor(private subastaService: SubastaService) { }

  ngOnInit() {
    this.getSubastas();
    this.timerSub = interval(1000).subscribe(() => this.updateCountdowns());

  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

  getSubastas(): void {
    this.subastaService.getUltimasSubastas(this.pagina, this.cantidad)
      .pipe(
        map((response: any) => {
          const subastas = response.data?.data || [];
          return subastas
            .map((s: any) => ({
              ...s,
              fechaInicio: new Date(s.fechaInicio),
              fechaCierre: new Date(s.fechaCierre)
            }))
        })
      )      .subscribe(
        (data: Subasta[]) => {
          this.subastas = data;
          this.updateCountdowns();
          this.cargarImagenesAleatorias();
        },
        (error) => {
          console.error('Error al obtener las subastas:', error);
        }
      );
  }

  getTitle(subasta: Subasta): string {
    return `Subasta #${subasta.id}`;
  }

  getLink(subasta: Subasta): string {
    return '/subasta/' + subasta.id;
  }
  getCountdown = (subasta: Subasta): string => {
    return this.countdowns[subasta.id] || '';
  }

  getImage = (subasta: Subasta): string => {
    if (!subasta || !subasta.id) {
      return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    }

    return this.imagenesAleatorias[subasta.id] || 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
  }

  private cargarImagenesAleatorias(): void {
    this.subastas.forEach(subasta => {
      this.subastaService.obtenerImagenAleatoria(subasta.id).subscribe(
        (response) => {
          if (response && response.imagen) {
            this.imagenesAleatorias[subasta.id] = response.imagen;
          }
        },
        (error) => {
          console.log(`No se pudo cargar imagen para subasta ${subasta.id}:`, error);
          this.imagenesAleatorias[subasta.id] = '/remate.jpg';
        }
      );
    });
  }

  private updateCountdowns() {
    const now = new Date().getTime();
    this.subastas.forEach(subasta => {
      const cierre = new Date(subasta.fechaCierre).getTime();
      const diff = cierre - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.countdowns[subasta.id] = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        this.countdowns[subasta.id] = 'Finalizada';
      }
    });
  }
}
