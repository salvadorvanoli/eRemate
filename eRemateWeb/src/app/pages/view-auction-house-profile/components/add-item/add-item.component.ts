import { Component, EventEmitter, Input, Output, ViewChild, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown'; // ✅ Agregar DropdownModule
import { Articulo } from '../../../../core/models/articulo';
import { CategoriaSimple } from '../../../../core/models/categoria'; // ✅ Importar CategoriaSimple
import { ItemService } from '../../../../core/services/item.service'; // ✅ Importar ItemService
import { MessageService } from 'primeng/api'; // ✅ Importar MessageService
import { ImageUploadInputComponent } from '../../../../shared/components/inputs/image-upload-input/image-upload-input.component';
import { ImageService } from '../../../../core/services/image.service';
import { finalize } from 'rxjs/operators'; // ✅ Importar finalize

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
export class AddItemComponent implements OnInit, OnChanges { // ✅ Agregar OnChanges
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

  // ✅ Agregar propiedades para categorías
  categorias: CategoriaSimple[] = [];
  selectedCategoria: CategoriaSimple | null = null;
  loadingCategorias: boolean = false;

  selectedImages = signal<File[]>([]);
  imagesInvalid = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  
  resetImagesTrigger = false;

  constructor(
    private imageService: ImageService,
    private itemService: ItemService,
    private messageService: MessageService
  ) {}

  // ✅ Implementar ngOnInit
  ngOnInit() {
    this.loadCategorias();
    this.initializeArticuloData();
  }

  // ✅ Implementar OnChanges para detectar cambios en el Input
  ngOnChanges(changes: SimpleChanges) {
    if (changes['articulo']) {
      console.log('Artículo cambió:', this.articulo);
      
      // Detectar si es un nuevo artículo completamente limpio
      const isNewCleanArticle = !this.articulo.id && 
          (!this.articulo.nombre || this.articulo.nombre.trim() === '') &&
          (!this.articulo.estado || this.articulo.estado.trim() === '') &&
          (!this.articulo.especificacionesTecnicas || this.articulo.especificacionesTecnicas.trim() === '') &&
          (!this.articulo.imagenes || this.articulo.imagenes.length === 0);
      
      if (isNewCleanArticle) {
        console.log('Detectado artículo nuevo limpio, reseteando componente');
        this.resetComponent();
        this.resetImagesTrigger = true;
        setTimeout(() => this.resetImagesTrigger = false, 100);
      }
      
      this.initializeArticuloData();
      
      // Si las categorías ya están cargadas, buscar la categoría correspondiente
      if (this.categorias.length > 0) {
        this.findAndSetCategoria();
      }
    }
    
    // Resetear submitted cuando viene false desde el padre
    if (changes['submitted']) {
      console.log('Submitted cambió a:', changes['submitted'].currentValue);
      this.formSubmitted.set(changes['submitted'].currentValue || false);
    }
  }

  // ✅ Método para inicializar datos del artículo
  private initializeArticuloData() {
    console.log('Inicializando datos del artículo:', this.articulo);
    
    // Solo resetear imágenes seleccionadas si es un artículo nuevo/limpio
    if (!this.articulo.id && (!this.articulo.imagenes || this.articulo.imagenes.length === 0)) {
      console.log('Reseteando imágenes seleccionadas para artículo nuevo');
      this.selectedImages.set([]);
    }
    
    // Manejar categoría
    if (this.articulo.categoria) {
      this.selectedCategoria = this.articulo.categoria;
      console.log('Categoría ya seleccionada:', this.selectedCategoria);
    } else if (this.articulo.categoria_id) {
      console.log('Artículo tiene categoria_id:', this.articulo.categoria_id);
      if (this.categorias.length > 0) {
        this.findAndSetCategoria();
      }
    } else {
      // Si no hay categoría, resetearla
      this.selectedCategoria = null;
    }
    
    console.log('Imágenes del artículo:', this.articulo.imagenes);
}

  // ✅ Método para buscar y establecer la categoría
  private findAndSetCategoria() {
    if (this.articulo.categoria_id && this.categorias.length > 0) {
      this.selectedCategoria = this.categorias.find(cat => cat.id === this.articulo.categoria_id) || null;
      console.log('Categoría encontrada por ID:', this.selectedCategoria);
    }
  }

  // ✅ Agregar método para cargar categorías
  loadCategorias() {
    this.loadingCategorias = true;
    this.itemService.getAllCategories()
      .pipe(finalize(() => this.loadingCategorias = false))
      .subscribe({
        next: (response: any) => {
          console.log('Categorías recibidas:', response);
          
          // Procesar la respuesta según la estructura
          if (Array.isArray(response)) {
            this.categorias = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            this.categorias = response.data;
          } else {
            this.categorias = [];
          }
          
          console.log('Categorías procesadas:', this.categorias);
          
          // ✅ Después de cargar categorías, buscar la del artículo
          this.findAndSetCategoria();
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
          this.categorias = [];
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las categorías',
            life: 3000
          });
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

  // ✅ Modificar onSave para incluir validación de categoría
  async onSave() {
    this.formSubmitted.set(true);
    
    // ✅ Agregar validación de imagen obligatoria
    const hasExistingImages = this.articulo.imagenes && this.articulo.imagenes.length > 0;
    const hasNewImages = this.selectedImages().length > 0;
    
    if (!this.articulo.nombre?.trim() || 
        !this.articulo.estado?.trim() || 
        !this.articulo.especificacionesTecnicas?.trim() ||
        !this.selectedCategoria ||
        (!hasExistingImages && !hasNewImages)) { // ✅ Validar que hay al menos una imagen
      this.submitted = true;
      
      let errorMessage = 'Todos los campos son obligatorios, incluyendo la categoría';
      if (!hasExistingImages && !hasNewImages) {
        errorMessage += ' y al menos una imagen';
      }
      
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
      // ✅ Solo subir nuevas imágenes si se seleccionaron
      let imagenesFinales = this.articulo.imagenes || [];
      
      if (this.selectedImages().length > 0) {
        const uploadedUrls = await this.uploadImages();
        // ✅ Agregar nuevas imágenes a las existentes (o reemplazar según tu lógica)
        imagenesFinales = [...imagenesFinales, ...uploadedUrls];
      }

      const articuloToSave: Articulo = {
        ...this.articulo,
        categoria: this.selectedCategoria,
        categoria_id: this.selectedCategoria.id,
        imagenes: imagenesFinales // ✅ Preservar imágenes existentes + nuevas
      };

      console.log('Artículo a guardar:', articuloToSave);

      this.save.emit(articuloToSave);
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

  // ✅ Método para eliminar imágenes existentes
removeExistingImage(index: number) {
  if (this.articulo.imagenes && this.articulo.imagenes.length > index) {
    this.articulo.imagenes.splice(index, 1);
  }
}

// Mejorar resetComponent para limpieza completa
resetComponent() {
  console.log('Reseteando componente AddItem');
  
  // Resetear todas las señales
  this.selectedImages.set([]);
  this.imagesInvalid.set(false);
  this.formSubmitted.set(false);
  
  // Resetear categoría seleccionada
  this.selectedCategoria = null;
  
  // ❌ ELIMINAR ESTAS LÍNEAS - NO modificar this.articulo
  // this.articulo = { ... }
}
}
