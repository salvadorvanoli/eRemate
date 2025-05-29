import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterModule,
    RegisterFormComponent,
    TitleAndDescriptionComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor(
  ) {}
}
