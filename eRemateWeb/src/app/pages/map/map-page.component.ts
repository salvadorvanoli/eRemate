import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { PrimaryButtonComponent } from '../../shared/components/buttons/primary-button/primary-button.component';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';

@Component({
    selector: 'app-map-page',
    templateUrl: './map-page.component.html',
    styleUrls: ['./map-page.component.scss'],
    standalone: true,
    imports: [CommonModule, MapComponent, PrimaryButtonComponent, TitleAndDescriptionComponent]
})
export class MapPageComponent implements OnInit {
    constructor(private router: Router) { }

    ngOnInit(): void {
    }
    
    goBack() {
        this.router.navigate(['/subastas']);
    }
}