import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-title-with-background-image-and-buttons',
  templateUrl: './title-with-background-image-and-buttons.component.html',
  styleUrls: ['./title-with-background-image-and-buttons.component.scss']
})

export class TitleWithBackgroundImageAndButtonsComponent {
  @Input() title: string = 'Título por defecto';
  @Input() description?: string;
}