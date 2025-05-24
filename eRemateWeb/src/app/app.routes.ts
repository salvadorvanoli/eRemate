import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { ControlPanelComponent } from './pages/control-panel/control-panel.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { ViewProductComponent } from './pages/view-product/view-product.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AuctionComponent } from './pages/auction/auction.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
    { path: 'inicio', component: HomeComponent },
    { path: 'registro', component: RegisterComponent },
    { path: 'inicio-sesion', component: LoginComponent },
    { path: 'panel', component: ControlPanelComponent},
    { path: 'catalogo', component: CatalogComponent },
    { path: 'producto/:id', component: ViewProductComponent },
    { path: 'contacto', component: ContactUsComponent },
    { path: 'subasta/:id', component: AuctionComponent },
    { path: '404', component: NotFoundComponent },
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    { path: '**', redirectTo: '/404' }

];
