import { Component, computed, EventEmitter, Input, OnChanges, SimpleChanges, Output, signal } from '@angular/core';
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
export class ImageUploadInputComponent implements OnChanges {
  selectedFiles = signal<File[]>([]);
  localImages = signal<any[]>([]);
  isProcessing = signal(false);

  @Input() placeholder: string = "Seleccionar imágenes";
  @Input() folder: string = "general";
  @Input() maxFiles: number = 5;
  @Input() maxFileSize: number = 5242880;
  @Input() acceptedTypes: string = "image/*";
  @Input() required: boolean = false;
  @Input() errorMessage: string = "Debe seleccionar al menos una imagen";
  @Input() formSubmitted = signal(false);
  @Input() resetTrigger: boolean = false;

  @Output() imagesValue = new EventEmitter<File[]>();
  @Output() isInputInvalid = new EventEmitter<boolean>();

  constructor(private imageService: ImageService) {}

  showErrorMessage = computed(() => {
    return this.validateImages() && this.formSubmitted() && !this.isProcessing();
  });
  
  validateImages() {
    const isInvalid = this.required && this.localImages().length === 0 && !this.isProcessing();
        
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

    if (this.localImages().length + validFiles.length > this.maxFiles) {
      console.error(`No puede subir más de ${this.maxFiles} imágenes`);
      return;
    }

    this.selectedFiles.set(validFiles);
    this.processFiles(validFiles);
  }

  async processFiles(files: File[]) {
    if (files.length === 0) return;

    this.isProcessing.set(true);

    const processedImages: any[] = [];
    
    for (const file of files) {
      try {
        const preview = await this.imageService.generateImagePreview(file);
        
        const imageData = {
          file: file,
          preview: preview,
          original_name: file.name,
          size: file.size,
          filename: `temp_${Date.now()}_${file.name}`,
          folder: this.folder
        };
        
        processedImages.push(imageData);
        
      } catch (error) {
        console.error('Error al procesar imagen:', error);
      }
    }

    const currentImages = this.localImages();
    this.localImages.set([...currentImages, ...processedImages]);
    
    this.isProcessing.set(false);
    this.selectedFiles.set([]);
    
    // Emitir solo los archivos File al componente padre
    const allFiles = this.localImages().map(img => img.file);
    this.imagesValue.emit(allFiles);
    
    this.validateImages();
  }

  removeImage(index: number) {
    const currentImages = this.localImages();
    const updatedImages = currentImages.filter((_, i) => i !== index);
    this.localImages.set(updatedImages);
    
    const allFiles = updatedImages.map(img => img.file);
    this.imagesValue.emit(allFiles);
    
    this.validateImages();
  }

  formatFileSize(bytes: number): string {
    return this.imageService.formatFileSize(bytes);
  }
  
  reset() {
    this.selectedFiles.set([]);
    this.localImages.set([]);
    this.isProcessing.set(false);
    
    this.imagesValue.emit([]);
    this.validateImages();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resetTrigger'] && changes['resetTrigger'].currentValue) {
      this.selectedFiles.set([]);
      this.localImages.set([]);
      this.isProcessing.set(false);
    }
  }
}