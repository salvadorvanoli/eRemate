# 📸 Documentación: Componente de Subida de Imágenes

Les dejo esta documentación creada por copilot para que se hagan una idea de cómo se usa el tema de las imágenes

## 📋 Descripción General

El `ImageUploadInputComponent` es un componente reutilizable de Angular que permite subir, gestionar y validar imágenes. Incluye funcionalidades como:

- ✅ Subida múltiple de imágenes
- ✅ Validación de archivos (tipo, tamaño, cantidad)
- ✅ Preview de imágenes
- ✅ Eliminación automática de imágenes del servidor
- ✅ Limpieza automática al cambiar de contexto
- ✅ Progreso de subida
- ✅ Gestión de errores

---

## 🔧 Configuración Inicial

### 1. **Importar el Componente**

```typescript
// En tu componente padre
import { ImageUploadInputComponent } from './ruta/al/componente/image-upload-input.component';

@Component({
  imports: [
    // ...otros imports
    ImageUploadInputComponent
  ]
})
```

### 2. **Importar el ImageService**

```typescript
// En tu componente padre
import { ImageService } from './ruta/al/servicio/image.service';

constructor(
  private imageService: ImageService,
  // ...otros servicios
) {}
```

---

## 🎯 Uso Básico

### **HTML Template**

```html
<app-image-upload-input
  folder="mi-carpeta"
  [maxFiles]="3"
  [required]="true"
  [formSubmitted]="formSubmitted"
  (imagesValue)="onImagesSelected($event)"
  (isInputInvalid)="onImageValidationChange($event)"
  #imageInput>
</app-image-upload-input>
```

### **Componente TypeScript**

```typescript
export class MiComponente {
  @ViewChild('imageInput') imageInput: any;
  
  images: any[] = [];
  isImageInvalid: boolean = false;
  formSubmitted = signal(false);

  onImagesSelected(images: any[]) {
    this.images = images;
    console.log('Imágenes seleccionadas:', images);
  }

  onImageValidationChange(isInvalid: boolean) {
    this.isImageInvalid = isInvalid;
  }

  // Limpiar imágenes manualmente
  resetImages() {
    if (this.imageInput) {
      this.imageInput.reset();
    }
    this.images = [];
  }
}
```

---

## ⚙️ Propiedades de Configuración

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `folder` | `string` | `"general"` | Carpeta donde se guardan las imágenes |
| `maxFiles` | `number` | `5` | Número máximo de archivos |
| `maxFileSize` | `number` | `5242880` | Tamaño máximo por archivo (5MB) |
| `acceptedTypes` | `string` | `"image/*"` | Tipos de archivo aceptados |
| `required` | `boolean` | `false` | Si es obligatorio subir imágenes |
| `placeholder` | `string` | `"Seleccionar imágenes"` | Texto del botón |
| `errorMessage` | `string` | `"Debe seleccionar al menos una imagen"` | Mensaje de error |
| `formSubmitted` | `signal<boolean>` | `signal(false)` | Estado del formulario |

---

## 📤 Eventos de Salida

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `imagesValue` | `EventEmitter<any[]>` | Emite las imágenes subidas |
| `isInputInvalid` | `EventEmitter<boolean>` | Emite el estado de validación |

---

## 🎨 Casos de Uso Específicos

### **1. Para Rematadores (Perfil)**

```html
<app-image-upload-input
  folder="rematadores"
  [maxFiles]="1"
  [required]="true"
  placeholder="Subir foto de perfil"
  errorMessage="La foto de perfil es obligatoria"
  [formSubmitted]="formSubmitted"
  (imagesValue)="onImagesSelected($event)"
  (isInputInvalid)="onImageValidationChange($event)"
  #imageInput>
</app-image-upload-input>
```

### **2. Para Productos/Lotes**

```html
<app-image-upload-input
  folder="productos"
  [maxFiles]="10"
  [required]="false"
  placeholder="Agregar imágenes del producto"
  [formSubmitted]="formSubmitted"
  (imagesValue)="onProductImagesSelected($event)"
  (isInputInvalid)="onProductImageValidationChange($event)"
  #productImageInput>
</app-image-upload-input>
```

### **3. Para Documentos/Certificados**

```html
<app-image-upload-input
  folder="documentos"
  [maxFiles]="5"
  [required]="true"
  acceptedTypes="image/*,.pdf"
  placeholder="Subir documentos"
  [formSubmitted]="formSubmitted"
  (imagesValue)="onDocumentsSelected($event)"
  (isInputInvalid)="onDocumentValidationChange($event)"
  #documentInput>
</app-image-upload-input>
```

---

## 🧹 Limpieza Automática de Imágenes

### **Escenarios de Limpieza**

1. **Al cambiar tipo de usuario**: Las imágenes se eliminan automáticamente
2. **Al abandonar la vista**: Se limpian en `ngOnDestroy`
3. **Al resetear manualmente**: Usando el método `reset()`

### **Implementación en el Componente Padre**

```typescript
export class MiComponente implements OnInit, OnDestroy {
  @ViewChild('imageInput') imageInput: any;
  
  previousSelectedOption: string = '';
  images: any[] = [];

  // Limpieza al cambiar contexto
  onUserTypeChange(newType: string) {
    if (this.previousSelectedOption !== newType && this.images.length > 0) {
      this.cleanupPreviousImages();
      
      if (this.imageInput) {
        this.imageInput.reset();
      }
      
      this.images = [];
    }
    
    this.previousSelectedOption = this.selectedOption;
    this.selectedOption = newType;
  }

  // Limpieza al destruir componente
  ngOnDestroy() {
    if (this.images.length > 0) {
      this.cleanupPreviousImages();
    }
  }

  private cleanupPreviousImages() {
    const imagesToDelete = [...this.images];
    
    imagesToDelete.forEach(image => {
      if (image.filename && image.folder) {
        this.imageService.deleteImage(image.folder, image.filename).subscribe({
          next: (response) => {
            console.log('✅ Imagen eliminada:', image.filename);
          },
          error: (error) => {
            console.warn('⚠️ Error al eliminar imagen:', error);
          }
        });
      }
    });
  }
}
```

---

## 🔄 Integración con Formularios

### **Envío de Datos al Backend**

```typescript
enviarFormulario() {
  this.formSubmitted.set(true);
  
  if (!this.validateForm()) {
    const formData = {
      // ...otros campos
      imagenes: this.images // Array de imágenes
    };

    this.miService.guardarDatos(formData).subscribe({
      next: (response) => {
        console.log('✅ Datos guardados');
        // Limpiar localStorage si es necesario
        localStorage.removeItem('google_registration_data');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Error al guardar:', error);
      }
    });
  }
}
```

### **Validación del Formulario**

```typescript
validateForm(): boolean {
  return this.isImageInvalid || /* otras validaciones */;
}
```

---

## 🔒 Backend: Configuración Requerida

### **1. Controller (Laravel)**

```php
// En tu controller (ej: UserController, ProductController)
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'imagenes' => 'nullable|array',
        'imagenes.*' => 'nullable|array',
        // ...otras validaciones
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Procesar imágenes
    $imagenUrl = null;
    if ($request->has('imagenes') && is_array($request->imagenes)) {
        $primeraImagen = $request->imagenes[0];
        if (is_array($primeraImagen) && isset($primeraImagen['url'])) {
            $imagenUrl = $primeraImagen['url'];
        }
    }

    // Guardar en base de datos
    $usuario = User::create([
        // ...otros campos
        'imagen' => $imagenUrl,
        'perfil_completo' => 1
    ]);

    return response()->json(['message' => 'Guardado exitosamente']);
}
```

### **2. Rutas API**

```php
// En routes/api.php
Route::prefix('images')->group(function () {
    Route::post('/upload', [ImageController::class, 'upload']);
    Route::delete('/{folder}/{filename}', [ImageController::class, 'delete']);
    Route::get('/serve/{folder}/{filename}', [ImageController::class, 'serve']);
});
```

### **3. Carpetas de Almacenamiento**

Asegúrate de que existan las carpetas:
```
storage/app/public/images/
├── rematadores/
├── productos/
├── documentos/
├── general/
└── ...
```

---

## 📝 Estructura de Datos de Imagen

### **Objeto de Imagen Completo**

```javascript
{
  filename: "1640995200_abc123.jpg",
  folder: "rematadores",
  path: "images/rematadores/1640995200_abc123.jpg",
  url: "http://localhost:8000/api/images/serve/rematadores/1640995200_abc123.jpg",
  size: 1024768,
  original_name: "mi-foto.jpg",
  file: File, // Objeto File original
  preview: "data:image/jpeg;base64,..." // Preview base64
}
```

---

## ⚠️ Consideraciones Importantes

### **1. Memoria y Rendimiento**
- Las imágenes se eliminan automáticamente del servidor cuando no se necesitan
- Usa `maxFiles` apropiado para evitar sobrecarga
- El componente gestiona automáticamente los previews

### **2. Validación**
- El componente valida automáticamente tipo, tamaño y cantidad
- Emite eventos para que el componente padre maneje la validación del formulario

### **3. Carpetas**
- Usa carpetas descriptivas: `"rematadores"`, `"productos"`, `"documentos"`
- Las carpetas se crean automáticamente en el backend

### **4. Limpieza**
- **CRÍTICO**: Siempre implementa limpieza en `ngOnDestroy` y al cambiar contexto
- Las imágenes huérfanas consumen espacio en el servidor

---

## 🐛 Solución de Problemas Comunes

### **1. Las imágenes no se suben**
- Verificar que el `ImageService` esté importado
- Revisar que el backend esté corriendo
- Comprobar los permisos de la carpeta `storage`

### **2. Validación no funciona**
- Asegúrate de pasar `[formSubmitted]="formSubmitted"`
- Verifica que estés escuchando el evento `(isInputInvalid)`

### **3. Imágenes no se eliminan**
- Implementa correctamente `ngOnDestroy`
- Usa `cleanupPreviousImages()` al cambiar contexto

### **4. Errores de tipos TypeScript**
- Usa `any[]` para el array de imágenes si es necesario
- Asegúrate de importar las interfaces del `ImageService`

---

## ✅ Checklist de Implementación

- [ ] Importar `ImageUploadInputComponent`
- [ ] Importar `ImageService`
- [ ] Configurar propiedades según necesidades
- [ ] Implementar eventos `(imagesValue)` e `(isInputInvalid)`
- [ ] Agregar `@ViewChild` para el componente
- [ ] Implementar limpieza en `ngOnDestroy`
- [ ] Implementar limpieza al cambiar contexto
- [ ] Configurar validación en el backend
- [ ] Probar subida, eliminación y limpieza
- [ ] Verificar permisos de carpetas en el servidor

---

*Última actualización: Mayo 2025*
