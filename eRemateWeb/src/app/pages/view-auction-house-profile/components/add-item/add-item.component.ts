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
  
  // Constante para el máximo de imágenes
  readonly MAX_IMAGES = 5;

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
      const currentArticulo = changes['articulo'].currentValue;
      const previousArticulo = changes['articulo'].previousValue;
      
      // Si es un artículo completamente nuevo o vacío
      const isNewCleanArticle = !currentArticulo.id && 
          (!currentArticulo.nombre || currentArticulo.nombre.trim() === '') &&
          (!currentArticulo.estado || currentArticulo.estado.trim() === '') &&
          (!currentArticulo.especificacionesTecnicas || currentArticulo.especificacionesTecnicas.trim() === '') &&
          (!currentArticulo.imagenes || currentArticulo.imagenes.length === 0);
      
      // Si cambia el ID del artículo (edición de diferente artículo) o es nuevo
      const isArticleChange = !previousArticulo || 
          previousArticulo.id !== currentArticulo.id;
      
      if (isNewCleanArticle || isArticleChange) {
        this.resetComponent();
      }
      
      this.initializeArticuloData();
      
      if (this.categorias.length > 0) {
        this.findAndSetCategoria();
      }
    }
    
    if (changes['submitted']) {
      this.formSubmitted.set(changes['submitted'].currentValue || false);
    }
  }private initializeArticuloData() {
    // Siempre reiniciar las nuevas imágenes seleccionadas cuando se inicializa un artículo
    this.selectedImages.set([]);
    
    if (this.articulo.categoria) {
      this.selectedCategoria = this.articulo.categoria;
    } else if (this.articulo.categoria_id) {
      if (this.categorias.length > 0) {
        this.findAndSetCategoria();
      }
    } else {
      this.selectedCategoria = null;
    }

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
          this.estadosArticulo = ESTADOS_ARTICULO;
          this.initializeEstadoData();
        }
      });
  }
  onImagesSelected(images: File[]) {
    // Verificar cuántas imágenes podemos agregar
    const currentImageCount = (this.articulo.imagenes || []).length;
    const availableSlots = this.MAX_IMAGES - currentImageCount;
    
    if (availableSlots <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Límite alcanzado',
        detail: `Ya tienes el máximo de ${this.MAX_IMAGES} imágenes`,
        life: 3000
      });
      this.selectedImages.set([]);
      return;
    }
    
    // Limitar las imágenes seleccionadas a los slots disponibles
    if (images.length > availableSlots) {
      const limitedImages = images.slice(0, availableSlots);
      this.selectedImages.set(limitedImages);
      
      this.messageService.add({
        severity: 'info',
        summary: 'Imágenes limitadas',
        detail: `Solo se pueden agregar ${availableSlots} imágenes más. Se seleccionaron las primeras ${limitedImages.length}.`,
        life: 3000
      });
    } else {
      this.selectedImages.set(images);
    }
  }

  // Método para obtener el número de slots disponibles para nuevas imágenes
  getAvailableImageSlots(): number {
    const currentImageCount = (this.articulo.imagenes || []).length;
    return Math.max(0, this.MAX_IMAGES - currentImageCount);
  }

  // Método para verificar si se pueden agregar más imágenes
  canAddMoreImages(): boolean {
    return this.getAvailableImageSlots() > 0;
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
    const totalImages = (this.articulo.imagenes || []).length + this.selectedImages().length;
    
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

    // Verificar que no exceda el límite de imágenes
    if (totalImages > this.MAX_IMAGES) {
      this.messageService.add({
        severity: 'error',
        summary: 'Demasiadas imágenes',
        detail: `El máximo permitido es ${this.MAX_IMAGES} imágenes. Actualmente tienes ${totalImages}.`,
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
      
      // Reiniciar el componente después de emitir el guardado
      // Esto evita que las imágenes se acumulen para la próxima edición
      this.resetComponent();
      
    } catch (error) {
      console.error('Error al guardar el artículo:', error);
    }
  }

  onCancel() {
    this.resetComponent();
    this.cancel.emit();
  }

  checkNombre(value: string) {
    this.articulo.nombre = value;
  }

  removeExistingImage(index: number) {
    if (this.articulo.imagenes && this.articulo.imagenes.length > index) {
      this.articulo.imagenes.splice(index, 1);
      
      // Mostrar mensaje informativo
      this.messageService.add({
        severity: 'success',
        summary: 'Imagen eliminada',
        detail: `Imagen eliminada. Ahora puedes agregar ${this.getAvailableImageSlots()} imagen(es) más.`,
        life: 3000
      });
    }
  }  
  
  resetComponent() {
    this.selectedImages.set([]);
    this.imagesInvalid.set(false);
    this.formSubmitted.set(false);
    this.selectedCategoria = null;
    this.selectedEstado = null;
    
    // Forzar reinicio del componente de upload de imágenes
    this.forceImageReset();
  }
  
  private forceImageReset() {
    this.resetImagesTrigger = true;
    setTimeout(() => this.resetImagesTrigger = false, 100);
  }
}
