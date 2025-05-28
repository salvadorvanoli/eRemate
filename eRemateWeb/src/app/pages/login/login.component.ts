import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginFormComponent } from "./components/login-form/login-form.component";
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    LoginFormComponent,
    TitleAndDescriptionComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
