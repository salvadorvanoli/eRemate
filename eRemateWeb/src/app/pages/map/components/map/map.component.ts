import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, NgZone, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import * as L from 'leaflet';
import * as MarkerClusterGroup from 'leaflet.markercluster';
import { SubastaService } from '../../../../core/services/subasta.service';
import { UseInfoComponent } from '../use-info/use-info.component';
import { MapFilters } from '../map-filters/map-filters.component';

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
  tipoSubasta?: string;
  estado?: string;
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

export class MapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() filters: MapFilters = {};
  
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && !changes['filters'].firstChange) {
      console.log('Filtros cambiaron:', changes['filters'].currentValue);
      this.loadAuctions();
    }
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
  }  
  
  private loadAuctions() {
    this.loading = true;
    console.log('Iniciando carga de subastas optimizada para mapa...');
    console.log('Filtros activos:', this.filters);
    
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
      this.markersLoaded = 0;
    }
    
    const hasFilters = this.filters && (
      this.filters.tipoSubasta || 
      (this.filters.estado && this.filters.estado.length > 0) || 
      this.filters.categoria
    );
      const serviceCall = hasFilters 
      ? this.subastaService.getSubastasParaMapaFiltradas(this.filters)
      : this.subastaService.getSubastasParaMapa().pipe(
          map((auctions: any[]) => auctions.map((auction: any) => ({
            ...auction,
            tipoSubasta: 'PRESENCIAL',
            estado: 'INICIADA'
          })))
        );
    
    serviceCall.subscribe({
      next: (auctions: any[]) => {
        console.log('Respuesta del servicio:', auctions);
        
        this.auctions = auctions.filter(auction => {
          const hasLocation = auction.ubicacion && 
                             auction.ubicacion.trim().length > 0 &&
                             auction.ubicacion.toLowerCase() !== 'undefined' &&
                             auction.ubicacion.toLowerCase() !== 'null';
          console.log(`Validando subasta ${auction.id}: incluir = ${hasLocation} (ubicacion: "${auction.ubicacion}")`);
          return hasLocation;
        }).map(auction => ({
          ...auction,
          titulo: auction.titulo || `Subasta #${auction.id}`
        }));        console.log('Subastas válidas para el mapa:', this.auctions.length);
        console.log('Detalle de subastas:', this.auctions);
          
        if (this.auctions.length === 0 && !hasFilters) {
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
        } else if (this.auctions.length === 0 && hasFilters) {
          console.log('No se encontraron subastas que coincidan con los filtros aplicados.');
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
  }  private createPopupContent(auction: AuctionLocation): string {
    const tipoLabel = auction.tipoSubasta ? this.getTipoLabel(auction.tipoSubasta) : '';
    const estadoLabel = auction.estado ? this.getEstadoLabel(auction.estado) : '';
    
    return `
      <div class="p-3 min-w-[250px]">
        <h3 class="font-bold text-lg mb-2 text-gray-800">${auction.titulo}</h3>
        <div class="space-y-1 mb-3">
          <p class="text-sm"><strong>Ubicación:</strong> ${auction.ubicacion}</p>
          ${tipoLabel ? `<p class="text-sm"><strong>Tipo:</strong> <span class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">${tipoLabel}</span></p>` : ''}
          ${estadoLabel ? `<p class="text-sm"><strong>Estado:</strong> <span class="inline-block px-2 py-1 text-xs rounded-full ${this.getEstadoBadgeClass(auction.estado)} text-white">${estadoLabel}</span></p>` : ''}
        </div>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors duration-200 w-full" 
                onclick="event.stopPropagation(); window.location.href='/subasta/${auction.id}'">
          Ver Subasta
        </button>
      </div>
    `;
  }

  private getTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'PRESENCIAL': return 'Presencial';
      case 'HIBRIDA': return 'Híbrida';
      case 'REMOTA': return 'Remota';
      default: return tipo;
    }
  }

  private getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_APROBACION': return 'Pendiente Aprobación';
      case 'PENDIENTE': return 'Pendiente';
      case 'ACEPTADA': return 'Aceptada';
      case 'INICIADA': return 'Iniciada';
      case 'CERRADA': return 'Cerrada';
      case 'CANCELADA': return 'Cancelada';
      default: return estado;
    }
  }

  private getEstadoBadgeClass(estado?: string): string {
    switch (estado) {
      case 'INICIADA': return 'bg-green-500';
      case 'ACEPTADA': return 'bg-blue-500';
      case 'PENDIENTE': return 'bg-yellow-500';
      case 'PENDIENTE_APROBACION': return 'bg-orange-500';
      case 'CERRADA': return 'bg-gray-500';
      case 'CANCELADA': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
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