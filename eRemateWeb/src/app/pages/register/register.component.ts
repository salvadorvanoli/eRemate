import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { GoogleSigninComponent } from '../../shared/components/google-signin/google-signin.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterModule,
    RegisterFormComponent,
    GoogleSigninComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor(
  ) {}
}
