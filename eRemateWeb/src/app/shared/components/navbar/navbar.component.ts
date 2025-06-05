import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { SecurityService } from '../../../core/services/security.service';
import { Observable } from 'rxjs';
import { UsuarioCasaDeRemates, UsuarioRegistrado, UsuarioRematador } from '../../../core/models/usuario';
import { NavbarItem } from '../../../core/models/navbar-item';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  user!: Observable<UsuarioRegistrado | UsuarioRematador | UsuarioCasaDeRemates | null>;
  items!: NavbarItem[];

  constructor(private securityService: SecurityService) {}

  ngOnInit() {
    this.user = this.securityService.user;

    this.user.subscribe(userEntity => {

      this.items = [
        { label: 'Inicio', icon: 'pi pi-home', routerLink: '/' },
        { label: 'Subastas', icon: 'pi pi-shop', routerLink: '/subastas' },
        { label: 'Artículos', icon: 'pi pi-box', routerLink: '/articulos' },
        { label: 'Contáctanos', icon: 'pi pi-envelope', routerLink: '/contacto' }
      ];

      if (userEntity) {
        this.items.push(
          { label: 'Mi cuenta', icon: 'pi pi-user', routerLink: '/perfil' }
        );

        this.items.push(
          { label: 'Cerrar sesión', icon: 'pi pi-sign-out', routerLink: '', command: () => this.logout() }
        );
      } else {
        this.items.push(
          { label: 'Iniciar sesión', icon: 'pi pi-sign-in', routerLink: '/inicio-sesion', classes: 'bg-blue-200 hover:bg-blue-300 rounded-md' },
          { label: 'Registrarse', icon: 'pi pi-user-plus', routerLink: '/registro', classes: 'bg-pink-200 hover:bg-pink-300 rounded-md' }
        );
      }
      
    });
  }

  logout() {
    this.securityService.logout().subscribe();
  }
}
