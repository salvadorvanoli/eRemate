import { Component, EventEmitter, Input, Output, ViewChild, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { Articulo } from '../../../../core/models/articulo';
import { CategoriaSimple } from '../../../../core/models/categoria';
import { ItemService } from '../../../../core/services/item.service';
import { MessageService } from 'primeng/api';
import { ImageUploadInputComponent } from '../../../../shared/components/inputs/image-upload-input/image-upload-input.component';
import { ImageService } from '../../../../core/services/image.service';
import { EstadoOption, ESTADOS_ARTICULO } from '../../../../core/enums/estado-articulo.enum';
import { finalize } from 'rxjs/operators';

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
    DropdownModule,
    ImageUploadInputComponent
  ],
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss'
})
export class AddItemComponent implements OnInit, OnChanges {
  @ViewChild(ImageUploadInputComponent) imageUploadInput!: ImageUploadInputComponent;
  
  @Input() articulo: Articulo = {
    nombre: '',
    lote_id: 0,
    imagenes: [], 
    estado: '',
    especificacionesTecnicas: '',
    categoria_id: undefined
  };
  
  @Input() submitted: boolean = false;
  
  @Output() save = new EventEmitter<Articulo>();
  @Output() cancel = new EventEmitter<void>();
  categorias: CategoriaSimple[] = [];
  selectedCategoria: CategoriaSimple | null = null;
  loadingCategorias: boolean = false;

  estadosArticulo: EstadoOption[] = [];
  selectedEstado: string | null = null;
  loadingEstados: boolean = false;

  selectedImages = signal<File[]>([]);
  imagesInvalid = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  
  resetImagesTrigger = false;

  constructor(
    private imageService: ImageService,
    private itemService: ItemService,
    private messageService: MessageService
  ) {}
  ngOnInit() {
    this.loadCategorias();
    this.loadEstados();
    this.initializeArticuloData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['articulo']) {
      const isNewCleanArticle = !this.articulo.id && 
          (!this.articulo.nombre || this.articulo.nombre.trim() === '') &&
          (!this.articulo.estado || this.articulo.estado.trim() === '') &&
          (!this.articulo.especificacionesTecnicas || this.articulo.especificacionesTecnicas.trim() === '') &&
          (!this.articulo.imagenes || this.articulo.imagenes.length === 0);
      
      if (isNewCleanArticle) {
        this.resetComponent();
        this.resetImagesTrigger = true;
        setTimeout(() => this.resetImagesTrigger = false, 100);
      }
      
      this.initializeArticuloData();
      
      if (this.categorias.length > 0) {
        this.findAndSetCategoria();
      }
    }
    
    if (changes['submitted']) {
      this.formSubmitted.set(changes['submitted'].currentValue || false);
    }
  }
  private initializeArticuloData() {
    if (!this.articulo.id && (!this.articulo.imagenes || this.articulo.imagenes.length === 0)) {
      this.selectedImages.set([]);
    }
    
    if (this.articulo.categoria) {
      this.selectedCategoria = this.articulo.categoria;
    } else if (this.articulo.categoria_id) {
      if (this.categorias.length > 0) {
        this.findAndSetCategoria();
      }
    } else {
      this.selectedCategoria = null;
    }

    // Initialize estado data
    if (this.estadosArticulo.length > 0) {
      this.initializeEstadoData();
    }
  }
  private findAndSetCategoria() {
    if (this.articulo.categoria_id && this.categorias.length > 0) {
      this.selectedCategoria = this.categorias.find(cat => cat.id === this.articulo.categoria_id) || null;
    }
  }

  private initializeEstadoData() {
    if (this.articulo.estado) {
      this.selectedEstado = this.articulo.estado;
    } else {
      this.selectedEstado = null;
    }
  }

  getEstadoLabel(value: string): string {
    const estado = this.estadosArticulo.find(e => e.value === value);
    return estado ? estado.label : value;
  }
  loadCategorias() {
    this.loadingCategorias = true;
    this.itemService.getAllCategories()
      .pipe(finalize(() => this.loadingCategorias = false))
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.categorias = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            this.categorias = response.data;
          } else {
            this.categorias = [];
          }
          
          this.findAndSetCategoria();
        },
        error: (error) => {
          this.categorias = [];
          this.messageService.clear();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las categorías',
            life: 3000
          });
        }
      });
  }

  loadEstados() {
    this.loadingEstados = true;
    this.itemService.getEstadosArticulo()
      .pipe(finalize(() => this.loadingEstados = false))
      .subscribe({
        next: (estados: EstadoOption[]) => {
          this.estadosArticulo = estados;
          this.initializeEstadoData();
        },
        error: (error) => {
          // Fall back to local enum data if API fails
          this.estadosArticulo = ESTADOS_ARTICULO;
          this.initializeEstadoData();
          console.warn('Could not load estados from API, using local data:', error);
        }
      });
  }

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
    
    const hasExistingImages = this.articulo.imagenes && this.articulo.imagenes.length > 0;
    const hasNewImages = this.selectedImages().length > 0;
    
    if (!this.articulo.nombre?.trim() || 
        !this.selectedEstado || 
        !this.articulo.especificacionesTecnicas?.trim() ||
        !this.selectedCategoria ||
        (!hasExistingImages && !hasNewImages)) {
      this.submitted = true;
      
      let errorMessage = 'Todos los campos son obligatorios, incluyendo la categoría y el estado';
      if (!hasExistingImages && !hasNewImages) {
        errorMessage += ' y al menos una imagen';
      }
      this.messageService.clear();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000
      });
      return;
    }

    if (this.imagesInvalid()) {
      return;
    }

    try {
      let imagenesFinales = this.articulo.imagenes || [];
      
      if (this.selectedImages().length > 0) {
        const uploadedUrls = await this.uploadImages();
        imagenesFinales = [...imagenesFinales, ...uploadedUrls];
      }

      const articuloToSave: Articulo = {
        ...this.articulo,
        estado: this.selectedEstado,
        categoria: this.selectedCategoria,
        categoria_id: this.selectedCategoria.id,
        imagenes: imagenesFinales
      };

      this.save.emit(articuloToSave);
    } catch (error) {
      console.error('Error al guardar el artículo:', error);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  checkNombre(value: string) {
    this.articulo.nombre = value;
  }

  removeExistingImage(index: number) {
    if (this.articulo.imagenes && this.articulo.imagenes.length > index) {
      this.articulo.imagenes.splice(index, 1);
    }
  }
  resetComponent() {
    this.selectedImages.set([]);
    this.imagesInvalid.set(false);
    this.formSubmitted.set(false);
    this.selectedCategoria = null;
    this.selectedEstado = null;
  }
}
