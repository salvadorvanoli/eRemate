import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-title-and-description',
  templateUrl: './title-and-description.component.html',
  styleUrls: ['./title-and-description.component.scss']
})
export class TitleAndDescriptionComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() center?: boolean = false;
}