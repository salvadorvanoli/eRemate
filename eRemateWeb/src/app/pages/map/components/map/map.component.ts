import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import * as MarkerClusterGroup from 'leaflet.markercluster';
import { SubastaService } from '../../../../core/services/subasta.service';
import { UseInfoComponent } from '../use-info/use-info.component';

declare module 'leaflet' {
  export interface MarkerClusterGroupOptions {
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number | ((zoom: number) => number);
    [key: string]: any;
  }
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface AuctionLocation {
  id: number;
  ubicacion: string;
  titulo: string;
  lat?: number;
  lng?: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule,
    UseInfoComponent
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']

})

export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  auctions: AuctionLocation[] = []; 
  private markerClusterGroup: L.MarkerClusterGroup | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private tileErrorCount = 0;
  private maxTileErrors = 3;
  
  loading = true;
  markersLoaded = 0;
  
  idMapa = 'main-map';
  
  private zone = inject(NgZone);
  
  constructor(
    private router: Router,
    private subastaService: SubastaService
  ) {}
  ngOnInit() {
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.initializeMapWithRetry();
      
      setTimeout(() => {
        this.zone.run(() => {
          this.loadAuctions();
        });
      }, 500);
    });
  }
  private initializeMapWithRetry(attempts = 0) {
    const maxAttempts = 10; 
    const mapElement = document.getElementById(this.idMapa);
    
    if (mapElement && mapElement.offsetParent !== null && mapElement.offsetWidth > 0) {
      console.log('Inicializando mapa, intento:', attempts + 1);
      this.initializeMap();
    } else if (attempts < maxAttempts) {
      console.log('Elemento no listo, reintentando...', attempts + 1);
      setTimeout(() => this.initializeMapWithRetry(attempts + 1), 100 + (attempts * 50));
    } else {
      console.error('No se pudo inicializar el mapa después de varios intentos');
      setTimeout(() => {
        if (!this.map) {
          console.log('Último intento de inicialización...');
          this.initializeMap();
        }
      }, 2000);
    }
  }  private initializeMap() {
    const mapElement = document.getElementById(this.idMapa);
    if (!mapElement) {
      console.error('Elemento del mapa no encontrado:', this.idMapa);
      return;
    }
    
    if (this.map) {
      console.log('El mapa ya está inicializado');
      return;
    }

    console.log('Creando mapa en elemento:', mapElement, 'Dimensiones:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    try {
      this.map = L.map(mapElement, {
        zoomControl: false,
        attributionControl: false
      }).setView([-34.6118, -58.3960], 5);

      console.log('Mapa creado exitosamente');

      this.setupTileLayer();
      
      L.control.zoom({ position: 'topright' }).addTo(this.map);
      L.control.attribution({ 
        position: 'bottomright',
        prefix: false
      }).addAttribution('© OpenStreetMap contributors').addTo(this.map);

      this.markerClusterGroup = new (MarkerClusterGroup as any).MarkerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80
      });

      if (this.markerClusterGroup) {
        this.map.addLayer(this.markerClusterGroup);
      }

      this.setupResizeObserver();

      console.log('Mapa inicializado completamente');

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log('Tamaño del mapa invalidado');
        }
      }, 250);

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }  private setupTileLayer() {
    if (!this.map) return;

    console.log('Configurando capa de tiles...');
    
    this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 18,
      minZoom: 2,
      crossOrigin: true
    });
    
    console.log('Agregando tiles al mapa...');
    this.tileLayer.addTo(this.map);

    this.tileLayer.on('tileerror', (error) => {
      console.error('Error cargando tile:', error);
    });

    this.tileLayer.on('tileload', () => {
      console.log('Tile cargado exitosamente');
    });

    this.tileLayer.on('load', () => {
      console.log('Todos los tiles cargados');
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    });

    setTimeout(() => {
      if (this.map && this.tileLayer) {
        console.log('Forzando redraw inicial...');
        this.tileLayer.redraw();
        this.map.invalidateSize();
      }
    }, 500);
  }

  private setupMapEvents() {
    if (!this.map) return;

    this.map.on('load', () => {
      console.log('Mapa cargado - verificando tiles');
      this.fixTiles();
    });

    this.map.on('moveend', () => {
      this.fixTiles();
    });

    this.map.on('zoomend', () => {
      this.fixTiles();
    });
  }

  private setupResizeObserver() {
    const mapElement = document.getElementById(this.idMapa);
    if (!mapElement || !this.map) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === mapElement) {
          this.zone.runOutsideAngular(() => {
            setTimeout(() => {
              this.map?.invalidateSize({ pan: false, debounceMoveend: true });
              this.fixTiles();
            }, 100);
          });
        }
      }
    });

    this.resizeObserver.observe(mapElement);
  }
  private fixTiles() {
    if (!this.map || !this.tileLayer) return;

    console.log('Corrigiendo tiles del mapa...');
    setTimeout(() => {
      this.map?.invalidateSize();
      this.tileLayer?.redraw();
    }, 100);
  }private loadAuctions() {
    this.loading = true;
    console.log('Iniciando carga de subastas optimizada para mapa...');
    
    this.subastaService.getSubastasParaMapa().subscribe({      next: (auctions: {id: number, ubicacion: string, titulo: string}[]) => {
        console.log('Respuesta del servicio optimizado:', auctions);
        
        this.auctions = auctions.filter(auction => {
          const hasLocation = auction.ubicacion && 
                             auction.ubicacion.trim().length > 0 &&
                             auction.ubicacion.toLowerCase() !== 'undefined' &&
                             auction.ubicacion.toLowerCase() !== 'null';
          console.log(`Validando subasta ${auction.id}: incluir = ${hasLocation} (ubicacion: "${auction.ubicacion}")`);
          return hasLocation;
        });

        console.log('Subastas válidas para el mapa:', this.auctions.length);
        console.log('Detalle de subastas:', this.auctions);
          
        if (this.auctions.length === 0) {
          console.warn('No se encontraron subastas con ubicación. Agregando datos de ejemplo...');
          this.auctions = [
            {
              id: 1,
              ubicacion: 'Montevideo, Uruguay',
              titulo: 'Subasta de Ejemplo 1'
            },
            {
              id: 2,
              ubicacion: 'Buenos Aires, Argentina',
              titulo: 'Subasta de Ejemplo 2'
            }
          ];
        }
        
        this.getCoordinatesForAuctions();
      },
      error: (error: any) => {
        console.error('Error al cargar subastas:', error);
        
        if (error.status === 401) {
          console.warn('Error 401: No autorizado. Continuando con datos de ejemplo.');
        }
        
        this.auctions = [
          {
            id: 1,
            ubicacion: 'Montevideo, Uruguay',
            titulo: 'Subasta de Ejemplo 1'
          },
          {
            id: 2,
            ubicacion: 'Buenos Aires, Argentina',
            titulo: 'Subasta de Ejemplo 2'
          }
        ];
        this.getCoordinatesForAuctions();
      }
    });
  }
  private async getCoordinatesForAuctions() {
    if (this.auctions.length === 0) {
      console.log('No hay subastas para procesar');
      this.loading = false;
      return;
    }

    console.log('Obteniendo coordenadas para', this.auctions.length, 'subastas...');
    
    const promises = this.auctions.map(async (auction) => {
      try {
        const coordinates = await this.searchLocation(auction.ubicacion);
        if (coordinates) {
          auction.lat = coordinates.lat;
          auction.lng = coordinates.lng;
          console.log(`Coordenadas encontradas para ${auction.ubicacion}:`, coordinates);
        } else {
          console.warn(`No se encontraron coordenadas para: ${auction.ubicacion}`);
        }
      } catch (error) {
        console.error(`Error al obtener coordenadas para ${auction.ubicacion}:`, error);
      }
    });

    await Promise.all(promises);

    const validAuctions = this.auctions.filter(a => a.lat && a.lng);
    console.log(`${validAuctions.length} de ${this.auctions.length} subastas tienen coordenadas válidas`);

    if (this.map) {
      this.addMarkersToMap();
      setTimeout(() => {
        this.fixTiles();
        this.loading = false;
      }, 100);
    } else {
      console.warn('El mapa no está inicializado, reintentando...');
      setTimeout(() => {
        if (this.map) {
          this.addMarkersToMap();
          this.fixTiles();
        }
        this.loading = false;
      }, 1000);
    }
  }

  private async searchLocation(address: string): Promise<{lat: number, lng: number} | null> {
    try {
      const addressLower = address.toLowerCase();
      let searchUrl = '';
      
      const southAmericanCountries = [
        'uruguay', 'brasil', 'brazil', 'chile', 'bolivia', 'paraguay', 
        'colombia', 'venezuela', 'ecuador', 'peru', 'perú', 'guyana', 'suriname'
      ];
      
      const detectedCountry = southAmericanCountries.find(country => 
        addressLower.includes(country)
      );
      
      if (detectedCountry) {
        searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&addressdetails=1`;
      } else {
        searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=3&addressdetails=1`;
      }
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error('Error en la respuesta de Nominatim');
      }
      
      const results: any[] = await response.json();
      
      if (results && results.length > 0) {
        let bestResult = results[0];
        
        if (detectedCountry && results.length > 1) {
          const countryFilteredResult = results.find((result: any) => {
            const country = result.address?.country?.toLowerCase() || '';
            return country.includes(detectedCountry) || 
                   (detectedCountry === 'uruguay' && country.includes('uruguay')) ||
                   (detectedCountry === 'brasil' && (country.includes('brasil') || country.includes('brazil')));
          });
          
          if (countryFilteredResult) {
            bestResult = countryFilteredResult;
          }
        }
        
        return {
          lat: parseFloat(bestResult.lat),
          lng: parseFloat(bestResult.lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al buscar ubicación:', error);
      return null;
    }
  }

  private addMarkersToMap() {
    if (!this.map || !this.markerClusterGroup) return;

    this.markerClusterGroup.clearLayers();

    const validAuctions = this.auctions.filter(auction => auction.lat && auction.lng);
    
    if (validAuctions.length === 0) {
      return;
    }    validAuctions.forEach(auction => {
      const marker = L.marker([auction.lat!, auction.lng!], {
        title: auction.titulo,
        alt: auction.ubicacion,
        riseOnHover: true
      });
      
      marker.bindPopup(this.createPopupContent(auction), {
        maxWidth: 300,
        minWidth: 200,
        autoClose: false,
        closeOnClick: false
      });
      
      marker.on('click', () => {
        this.zone.run(() => {
          this.router.navigate(['/subasta', auction.id]);
        });
      });
      
      this.markerClusterGroup!.addLayer(marker);
    });

    this.markersLoaded = validAuctions.length;

    if (validAuctions.length > 1) {
      this.map.fitBounds(this.markerClusterGroup.getBounds(), { 
        padding: [50, 50],
        maxZoom: 15
      });
    } else {
      this.map.setView([validAuctions[0].lat!, validAuctions[0].lng!], 13);
    }

    this.fixTiles();
  }
  private createPopupContent(auction: AuctionLocation): string {
    return `
      <div class="p-2">
        <h3 class="font-bold text-lg mb-2">${auction.titulo}</h3>
        <p class="text-sm mb-2"><strong>Ubicación:</strong> ${auction.ubicacion}</p>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs" 
                onclick="event.stopPropagation(); window.location.href='/subasta/${auction.id}'">
          Ver Subasta
        </button>
      </div>
    `;
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }
  }


}