import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-element-row',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    Tag
  ],
  templateUrl: './element-row.component.html',
  styleUrl: './element-row.component.scss'
})
export class ElementRowComponent {

  buttonLabel!: string;
  @Input() element!: any;
  @Input() dataType!: 'item' | 'auction';
  @Input() first!: boolean;
  @Input() getCountdown!: (item: any) => string;

  ngOnInit() {
    this.buttonLabel = this.dataType === 'item' ? 'Ver lote' : 'Ver lotes';
  }
}
