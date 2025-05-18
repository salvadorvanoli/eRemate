import { Component } from '@angular/core';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';
import { ContactUsFormComponent } from './components/contact-us-form/contact-us-form.component';
import { GoogleMapsComponent } from './components/google-maps/google-maps.component';
import { DynamicAccordionComponent } from '../../shared/components/dynamic-accordion/dynamic-accordion.component';

@Component({
  selector: 'app-contact-us',
  imports: [ 
    TitleAndDescriptionComponent,
    ContactUsFormComponent,
    GoogleMapsComponent,
    DynamicAccordionComponent
  ],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})

export class ContactUsComponent {
  accordionItems = [
    { title: 'Sección 1', description: 'Contenido de la sección 1.', id: 1 },
    { title: 'Sección 2', description: 'Contenido de la sección 2.', id: 2 },
    { title: 'Sección 3', description: 'Contenido de la sección 3.', id: 3 }
  ];
}

