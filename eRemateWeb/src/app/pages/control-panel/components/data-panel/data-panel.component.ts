import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Añade esta importación
import { DataView } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { PaginatorComponent } from "../../../../shared/components/paginator/paginator.component";
import { ControlPanelService } from '../../../../core/services/control-panel.service';

@Component({
  selector: 'app-data-panel',
  standalone: true,
  imports: [
    CommonModule,
    DataView,
    ButtonModule,
    PaginatorComponent
  ],
  templateUrl: './data-panel.component.html',
  styleUrl: './data-panel.component.scss'
})
export class DataPanelComponent {

  items!: any[];

  @Input() itemType!: string;
  @Input() page!: number;
  @Input() size!: number;

  constructor(
    private controlPanelService: ControlPanelService
  ) {}

  ngOnInit() {
    this.items = [];
    this.controlPanelService.getDataByType(this.itemType, this.page, this.size)?.subscribe((data) => {
      this.items = data;
    });
  }
  
  getItemTitle(item: any): string {
    return this.itemType + " nro. " + item.id;  
  }

  getItemFirstAttribute(item: any): string {
    switch (this.itemType) {
      case 'Usuario':
        return item.email;
      case 'Categoria':
      case 'Producto':
        return item.nombre;
      case 'Publicacion':
        return item.titulo;
      // case 'Pedido':
      //   return item.usuario.nombre;
      default:
        return '';
    }
  }

  getItemSecondAttribute(item: any): string {
    switch (this.itemType) {
      case 'Usuario':
        return item.nombre + ' ' + item.apellido;
      case 'Categoria':
        return "";
      case 'Producto':
        return '$' + item.precio;
      case 'Publicacion':
        return item.titulo;
      // case 'Pedido':
      //   return item.usuario.nombre;
      default:
        return '';
    }
  }

  getItemImage(item: any): string {
    switch (this.itemType) {
      case 'Usuario':
      case 'Categoria':
      // case 'Pedido':
        return ""
      case 'Producto':
        return item.imagenes ? item.imagenes[0] : '';
      case 'Publicacion':
        return item.imagen ? item.imagen : '';
      // case 'Pedido':
      //   return item.usuario.nombre;
      default:
        return '';
    }
  }

}
