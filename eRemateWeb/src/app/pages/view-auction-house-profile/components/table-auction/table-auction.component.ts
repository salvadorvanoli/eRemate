import { Component, OnInit, ViewChild, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';  
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs/operators';
import * as L from 'leaflet';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { SubastaService } from '../../../../core/services/subasta.service';
import { Subasta } from '../../../../core/models/subasta';
import { UsuarioRematador, RematadorResponse } from '../../../../core/models/usuario';
import { SecurityService } from '../../../../core/services/security.service';
import { Router } from '@angular/router';
import { TipoSubasta, TipoOption, TIPOS_SUBASTA } from '../../../../core/enums/tipo-subasta.enum';

@Component({
  selector: 'app-table-auction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule,
    ProgressSpinnerModule,
    DatePipe  
  ],
  providers: [ConfirmationService],
  templateUrl: './table-auction.component.html',
  styleUrl: './table-auction.component.scss'
})
export class TableAuctionComponent implements OnInit, AfterViewInit, OnDestroy {
    auctions: Subasta[] = [];
    cols: any[] = [];
    loading = false;
    auctionDialog: boolean = false;
    auction!: Subasta;
    selectedAuction: Subasta | null = null;
    submitted: boolean = false;
    globalFilterFields: string[] = [];    rematadorEmail: string = '';
    selectedRematador: RematadorResponse | null = null;    emailError: string = '';
    rematadores: RematadorResponse[] = [];
    casaId: number | null = null; 
    
    // Propiedades para tipos de subasta
    tipos: TipoOption[] = [];
    selectedTipo: TipoOption | null = null;
    selectedEditTipo: TipoOption | null = null;
    loadingTipos: boolean = false;
    
    minDate: string = '';
    minEndDate: string = '';
    dateErrors: { startDate: string, endDate: string } = { startDate: '', endDate: '' };
    
    private map: L.Map | null = null;
    private marker: L.Marker | null = null;
    mapVisible: boolean = false;
    private searchTimeout: any;

    editAuctionDialog: boolean = false;
    editingAuction: any = {};
    editSubmitted: boolean = false;
    editMinDate: string = '';
    editMinEndDate: string = '';
    editDateErrors: { startDate: string, endDate: string } = { startDate: '', endDate: '' };
    editMapVisible: boolean = false;
    private editMap: L.Map | null = null;
    private editMarker: L.Marker | null = null;
    private editSearchTimeout: any;

    private defaultLatLng: [number, number] = [-34.9011, -56.1645]; // Montevideo, Uruguay por defecto


    @ViewChild('dt') dt!: Table;
    @Output() auctionSelected = new EventEmitter<number>();    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private auctionHouseService: AuctionHouseService,
        private subastaService: SubastaService,
        private securityService: SecurityService,
        private router: Router
    ) {}

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        if (this.map) {
            this.map.remove();
        }
        if (this.editMap) {
            this.editMap.remove();
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        if (this.editSearchTimeout) {
            clearTimeout(this.editSearchTimeout);
        }
    }

    onLocationChange() {
        if (this.auction.ubicacion && this.auction.ubicacion.trim().length > 2) {
            this.mapVisible = true;
            
            setTimeout(() => {
                if (!this.map) {
                    this.initializeMap();
                }
            }, 100);
            
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchLocation(this.auction.ubicacion);
            }, 800);
        } else {
            this.mapVisible = false;
        }
    }

    initializeMap() {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        this.map = L.map('auction-map').setView(this.defaultLatLng, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        if (this.auction.ubicacion && this.auction.ubicacion.trim()) {
            setTimeout(() => {
                this.searchLocation(this.auction.ubicacion);
            }, 100);
        }
    }

    private async searchLocation(address: string) {
        try {
            const addressLower = address.toLowerCase();
            let searchUrl = '';
            
            const southAmericanCountries = [
                'uruguay', 'brasil', 'brazil', 'chile', 'bolivia', 'paraguay', 
                'colombia', 'venezuela', 'ecuador', 'peru', 'perú', 'guyana', 'suriname'
            ];
            
            const detectedCountry = southAmericanCountries.find(country => 
                addressLower.includes(country)
            );
            
            if (detectedCountry) {
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&addressdetails=1`;
            } else {
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=3&addressdetails=1`;
            }
            
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error('Error en la respuesta de Nominatim');
            }
            
            const results: any[] = await response.json();
            
            if (results && results.length > 0) {
                let bestResult = results[0];
                
                if (detectedCountry && results.length > 1) {
                    const countryFilteredResult = results.find((result: any) => {
                        const country = result.address?.country?.toLowerCase() || '';
                        return country.includes(detectedCountry) || 
                               (detectedCountry === 'uruguay' && country.includes('uruguay')) ||
                               (detectedCountry === 'brasil' && (country.includes('brasil') || country.includes('brazil'))) ||
                               (detectedCountry === 'brazil' && (country.includes('brasil') || country.includes('brazil')));
                    });
                    
                    if (countryFilteredResult) {
                        bestResult = countryFilteredResult;
                    }
                }
                
                const lat = parseFloat(bestResult.lat);
                const lng = parseFloat(bestResult.lon);
                
                if (this.map) {
                    this.map.setView([lat, lng], 15);
                    this.updateMarker(lat, lng, bestResult.display_name);
                }
            } else {

                console.log('No se encontraron resultados para la dirección');                // Mantener el mapa en Montevideo por defecto
                if (this.map) {
                    this.map.setView(this.defaultLatLng, 13);
                    // Agregar un marcador temporal indicando que no se encontró la ubicación
                    this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Ubicación no encontrada - Montevideo (por defecto)');
                }
            }
        } catch (error) {
            console.error('Error en geocoding:', error);            // En caso de error, mantener el mapa en la ubicación por defecto

            if (this.map) {
                this.map.setView(this.defaultLatLng, 13);
                this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Error al buscar ubicación - Montevideo (por defecto)');
            }
        }
    }

    private updateMarker(lat: number, lng: number, customTitle?: string) {
        if (!this.map) {
            return;
        }

        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        this.marker = L.marker([lat, lng]).addTo(this.map);
        
        const popupText = customTitle || this.auction.ubicacion || 'Ubicación seleccionada';
        this.marker.bindPopup(popupText).openPopup();
    }

    ngOnInit() {
        this.loading = true;
        const currentUser = this.securityService.actualUser;
        
        if (currentUser && currentUser.id) {
            this.casaId = currentUser.id;
            this.initializeComponent();
        } else {
            this.securityService.getActualUser().subscribe({
                next: (user) => {
                    if (user && user.id) {
                        this.casaId = user.id;
                        this.initializeComponent();
                    } else {
                        this.messageService.clear();
                        this.messageService.add({ 
                            severity: 'error', 
                            summary: 'Error de autenticación', 
                            detail: 'No hay usuario autenticado. Por favor inicie sesión.', 
                            life: 5000,
                            sticky: true
                        });
                        this.loading = false;
                    }
                },
                error: (error) => {
                    this.messageService.clear();
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error de conexión', 
                        detail: 'No se pudo obtener información del usuario. Por favor recargue la página.', 
                        life: 5000,
                        sticky: true
                    });
                    this.loading = false;
                }
            });
        }
    }
      private initializeComponent() {
        this.configureTable();
        this.loadAuctionsData();
        this.loadRematadores();
        this.loadTipos();
    }
    
    configureTable() {
        this.cols = [
            { field: 'tipoSubasta', header: 'Tipo' },
            { field: 'fechaInicio', header: 'Fecha Inicio' },
            { field: 'fechaCierre', header: 'Fecha Cierre' },
            { field: 'ubicacion', header: 'Ubicación' },
            { field: 'estado', header: 'Estado' },
            { field: 'rematador_id', header: 'Rematador' }
        ];
        this.globalFilterFields = this.cols.map(col => col.field);
    }

    loadAuctionsData() {
        this.loading = true;
        
        if (!this.casaId) {
            this.messageService.clear();
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se puede cargar datos sin identificar la casa de remates', 
                life: 3000 
            });
            this.loading = false;
            return; 
        }
        
        this.auctionHouseService.getAuctionsByHouseId(this.casaId.toString())
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data: any) => {
                    if (data && Array.isArray(data.data)) {
                        this.auctions = data.data;
                    } else if (Array.isArray(data)) {
                        this.auctions = data;
                    } else if (typeof data === 'object' && data !== null) {
                        this.auctions = [data];
                    } else {
                        this.auctions = [];
                    }
                },
                error: (error) => {
                    this.auctions = [];
                }
            });
    }
    
    loadRematadores() {
        if (!this.casaId) {
            this.messageService.clear();
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se puede cargar rematadores sin identificar la casa', 
                life: 3000 
            });
            return; 
        }
        
        this.auctionHouseService.getAllAuctioneersByHouse(this.casaId.toString())
            .subscribe({
                next: (response: any) => {
                    if (response && response.data) {
                        this.rematadores = response.data;
                    } else if (Array.isArray(response)) {
                        this.rematadores = response;
                    } else {
                        this.rematadores = [];
                    }
                },
                error: (error) => {
                    this.rematadores = [];
                }            });
    }

    loadTipos() {
        this.loadingTipos = true;
        this.subastaService.getTipos().subscribe({
            next: (tipos) => {
                this.tipos = tipos;
                this.loadingTipos = false;
            },
            error: (error) => {
                console.error('Error al cargar tipos de subasta:', error);
                // Fallback a tipos estáticos si falla la carga del backend
                this.tipos = TIPOS_SUBASTA;
                this.loadingTipos = false;
            }
        });
    }

    openNew() {
        const currentUser = this.securityService.actualUser;

        if (!currentUser || !currentUser.id) {
            this.messageService.clear();
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error de autenticación', 
                detail: 'No se puede crear subastas sin autenticación válida', 
                life: 3000 
            });
            return; 
        }
        
        const casaIdForNewAuction = currentUser.id;
        
        const today = new Date();
        this.minDate = this.formatDateForInputLocal(today);
        this.minEndDate = this.minDate; 
        
        this.auction = {
            id: 0,
            casaDeRemates_id: casaIdForNewAuction, 
            rematador_id: 0,
            mensajes: '',
            urlTransmision: 'https://ejemplo.com/stream',
            tipoSubasta: '',
            estado: 'pendiente',
            pujaHabilitada: false,
            fechaInicio: new Date(),
            fechaCierre: new Date(today.getTime() + 86400000), 
            ubicacion: ''        };
          this.selectedRematador = null;
        this.selectedTipo = null;
        this.dateErrors = { startDate: '', endDate: '' };
        this.submitted = false;
        this.mapVisible = false;
        this.auctionDialog = true;
        
        setTimeout(() => {
            this.initializeMapIfVisible();
        }, 100);
    }
    
    private initializeMapIfVisible() {
        if (this.mapVisible && !this.map) {
            this.initializeMap();
        }
    }
    
    deleteSelectedAuctions() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar la subasta seleccionada?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedAuction) {
                    this.auctions = this.auctions.filter(val => val.id !== this.selectedAuction?.id);
                    this.selectedAuction = null;
                    this.messageService.clear();
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Subasta eliminada', life: 3000 });
                }
            }
        });
    }

    deleteAuction(auction: Subasta) {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar la subasta con ID "${auction.id}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (auction.id) {
                    this.auctionHouseService.deleteAuction(auction.id.toString()).subscribe({
                        next: () => {
                            this.auctions = this.auctions.filter(val => val.id !== auction.id);
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Subasta eliminada correctamente',
                                life: 3000
                            });
                        },
                        error: () => {
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar la subasta',
                                life: 3000
                            });
                        }
                    });
                }
            }
        });
    }
    
    hideDialog() {
        this.auctionDialog = false;
        this.submitted = false;
    }
    
    editAuction(auction: Subasta) {
        if (!this.canEditAuction(auction.estado)) {
            this.messageService.clear();
            this.messageService.add({
                severity: 'warn',
                summary: 'Acción no permitida',
                detail: `No se puede editar una subasta en estado "${auction.estado}"`,
                life: 3000
            });
            return;
        }
        
        const today = new Date();
        this.editMinDate = this.formatDateForInputLocal(today);
        this.editMinEndDate = this.editMinDate;
          this.editingAuction = {
            id: auction.id,
            tipoSubasta: auction.tipoSubasta,
            fechaInicio: this.formatDateForInputLocal(new Date(auction.fechaInicio)),
            fechaCierre: this.formatDateForInputLocal(new Date(auction.fechaCierre)),
            ubicacion: auction.ubicacion
        };
        
        // Seleccionar el tipo correspondiente en el dropdown
        this.selectedEditTipo = this.tipos.find(tipo => tipo.value === auction.tipoSubasta) || null;
        
        this.editSubmitted = false;
        this.editDateErrors = { startDate: '', endDate: '' };
        this.editMapVisible = false;
        this.editAuctionDialog = true;
        
        if (this.editingAuction.ubicacion && this.editingAuction.ubicacion.trim()) {
            this.editMapVisible = true;
            setTimeout(() => {
                this.initializeEditMap();
            }, 100);
        }
    }

    hideEditDialog() {
        this.editAuctionDialog = false;
        this.editSubmitted = false;
        this.editMapVisible = false;
        
        if (this.editMap) {
            this.editMap.remove();
            this.editMap = null;
        }
        if (this.editSearchTimeout) {
            clearTimeout(this.editSearchTimeout);
        }
    }

    validateEditDates(): void {
        const now = new Date();
        const startDate = new Date(this.editingAuction.fechaInicio);
        const endDate = new Date(this.editingAuction.fechaCierre);
        
        this.editDateErrors = { startDate: '', endDate: '' };
        
        if (startDate < now) {
            this.editDateErrors.startDate = 'La fecha de inicio debe ser posterior a la fecha actual';
        } else {
            this.editMinEndDate = this.formatDateForInputLocal(startDate);
        }
        
        if (endDate <= startDate) {
            this.editDateErrors.endDate = 'La fecha de cierre debe ser posterior a la fecha de inicio';
        }
    }

    onEditLocationChange() {
        if (this.editingAuction.ubicacion && this.editingAuction.ubicacion.trim().length > 2) {
            this.editMapVisible = true;
            
            setTimeout(() => {
                if (!this.editMap) {
                    this.initializeEditMap();
                }
            }, 100);
            
            clearTimeout(this.editSearchTimeout);
            this.editSearchTimeout = setTimeout(() => {
                this.searchEditLocation(this.editingAuction.ubicacion);
            }, 800);
        } else {
            this.editMapVisible = false;
        }
    }

    private initializeEditMap() {
        if (this.editMap) {
            this.editMap.remove();
        }
        
        this.editMap = L.map('edit-auction-map').setView(this.defaultLatLng, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.editMap);
        
        if (this.editingAuction.ubicacion && this.editingAuction.ubicacion.trim()) {
            setTimeout(() => {
                this.searchEditLocation(this.editingAuction.ubicacion);
            }, 100);
        }
    }

    private async searchEditLocation(address: string) {
        try {
            const addressLower = address.toLowerCase();
            let searchUrl = '';
            
            const southAmericanCountries = [
                'uruguay', 'brasil', 'brazil', 'chile', 'bolivia', 'paraguay', 
                'colombia', 'venezuela', 'ecuador', 'peru', 'perú', 'guyana', 'suriname'
            ];
            
            const detectedCountry = southAmericanCountries.find(country => 
                addressLower.includes(country)
            );
            
            if (detectedCountry) {
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&addressdetails=1`;
            } else {
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=3&addressdetails=1`;
            }
            
            const response = await fetch(searchUrl);
            const results: any[] = await response.json();
            
            if (results && results.length > 0) {
                let bestResult = results[0];
                
                if (detectedCountry && results.length > 1) {
                    const countryFilteredResult = results.find((result: any) => {
                        const country = result.address?.country?.toLowerCase() || '';
                        return country.includes(detectedCountry);
                    });
                    
                    if (countryFilteredResult) {
                        bestResult = countryFilteredResult;
                    }
                }
                
                const lat = parseFloat(bestResult.lat);
                const lng = parseFloat(bestResult.lon);
                
                if (this.editMap) {
                    this.editMap.setView([lat, lng], 15);
                    this.updateEditMarker(lat, lng, bestResult.display_name);
                }
            } else {
                if (this.editMap) {
                    this.editMap.setView(this.defaultLatLng, 13);
                    this.updateEditMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Ubicación no encontrada');
                }
            }
        } catch (error) {
            if (this.editMap) {
                this.editMap.setView(this.defaultLatLng, 13);
                this.updateEditMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Error al buscar ubicación');
            }
        }
    }

    private updateEditMarker(lat: number, lng: number, customTitle?: string) {
        if (!this.editMap) return;
        
        if (this.editMarker) {
            this.editMap.removeLayer(this.editMarker);
        }
        
        this.editMarker = L.marker([lat, lng]).addTo(this.editMap);
        const popupText = customTitle || this.editingAuction.ubicacion || 'Ubicación seleccionada';
        this.editMarker.bindPopup(popupText).openPopup();
    }    updateAuction() {
        this.editSubmitted = true;
        
        this.validateEditDates();
        
        if (!this.selectedEditTipo || 
            !this.editingAuction.ubicacion?.trim() || 
            !this.editingAuction.fechaInicio || 
            !this.editingAuction.fechaCierre ||
            this.editDateErrors.startDate ||
            this.editDateErrors.endDate) {
            return;
        }
          const updateData = {
            tipoSubasta: this.selectedEditTipo?.value || this.editingAuction.tipoSubasta,
            fechaInicio: this.editingAuction.fechaInicio,
            fechaCierre: this.editingAuction.fechaCierre,
            ubicacion: this.editingAuction.ubicacion
        };
        
        this.loading = true;
        this.auctionHouseService.updateAuction(this.editingAuction.id, updateData)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {                    const index = this.auctions.findIndex(a => a.id === this.editingAuction.id);
                    if (index !== -1) {
                        this.auctions[index] = {
                            ...this.auctions[index],
                            tipoSubasta: this.selectedEditTipo?.value || this.editingAuction.tipoSubasta,
                            fechaInicio: new Date(this.editingAuction.fechaInicio),
                            fechaCierre: new Date(this.editingAuction.fechaCierre),
                            ubicacion: this.editingAuction.ubicacion
                        };
                        this.auctions = [...this.auctions];
                    }
                    
                    this.messageService.clear();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Subasta actualizada correctamente',
                        life: 3000
                    });
                    
                    this.hideEditDialog();
                },
                error: (error) => {
                    this.messageService.clear();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar la subasta',
                        life: 3000
                    });
                }            });
    }
    
    formatDateForInput(date: Date): string {
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    }

    formatDateForInputLocal(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    validateDates(): void {
        const now = new Date();
        const startDate = new Date(this.auction.fechaInicio);
        const endDate = new Date(this.auction.fechaCierre);
        
        this.dateErrors = { startDate: '', endDate: '' };
        
        if (startDate < now) {
            this.dateErrors.startDate = 'La fecha de inicio debe ser posterior a la fecha actual';
        } else {
            this.minEndDate = this.formatDateForInputLocal(startDate);
        }
        
        if (endDate <= startDate) {
            this.dateErrors.endDate = 'La fecha de cierre debe ser posterior a la fecha de inicio';
        }
    }

    saveAuction() {
        this.submitted = true;        this.validateDates();
        
        if (!this.selectedTipo || 
            !this.auction.ubicacion?.trim() || 
            !this.auction.fechaInicio || 
            !this.auction.fechaCierre || 
            !this.selectedRematador ||
            this.dateErrors.startDate ||
            this.dateErrors.endDate) {
            return;
        }
        
        const currentUser = this.securityService.actualUser;

        if (!currentUser || !currentUser.id) {
            this.messageService.clear();
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error de autenticación', 
                detail: 'No se pudo identificar la casa de remates. Por favor inicie sesión nuevamente.', 
                life: 5000,
                sticky: true
            });
            return; 
        }
        
        this.auction.rematador_id = this.selectedRematador.rematador?.id || 0;
        const casaIdToSave = currentUser.id;
          const subastaData = {
            casaDeRemates_id: casaIdToSave, 
            rematador_id: this.auction.rematador_id,
            urlTransmision: this.auction.urlTransmision,
            tipoSubasta: this.selectedTipo.value,
            estado: 'pendiente_aprobacion',
            fechaInicio: this.auction.fechaInicio,
            fechaCierre: this.auction.fechaCierre,
            ubicacion: this.auction.ubicacion,
            mensajes: []
        };
        
        this.loading = true;
        this.auctionHouseService.createAuction(subastaData)
            .pipe(finalize(() => {
                this.loading = false;
            }))
            .subscribe({
                next: (response) => {
                    if (response && response.data) {
                        this.auction.id = response.data.id;
                        this.auctions.push(response.data);
                    } else if (response && response.id) {
                        this.auction.id = response.id;
                        this.auctions.push(response);
                    }
                    
                    this.auctions = [...this.auctions];
                    this.messageService.clear();
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Éxito', 
                        detail: 'Subasta creada correctamente', 
                        life: 3000 
                    });
                      this.auctionDialog = false;
                },
                error: (error) => {
                    this.messageService.clear();
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'No se pudo crear la subasta', 
                        life: 3000 
                    });
                }
            });
    }
    
    findIndexById(id: number): number {
        return this.auctions.findIndex(a => a.id === id);
    }
    
    createId(): number {
        return Math.floor(Math.random() * 100000);
    }
    
    onFilterGlobal(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        if (this.dt) {
            this.dt.filterGlobal(inputElement.value, 'contains');
        }
    }

    onSelectionChange() {
        if (this.selectedAuction && this.selectedAuction.id) {
            this.auctionSelected.emit(this.selectedAuction.id);
        }
    }

    onMapResize() {
        if (this.map) {
            setTimeout(() => {
                this.map?.invalidateSize();
            }, 100);
        }
    }

    viewAuction(auction: Subasta) {
        if (auction.id) {
            this.router.navigate(['/subasta', auction.id], {
                state: { 
                    returnUrl: '/perfil-casa',
                    returnState: { selectedInfoType: 'auctions' }
                }
            });
        }
    }

    canEditAuction(estado: string): boolean {
      const editableStates = ['pendiente', 'pendiente_aprobacion', 'aceptada'];
      return editableStates.includes(estado?.toLowerCase());
    }
}
