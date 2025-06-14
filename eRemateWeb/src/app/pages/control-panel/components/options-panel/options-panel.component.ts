import { Component, EventEmitter, Output } from '@angular/core';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-options-panel',
  standalone: true,
  imports: [
    MenuModule
  ],
  templateUrl: './options-panel.component.html',
  styleUrl: './options-panel.component.scss'
})
export class OptionsPanelComponent {

  items = [
    {
      label: 'Usuarios',
      icon: 'pi pi-user',
      command: () => this.sendDataType('Usuario')
    },
    {
      label: 'Categorías',
      icon: 'pi pi-sitemap',
      command: () => this.sendDataType('Categoria')
    },
    {
      label: 'Productos',
      icon: 'pi pi-box',
      command: () => this.sendDataType('Producto')
    },
    {
      label: 'Publicaciones',
      icon: 'pi pi-book',
      command: () => this.sendDataType('Publicacion')
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-shopping-cart',
      command: () => this.sendDataType('Pedido')
    }
  ];

  @Output() dataType = new EventEmitter<string>();

  sendDataType(type: string) {
    this.dataType.emit(type);
  }

}
