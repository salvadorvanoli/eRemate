import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { Articulo } from '../../../../core/models/articulo';

@Component({
  selector: 'app-add-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    FileUploadModule
  ],
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss'
})
export class AddItemComponent {
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
        // Convertir a string y agregar al array de imágenes
        const imagenBase64 = reader.result as string;
        
        // Inicializar el array si no existe
        if (!this.articulo.imagenes) {
          this.articulo.imagenes = [];
        }
        
        // Por ahora solo manejamos una imagen (la primera)
        if (this.articulo.imagenes.length === 0) {
          this.articulo.imagenes.push(imagenBase64);
        } else {
          this.articulo.imagenes[0] = imagenBase64;
        }
      };
      reader.readAsDataURL(file);
    }
  }


  onSave() {
    console.log('Guardando desde add-item:', this.articulo);
    console.log('Nombre del artículo:', this.articulo.nombre);
    

    if (!this.articulo.nombre || this.articulo.nombre.trim() === '') {
      console.error('Error: Nombre vacío, no se emitirá el evento save');
      return; 
    }
    

    const articuloToEmit = { ...this.articulo };
    this.save.emit(articuloToEmit);
  }

  onCancel() {
    this.cancel.emit();
  }

  checkNombre(value: string) {
    console.log('Nombre actualizado:', value);
    this.articulo.nombre = value;
  }
}
