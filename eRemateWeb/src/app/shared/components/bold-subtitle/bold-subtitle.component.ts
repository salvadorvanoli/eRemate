import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bold-subtitle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bold-subtitle.component.html',
  styleUrl: './bold-subtitle.component.scss',
  encapsulation: ViewEncapsulation.None 
})
export class BoldSubtitleComponent {
  @Input() text: string = '';
}
