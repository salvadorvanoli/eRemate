import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { Message } from 'primeng/message';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ImageService, ImageUploadResponse } from '../../../../core/services/image.service';

@Component({
  selector: 'app-image-upload-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Message,
    FileUploadModule,
    ButtonModule,
    BadgeModule,
    ProgressBarModule,
    TooltipModule
  ],
  templateUrl: './image-upload-input.component.html',
  styleUrl: './image-upload-input.component.scss'
})
export class ImageUploadInputComponent {

  selectedFiles = signal<File[]>([]);
  uploadedImages = signal<any[]>([]);
  isUploading = signal(false);
  uploadProgress = signal(0);  @Input() placeholder: string = "Seleccionar imágenes";
  @Input() folder: string = "general";
  @Input() maxFiles: number = 5;
  @Input() maxFileSize: number = 5242880; // 5MB por defecto
  @Input() acceptedTypes: string = "image/*";
  @Input() required: boolean = false;
  @Input() errorMessage: string = "Debe seleccionar al menos una imagen";
  @Input() formSubmitted = signal(false);

  @Output() imagesValue = new EventEmitter<any[]>();
  @Output() isInputInvalid = new EventEmitter<boolean>();

  constructor(private imageService: ImageService) {}
  showErrorMessage = computed(() => {
    return this.validateImages() && this.formSubmitted() && !this.isUploading();
  });
  
  validateImages() {
    const isInvalid = this.required && this.uploadedImages().length === 0 && !this.isUploading();
    
    console.log('🔍 validateImages - required:', this.required, 'uploadedImages:', this.uploadedImages().length, 'isUploading:', this.isUploading(), 'isInvalid:', isInvalid);
    
    this.isInputInvalid.emit(isInvalid);
    return isInvalid;
  }

  onFileSelect(event: any) {
    const files = event.files || event.currentFiles;
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (let file of files) {
      const validation = this.imageService.validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      console.error('Errores de validación:', errors);
      return;
    }

    if (this.uploadedImages().length + validFiles.length > this.maxFiles) {
      console.error(`No puede subir más de ${this.maxFiles} imágenes`);
      return;
    }

    this.selectedFiles.set(validFiles);
    this.uploadFiles(validFiles);
  }

  async uploadFiles(files: File[]) {
    if (files.length === 0) return;

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const totalFiles = files.length;
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const response = await this.imageService.uploadImage(file, this.folder).toPromise();
        
        if (response && response.success && response.data) {
          const currentImages = this.uploadedImages();
          const newImage = {
            ...response.data,
            file: file,
            preview: await this.imageService.generateImagePreview(file)
          };
          
          this.uploadedImages.set([...currentImages, newImage]);
        }
        
        uploadedCount++;
        this.uploadProgress.set((uploadedCount / totalFiles) * 100);
        
      } catch (error) {
        console.error('Error al subir imagen:', error);
      }
    }    this.isUploading.set(false);
    this.uploadProgress.set(0);
    this.selectedFiles.set([]);
    
    this.imagesValue.emit(this.uploadedImages());
    
    this.validateImages();
  }

  removeImage(index: number) {
    const currentImages = this.uploadedImages();
    const imageToRemove = currentImages[index];
    
    if (imageToRemove.filename && imageToRemove.folder) {
      this.imageService.deleteImage(imageToRemove.folder, imageToRemove.filename).subscribe({
        next: (response) => {
          console.log('Imagen eliminada del servidor:', response.message);
        },
        error: (error) => {
          console.error('Error al eliminar imagen del servidor:', error);
        }
      });
    }

    const updatedImages = currentImages.filter((_, i) => i !== index);
    this.uploadedImages.set(updatedImages);
    this.imagesValue.emit(updatedImages);
    this.validateImages();
  }

  formatFileSize(bytes: number): string {
    return this.imageService.formatFileSize(bytes);
  }

  reset() {
    const currentImages = this.uploadedImages();
    currentImages.forEach(image => {
      if (image.filename && image.folder) {
        this.imageService.deleteImage(image.folder, image.filename).subscribe();
      }
    });

    this.selectedFiles.set([]);
    this.uploadedImages.set([]);
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    
    this.imagesValue.emit([]);
    this.validateImages();
  }
}