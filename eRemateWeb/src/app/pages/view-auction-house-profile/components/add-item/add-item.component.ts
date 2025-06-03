import { Component, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { Articulo } from '../../../../core/models/articulo';
import { ImageUploadInputComponent } from '../../../../shared/components/inputs/image-upload-input/image-upload-input.component';
import { ImageService } from '../../../../core/services/image.service';

@Component({
  selector: 'app-add-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    FileUploadModule,
    ImageUploadInputComponent
  ],
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss'
})
export class AddItemComponent {
  @ViewChild(ImageUploadInputComponent) imageUploadInput!: ImageUploadInputComponent;
  
  @Input() articulo: Articulo = {
    nombre: '',
    lote_id: 0,
    imagenes: [], 
    estado: '',
    especificacionesTecnicas: ''
  };
  
  @Input() submitted: boolean = false;
  
  @Output() save = new EventEmitter<Articulo>();
  @Output() cancel = new EventEmitter<void>();

  selectedImages = signal<File[]>([]);
  imagesInvalid = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  constructor(private imageService: ImageService) {}

  onImagesSelected(images: File[]) {
    this.selectedImages.set(images);
  }

  onImageValidationChange(isInvalid: boolean) {
    this.imagesInvalid.set(isInvalid);
  }

  async uploadImages(): Promise<string[]> {
    const uploadedUrls: string[] = [];
    
    for (const image of this.selectedImages()) {
      try {
        const response = await this.imageService.uploadImage(image, 'articulos').toPromise();
        if (response && response.success && response.data && response.data.url) {
          uploadedUrls.push(response.data.url);
        }
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
      }
    }
    
    return uploadedUrls;
  }

  get imagenPrincipal(): string {
    return this.articulo.imagenes && this.articulo.imagenes.length > 0 
      ? this.articulo.imagenes[0] 
      : '';
  }

  onUpload(event: any) {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imagenBase64 = reader.result as string;
        
        if (!this.articulo.imagenes) {
          this.articulo.imagenes = [];
        }
        
        if (this.articulo.imagenes.length === 0) {
          this.articulo.imagenes.push(imagenBase64);
        } else {
          this.articulo.imagenes[0] = imagenBase64;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async onSave() {
    this.formSubmitted.set(true);
    
    if (!this.articulo.nombre?.trim() || !this.articulo.estado?.trim() || !this.articulo.especificacionesTecnicas?.trim()) {
      this.submitted = true;
      return;
    }

    if (this.imagesInvalid()) {
      return;
    }

    try {
      if (this.selectedImages().length > 0) {
        const uploadedUrls = await this.uploadImages();
        this.articulo.imagenes = uploadedUrls;
      }

      this.save.emit(this.articulo);
    } catch (error) {
      console.error('Error al guardar el artículo:', error);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  checkNombre(value: string) {
    console.log('Nombre actualizado:', value);
    this.articulo.nombre = value;
  }
}
