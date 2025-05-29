import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    folder: string;
    path: string;
    url: string;
    size: number;
    original_name: string;
  };
  error?: string;
}

export interface ImageListResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    folder: string;
    path: string;
    url: string;
    size: number;
    last_modified: number;
  }[];
  total?: number;
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})

export class ImageService {
  private apiUrl = 'http://127.0.0.1:8000/api/images';

  constructor(private http: HttpClient) {}

  uploadImage(file: File, folder: string = 'general'): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    return this.http.post<ImageUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  getImageUrl(folder: string, filename: string): string {
    return `${this.apiUrl}/serve/${folder}/${filename}`;
  }

  listImages(folder: string = 'general'): Observable<ImageListResponse> {
    return this.http.get<ImageListResponse>(`${this.apiUrl}/list/${folder}`);
  }

  deleteImage(folder: string, filename: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${folder}/${filename}`);
  }

  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Solo se permiten: JPEG, PNG, JPG, WEBP'
      };
    }

    // Verificar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
      };
    }

    return { isValid: true };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject('Error al generar preview');
      };
      reader.readAsDataURL(file);
    });
  }
}
