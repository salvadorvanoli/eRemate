import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { interval, map, Subscription } from 'rxjs';
import { MessageComponent } from '../../shared/components/message/message.component';
import { DataView } from 'primeng/dataview';
import { FormsModule } from "@angular/forms";
import { SearchBarComponent } from '../../shared/components/inputs/search-bar/search-bar.component';
import { ElementRowComponent } from "./components/element-row/element-row.component";
import { FormSelectInputComponent } from '../../shared/components/inputs/form-select-input/form-select-input.component';
import { FormCheckboxComponent } from "../../shared/components/inputs/form-checkbox/form-checkbox.component";
import { DatePickerComponent } from "../../shared/components/inputs/date-picker/date-picker.component";
import { PrimaryButtonComponent } from "../../shared/components/buttons/primary-button/primary-button.component";
import { ViewChild } from '@angular/core';
import { ItemService } from '../../core/services/item.service';
import { SubastaService } from '../../core/services/subasta.service';
import { CatalogElement } from '../../core/models/catalog-element';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    Toast,
    MessageComponent,
    DataView,
    FormsModule,
    FormSelectInputComponent,
    SearchBarComponent,
    DatePickerComponent,
    PrimaryButtonComponent,
    ElementRowComponent,
    FormCheckboxComponent
  ],
  providers: [
    MessageService
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent {

  @ViewChild('searchBar') searchBar!: SearchBarComponent;
  @ViewChild('categorySelect') categorySelect!: FormSelectInputComponent;
  @ViewChild('locationSelect') locationSelect!: FormSelectInputComponent;
  @ViewChild('datePicker') datePicker!: DatePickerComponent;
  @ViewChild('closedCheckbox') closedCheckbox!: FormCheckboxComponent;
  
  rows: number = 10;
  first: number = 0;
  rowsPerPageOptions: number[] = [10, 20, 30];

  categories!: { label: string, value: any }[];
  locations!: { label: string, value: string }[];
  elements: CatalogElement[] = [];
  countdowns: { [id: number]: string } = {};
  imagenesAleatorias: { [id: number]: string } = {};
  private timerSub?: Subscription;
  @Input() dataType: 'item' | 'auction' = 'item';
  @Input() searchText: string = '';
  @Input() closedSelected: boolean = false;
  @Input() selectedCategory: number | null = null;
  @Input() selectedLocation: string | null = null;
  @Input() selectedLimitCloseDate: string | null = null;
  @Input() service!: ItemService | SubastaService;

  constructor(
    private messageService: MessageService,
    private itemService: ItemService,
    private subastaService: SubastaService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadLocations();
    this.getElements();
    this.timerSub = interval(1000).subscribe(() => this.updateCountdowns());
  }

  getElements(): void {
    this.service.getAllOrdered()
      .subscribe({
        next: (response: any) => {
          let data = [];
          if (response.data) {
            data = response.data;
          } else if (Array.isArray(response)) {
            data = response;
          }
          
          this.elements = data.map((item: any) => ({
            ...item,
            fechaInicio: item.fechaInicio ? new Date(item.fechaInicio) : null,
            fechaCierre: item.fechaCierre ? new Date(item.fechaCierre) : null
          })) as CatalogElement[];          this.updateCountdowns();
          this.cargarImagenesAleatorias();
        },
        error: (error: any) => {
          console.error('Error al obtener los elementos: ', error);
        }
      });
  }
  
  filterElements() {
    this.service.getAllFiltered(
      this.searchText,
      this.closedSelected,
      this.selectedCategory,
      this.selectedLocation,
      this.selectedLimitCloseDate
    ).subscribe({
      next: (response: any) => {
        let data = [];
        if (response.data) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        }
        
        this.elements = data.map((item: any) => ({
          ...item,
          fechaInicio: item.fechaInicio ? new Date(item.fechaInicio) : null,
          fechaCierre: item.fechaCierre ? new Date(item.fechaCierre) : null
        })) as CatalogElement[];
        
        this.updateCountdowns();
        this.cargarImagenesAleatorias();
      },
      error: (error: any) => {
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message, life: 4000 });
      }
    });
  }

  applyFilters() {
    this.filterElements();
  }

  resetFilters() {
    this.resetAttributes();
    
    setTimeout(() => {
      this.resetChildComponents();
      
      this.getElements();
    });
  }

  onSearchTextChange(searchText: string) {
    this.searchText = searchText;
  }

  onClosedCheck(closed: boolean) {
    this.closedSelected = closed;
  }

  onCategorySelection(category: number | null) {
    this.selectedCategory = category;
  }

  onLocationSelection(location: string | null) {
    this.selectedLocation = location;
  }

  onLimitCloseDateSelection(date: string | null) {
    this.selectedLimitCloseDate = date;
  }
  
  getCountdown = (element: CatalogElement): string => {
    return this.countdowns[element.id] || '';
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }
  
  onRowsChange(event: any) {
    this.rows = event.value;
  }

  private updateCountdowns() {
    const now = new Date().getTime();
    this.elements.forEach(element => {
      const cierre = new Date(element.fechaCierre!).getTime();
      const diff = cierre - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.countdowns[element.id] = `Cierra en ${hours}h ${minutes}m ${seconds}s`;
      } else {
        this.countdowns[element.id] = 'Finalizada';
      }
    });
  }  
  
  private cargarImagenesAleatorias(): void {
    this.elements.forEach(element => {
      if (this.dataType === 'auction') {

        this.subastaService.obtenerImagenAleatoria(element.id).subscribe(
          (response) => {
            if (response && response.imagen) {
              this.imagenesAleatorias[element.id] = response.imagen;
            }
          },
          (error) => {
            console.log(`No se pudo cargar imagen para subasta ${element.id}:`, error);
            this.imagenesAleatorias[element.id] = '/remate.jpg';
          }
        );
      } else {
        const elementAsAny = element as any;
        if (elementAsAny.imagen && elementAsAny.imagen.length > 0) {
          this.imagenesAleatorias[element.id] = elementAsAny.imagen;
        } else {
          this.imagenesAleatorias[element.id] = '/remate.jpg';
        }
      }
    });
  }

  getImage = (element: CatalogElement): string => {
    if (!element || !element.id) {
      return 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    }

    return this.imagenesAleatorias[element.id] || 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
  }

  private loadCategories() {
    this.itemService.getCategories()
    .pipe(
      map((response: any) => {
        const categories = response.data || [];
        return categories.map((category: any) => ({
          label: category.nombre,
          value: category.id
        }));
      })
    )
    .subscribe(
      (formattedCategories: {label: string, value: any}[]) => {
        this.categories = formattedCategories;
      },
      (error) => {
        console.error('Error al obtener las categorías:', error);
      }
    );
  }

  private loadLocations() {
    this.subastaService.getLocations()
    .pipe(
      map((response: any) => {
        const locations = response.data || [];
        return locations.map((location: string) => ({
          label: location,
          value: location
        }));
      })
    )
    .subscribe(
      (formattedCategories: {label: string, value: string}[]) => {
        this.locations = formattedCategories;
      },
      (error) => {
        console.error('Error al obtener las ubicaciones:', error);
      }
    );
  }

  private resetAttributes() {
    this.searchText = '';
    this.closedSelected = false;
    this.selectedCategory = null;
    this.selectedLocation = null;
    this.selectedLimitCloseDate = null;
  }

  private resetChildComponents() {
    if (this.searchBar) this.searchBar.reset();
    if (this.categorySelect) this.categorySelect.reset();
    if (this.locationSelect) this.locationSelect.reset();
    if (this.datePicker) this.datePicker.reset();
    if (this.closedCheckbox) this.closedCheckbox.reset();
  }

}
