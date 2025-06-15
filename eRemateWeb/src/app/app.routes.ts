import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { ControlPanelComponent } from './pages/control-panel/control-panel.component';
import { ItemsCatalogComponent } from './pages/items-catalog/items-catalog.component';
import { AuctionsCatalogComponent } from './pages/auctions-catalog/auctions-catalog.component';
import { ViewProductComponent } from './pages/view-product/view-product.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AuctionComponent } from './pages/auction/auction.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { CompleteProfileComponent } from './pages/complete-profile/complete-profile.component';
import { AuctioneerManagementComponent } from './pages/auctioneer-management/auctioneer-management.component';

import { ViewAuctionHouseProfileComponent } from './pages/view-auction-house-profile/view-auction-house-profile.component';
import { ViewRegisteredUserProfileComponent } from './pages/view-registered-user-profile/view-registered-user-profile.component';
import { ViewProfileComponent } from './pages/view-profile/view-profile.component';
import { MapPageComponent } from './pages/map/map.component';

import { ChatDetailComponent } from './pages/chat-detail/chat-detail.component';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { AuctioneerGuard } from './core/guards/auctioneer.guard';
import { ChatAccessGuard } from './core/guards/chat-access.guard';
import { PaymentAuthorizationGuard } from './core/guards/payment-authorization.guard';
import { PaymentSuccessGuard } from './core/guards/payment-success.guard';

export const routes: Routes = [
    { path: 'inicio', component: HomeComponent },
    { path: 'registro', component: RegisterComponent },
    { path: 'completar-perfil', component: CompleteProfileComponent },
    { path: 'inicio-sesion', component: LoginComponent },
    { path: 'panel', component: ControlPanelComponent },
    { path: 'articulos', component: ItemsCatalogComponent },
    { path: 'subastas', component: AuctionsCatalogComponent },
    { path: 'mapa', component: MapPageComponent },
    { path: 'producto/:id', component: ViewProductComponent },
    { path: 'contacto', component: ContactUsComponent },    { path: 'subasta/:id', component: AuctionComponent },    { 
        path: 'panel-rematador/:id', 
        component: AuctioneerManagementComponent,
        canActivate: [AuctioneerGuard]
    },
    {
        path: 'chat-detail/:id',
        component: ChatDetailComponent,
        canActivate: [AuthGuard, ChatAccessGuard]
    },
    {
        path: 'pago',
        component: PaymentComponent,
        canActivate: [AuthGuard, PaymentAuthorizationGuard]
    },
    {
        path: 'pago/exitoso',
        component: PaymentSuccessComponent,
        canActivate: [AuthGuard, PaymentSuccessGuard]
    },
    { path: 'pago/cancelado', redirectTo: '/pago', pathMatch: 'full' },
    { path: 'perfil', component: ViewProfileComponent },
    { path: 'perfil-casa', component: ViewAuctionHouseProfileComponent },
    { path: 'perfil-usuario', component: ViewRegisteredUserProfileComponent },
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    { path: '404', component: NotFoundComponent },
    { path: '**', redirectTo: '/404' }
];