import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country?: string;
    country_code?: string;
    [key: string]: any;
  };
}

export interface GeocodingResponse {
  success: boolean;
  data?: GeocodingResult[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/geocode';

  constructor(private http: HttpClient) {}

  /**
   * Geocode an address using the Laravel proxy
   */
  geocodeAddress(address: string, countrycodes?: string): Observable<GeocodingResult[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      address: address.trim(),
      ...(countrycodes && { countrycodes })
    };

    return this.http.post<GeocodingResponse>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Error desconocido en geocoding');
        }
      }),
      catchError(error => {
        console.error('Error in geocoding service:', error);
        let errorMessage = 'Error al obtener la ubicación';
        
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Search location with South American country detection
   */
  searchLocation(address: string): Observable<GeocodingResult[]> {
    // Detectar si se especifica un país en la dirección
    const addressLower = address.toLowerCase();
    
    // Lista de países de América del Sur para detectar
    const southAmericanCountries = [
      'uruguay', 'brasil', 'brazil', 'chile', 'bolivia', 'paraguay', 
      'colombia', 'venezuela', 'ecuador', 'peru', 'perú', 'guyana', 'suriname'
    ];
    
    const detectedCountry = southAmericanCountries.find(country => 
      addressLower.includes(country)
    );
    
    // Si se detecta un país específico, buscar sin restricción
    // Si no, priorizar Argentina
    const countrycodes = detectedCountry ? undefined : 'ar';
    
    console.log('Geocoding search:', {
      address,
      detectedCountry,
      countrycodes,
      prioritizingArgentina: !detectedCountry
    });
    
    return this.geocodeAddress(address, countrycodes);
  }
}
