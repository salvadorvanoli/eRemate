import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-dynamic-accordion',
  imports: [CommonModule, AccordionModule],
  templateUrl: './dynamic-accordion.component.html',
  styleUrls: ['./dynamic-accordion.component.scss']
})
export class DynamicAccordionComponent {
  @Input() items: { title: string; description: string, id: number }[] = [];
}
