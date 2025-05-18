import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SecurityService } from './core/services/security.service';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { FooterComponent } from "./shared/components/footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'eRemateWeb';

  constructor(
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    this.securityService.getActualUser().subscribe();
  }
}
