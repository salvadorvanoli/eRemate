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


  onSave() {
    if (!this.articulo.nombre?.trim() || !this.articulo.estado?.trim() || !this.articulo.especificacionesTecnicas?.trim()) {
      this.submitted = true;
      return;
    }
    

    this.save.emit(this.articulo);
  }

  onCancel() {
    this.cancel.emit();
  }

  checkNombre(value: string) {
    console.log('Nombre actualizado:', value);
    this.articulo.nombre = value;
  }
}
