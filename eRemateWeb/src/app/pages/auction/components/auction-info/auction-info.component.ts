import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TitleAndDescriptionComponent } from '../../../../shared/components/title-and-description/title-and-description.component'; 
import { interval, Subscription } from 'rxjs';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as L from 'leaflet';
import { SecurityService } from '../../../../core/services/security.service';

@Component({
  selector: 'app-auction-info',
  imports: [
      CommonModule,
      RouterModule,
      TitleAndDescriptionComponent,
      PrimaryButtonComponent],
  templateUrl: './auction-info.component.html',
  styleUrl: './auction-info.component.scss'
})

export class AuctionInfoComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

@Input() item: any;
@Input() item2: any;
@Input() getImageUrl?: (item: any) => string;
@Input() youtubeUrl?: string;
@Output() onPuja = new EventEmitter<void>();
@Output() onVerTodosLosLotes = new EventEmitter<void>();

countdown: string = '';
private timerSub?: Subscription;
safeYoutubeUrl?: SafeResourceUrl;
showLocationDialog: boolean = false;
isAuctionHouse: boolean = false;

// Leaflet Map properties (exactamente igual a table-auction)
private map: L.Map | null = null;
private marker: L.Marker | null = null;
mapVisible: boolean = false;
private defaultLatLng: [number, number] = [-34.9011, -56.1645]; // Montevideo, Uruguay por defecto

constructor(
    private sanitizer: DomSanitizer,
    private securityService: SecurityService
) {}

ngOnChanges(changes: SimpleChanges): void {
    if (changes['youtubeUrl']) {
        this.updateYoutubeUrl();
    }
    if (changes['item']) {
        this.updateMapVisibility();
    }
}

ngAfterViewInit() {
    // No inicializar mapa automáticamente, solo cuando se abra el modal
}

pujar(): void {
    this.onPuja.emit();
}

verTodosLosLotes(): void {
    this.onVerTodosLosLotes.emit();
}

shouldShowViewAllLotsButton(): boolean {
    if (!this.item?.estado) return false;
    
    const estadosNoPermitidos = ['iniciada', 'cerrada', 'cancelada'];
    return !estadosNoPermitidos.includes(this.item.estado);
}

openLocationDialog(): void {
    if (this.item?.ubicacion) {
        this.mapVisible = true;
        // Dar tiempo para que el DOM del modal se renderice
        setTimeout(() => {
            this.initializeMap();
        }, 200);
    }
}

closeLocationDialog(): void {
    this.mapVisible = false;
    // Limpiar el mapa cuando se cierre el modal
    if (this.map) {
        this.map.remove();
        this.map = null;
        this.marker = null;
    }
}

hasLocation(): boolean {
    return !!(this.item?.ubicacion && this.item.ubicacion.trim());
}

getLoteName(lote: any): string {
    return lote?.nombre || `Lote #${lote?.id || 'Sin número'}`;
}

getLoteImageUrl(lote: any): string {        if (this.getImageUrl && lote) {
            const imageUrl = this.getImageUrl(lote);
            if (imageUrl && imageUrl !== 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png') {
                return imageUrl;
            }
        }
        
        if (lote?.imagenUrl && lote.imagenUrl.trim() !== '') {
            return lote.imagenUrl;
        }
        
        if (lote?.articulos && lote.articulos.length > 0) {
            const primerArticulo = lote.articulos[0];
            if (primerArticulo?.imagenes && primerArticulo.imagenes.length > 0) {
                if (typeof primerArticulo.imagenes === 'string') {
                    try {
                        const imagenesArray = JSON.parse(primerArticulo.imagenes);
                        if (Array.isArray(imagenesArray) && imagenesArray.length > 0) {
                            return imagenesArray[0];
                        }
                    } catch (e) {
                        return primerArticulo.imagenes;
                    }
                }
                else if (Array.isArray(primerArticulo.imagenes)) {
                    return primerArticulo.imagenes[0];
                }
            }        }
    
    return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
}

ngOnInit(): void {
    this.securityService.getActualUser().subscribe(user => {
        this.isAuctionHouse = user?.tipo === 'casa';
    });

    this.timerSub = interval(1000).subscribe(() => this.updateCountdown());
    this.updateYoutubeUrl();
}

ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    if (this.map) {
        this.map.remove();
    }
}

updateMapVisibility() {
    // No mostrar el mapa automáticamente, solo cuando se haga click en el botón
}

initializeMap() {
    console.log('Inicializando mapa Leaflet...');
    
    // Configurar iconos de Leaflet para corregir iconos faltantes
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Crear el mapa
    this.map = L.map('auction-map').setView(this.defaultLatLng, 13);

    // Agregar la capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    console.log('Mapa Leaflet inicializado correctamente');

    // Si ya hay una ubicación, buscarla
    if (this.item?.ubicacion && this.item.ubicacion.trim()) {
        setTimeout(() => {
            this.searchLocation(this.item.ubicacion);
        }, 100);
    }
}

private async searchLocation(address: string) {
    console.log('Buscando ubicación:', address);
    
    try {
        // Detectar si se especifica un país en la dirección
        const addressLower = address.toLowerCase();
        let searchUrl = '';
        
        // Lista de países de América del Sur para detectar
        const southAmericanCountries = [
            'uruguay', 'brasil', 'brazil', 'chile', 'bolivia', 'paraguay', 
            'colombia', 'venezuela', 'ecuador', 'peru', 'perú', 'guyana', 'suriname'
        ];
        
        const detectedCountry = southAmericanCountries.find(country => 
            addressLower.includes(country)
        );
        
        if (detectedCountry) {
            // Si se detecta un país específico, buscar sin restricción de país
            searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&addressdetails=1`;
            console.log(`País detectado: ${detectedCountry}, buscando sin restricción geográfica`);
        } else {
            // Si no se especifica país, priorizar Argentina
            searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=3&addressdetails=1`;
            console.log('No se detectó país específico, priorizando Argentina');
        }
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta de Nominatim');
        }
        
        const results: any[] = await response.json();
        console.log('Resultado de geocoding:', results);
        
        if (results && results.length > 0) {
            // Si se detectó un país, filtrar resultados por ese país
            let bestResult = results[0];
            
            if (detectedCountry && results.length > 1) {
                const countryFilteredResult = results.find((result: any) => {
                    const country = result.address?.country?.toLowerCase() || '';
                    return country.includes(detectedCountry) || 
                           (detectedCountry === 'uruguay' && country.includes('uruguay')) ||
                           (detectedCountry === 'brasil' && (country.includes('brasil') || country.includes('brazil'))) ||
                           (detectedCountry === 'brazil' && (country.includes('brasil') || country.includes('brazil')));
                });
                
                if (countryFilteredResult) {
                    bestResult = countryFilteredResult;
                    console.log('Resultado filtrado por país:', bestResult);
                }
            }
            
            const lat = parseFloat(bestResult.lat);
            const lng = parseFloat(bestResult.lon);
            
            console.log('Nueva ubicación encontrada:', { 
                lat, 
                lng, 
                display_name: bestResult.display_name,
                country: bestResult.address?.country 
            });
            
            // Actualizar la vista del mapa
            if (this.map) {
                this.map.setView([lat, lng], 15);
                this.updateMarker(lat, lng, bestResult.display_name);
            }        } else {
            console.log('No se encontraron resultados para la dirección');
            // Mantener el mapa en Montevideo por defecto
            if (this.map) {
                this.map.setView(this.defaultLatLng, 13);
                // Agregar un marcador temporal indicando que no se encontró la ubicación
                this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Ubicación no encontrada - Montevideo (por defecto)');
            }
        }    } catch (error) {
        console.error('Error en geocoding:', error);
        // En caso de error, mantener el mapa en la ubicación por defecto
        if (this.map) {
            this.map.setView(this.defaultLatLng, 13);
            this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Error al buscar ubicación - Montevideo (por defecto)');
        }
    }
}

private updateMarker(lat: number, lng: number, customTitle?: string) {
    if (!this.map) {
        console.log('Mapa no está disponible para agregar marcador');
        return;
    }

    // Limpiar marcador anterior
    if (this.marker) {
        this.map.removeLayer(this.marker);
    }

    // Crear nuevo marcador
    this.marker = L.marker([lat, lng]).addTo(this.map);
    
    // Agregar popup con la dirección
    const popupText = customTitle || this.item?.ubicacion || 'Ubicación seleccionada';
    this.marker.bindPopup(popupText).openPopup();
    
    console.log('Marcador agregado en:', { lat, lng });
}

onMapResize() {
    // Invalidar el tamaño del mapa cuando la ventana cambia de tamaño
    if (this.map) {
        setTimeout(() => {
            this.map?.invalidateSize();
        }, 100);
    }
}

private updateYoutubeUrl(): void {
    if (this.youtubeUrl) {
        let embedUrl = this.youtubeUrl;        
        if (this.youtubeUrl.includes('youtube.com/watch?v=')) {
            const videoId = this.youtubeUrl.split('v=')[1]?.split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        } else if (this.youtubeUrl.includes('youtu.be/')) {
            const videoId = this.youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        }
        
        this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else {
        this.safeYoutubeUrl = undefined;
    }
}

private updateCountdown(): void {
    if (this.item?.fechaCierre) {
      const now = new Date().getTime();
      const cierre = new Date(this.item.fechaCierre).getTime();
      const diff = cierre - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.countdown = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        this.countdown = 'Finalizada';
      }
    }
  }
}
