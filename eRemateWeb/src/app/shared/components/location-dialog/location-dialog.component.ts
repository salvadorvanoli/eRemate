import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({ 
  selector: 'app-location-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-dialog.component.html',
  styleUrl: './location-dialog.component.scss'
})
export class LocationDialogComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible: boolean = false;
  @Input() location: string = '';
  @Output() closed = new EventEmitter<void>();
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private defaultLatLng: [number, number] = [-34.6037, -58.3816]; // Bs As por defecto
    isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor() {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }
  ngOnChanges(): void {
    if (this.visible && this.location) {
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }
  private initializeMap(): void {
    console.log('Inicializando mapa Leaflet...');
    
    // Configurar iconos de Leaflet para corregir iconos faltantes
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    this.map = L.map('location-dialog-map').setView(this.defaultLatLng, 13);

    // Agregar la capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.location && this.location.trim()) {
        setTimeout(() => {
            this.searchLocation(this.location);
        }, 100);
    }
  }
  private async searchLocation(address: string) {
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
        } else {
            searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=3&addressdetails=1`;
        }
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta de Nominatim');
        }
        
        const results: any[] = await response.json();
        
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
                }
            }
            
            const lat = parseFloat(bestResult.lat);
            const lng = parseFloat(bestResult.lon);
            
            if (this.map) {
                this.map.setView([lat, lng], 15);
                this.updateMarker(lat, lng, bestResult.display_name);
            }
        } else {
            if (this.map) {
                this.map.setView(this.defaultLatLng, 13);
                // Agregar un marcador temporal indicando que no se encontró la ubicación
                this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Ubicación no encontrada - Buenos Aires (por defecto)');
            }
        }
    } catch (error) {
        console.error('Error en geocoding:', error);
        // En caso de error, mantener el mapa en la ubicación por defecto
        if (this.map) {
            this.map.setView(this.defaultLatLng, 13);
            this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Error al buscar ubicación - Buenos Aires (por defecto)');
        }
    }
  }

  private updateMarker(lat: number, lng: number, customTitle?: string) {
    if (!this.map) {
        console.log('Mapa no está disponible para agregar marcador');
        return;
    }

    if (this.marker) {
        this.map.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lng]).addTo(this.map);
    
    const popupText = customTitle || this.location || 'Ubicación seleccionada';
    this.marker.bindPopup(popupText).openPopup();
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onMapResize() {
        // Invalidar el tamaño del mapa cuando la ventana cambia de tamaño
        if (this.map) {
            setTimeout(() => {
                this.map?.invalidateSize();
            }, 100);
        }
    }
  close(): void {
    this.destroyMap();
    this.closed.emit();
  }
}
