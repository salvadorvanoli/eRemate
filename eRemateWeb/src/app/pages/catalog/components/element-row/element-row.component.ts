import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-element-row',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './element-row.component.html',
  styleUrl: './element-row.component.scss'
})
export class ElementRowComponent {

  @Input() element!: any;
  @Input() dataType: 'item' | 'auction' = 'item';
  @Input() first!: boolean;

  getItemProperty(item: any, property: string, fallback: any = ''): any {
    switch (property) {
      case 'nombre':
        return this.dataType === 'item' ? item.nombre : item.titulo;
      case 'precio':
        return this.dataType === 'item' ? item.precio : null;
      case 'imagen':
        return this.dataType === 'item' 
          ? (item.imagenes && item.imagenes[0]) 
          : item.imagen;
      default:
        return item[property] || fallback;
    }
  }
  
}
