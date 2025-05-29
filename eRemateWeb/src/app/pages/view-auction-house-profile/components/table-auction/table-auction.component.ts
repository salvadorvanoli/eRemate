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
import { finalize } from 'rxjs/operators';
import * as L from 'leaflet';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { Subasta } from '../../../../core/models/subasta';
import { UsuarioRematador, RematadorResponse } from '../../../../core/models/usuario';
import { SecurityService } from '../../../../core/services/security.service';


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
    ProgressSpinnerModule,
    DatePipe  
  ],
  providers: [ConfirmationService],
  templateUrl: './table-auction.component.html',
  styleUrl: './table-auction.component.scss'
})
export class TableAuctionComponent implements OnInit, AfterViewInit, OnDestroy {    auctions: Subasta[] = [];
    cols: any[] = [];
    loading = false;
    auctionDialog: boolean = false;
    auction!: Subasta;
    selectedAuction: Subasta | null = null;
    submitted: boolean = false;
    globalFilterFields: string[] = [];
    rematadorEmail: string = '';
    emailError: string = '';
    rematadores: RematadorResponse[] = [];
    casaId: number | null = null; 
    
    minDate: string = '';
    minEndDate: string = '';
    dateErrors: { startDate: string, endDate: string } = { startDate: '', endDate: '' };
      // Leaflet Map properties
    private map: L.Map | null = null;
    private marker: L.Marker | null = null;
    mapVisible: boolean = false;
    private searchTimeout: any;
    private defaultLatLng: [number, number] = [-34.6037, -58.3816]; // Buenos Aires por defecto

    @ViewChild('dt') dt!: Table;
    @Output() auctionSelected = new EventEmitter<number>();

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private auctionHouseService: AuctionHouseService,
        private securityService: SecurityService
    ) {        console.log('[CONSTRUCTOR] SecurityService actualUser:', this.securityService.actualUser);
    }

    ngAfterViewInit() {
        // Se ejecuta después de que la vista se inicializa
    }

    ngOnDestroy() {
        // Limpiar el mapa y timeouts al destruir el componente
        if (this.map) {
            this.map.remove();
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }    onLocationChange() {
        console.log('onLocationChange llamado con:', this.auction.ubicacion);
        
        if (this.auction.ubicacion && this.auction.ubicacion.trim().length > 2) {
            // Mostrar el mapa inmediatamente con ubicación por defecto
            this.mapVisible = true;
            
            // Inicializar el mapa si no existe
            setTimeout(() => {
                if (!this.map) {
                    this.initializeMap();
                }
            }, 100);
            
            // Debounce la búsqueda para evitar demasiadas llamadas a la API
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchLocation(this.auction.ubicacion);
            }, 800);
        } else {
            this.mapVisible = false;
        }
    }

    initializeMap() {
        console.log('Inicializando mapa Leaflet...');
        
        // Configurar iconos de Leaflet para corregir iconos faltantes
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Crear el mapa
        this.map = L.map('auction-map').setView(this.defaultLatLng, 13);

        // Agregar la capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        console.log('Mapa Leaflet inicializado correctamente');

        // Si ya hay una ubicación, buscarla
        if (this.auction.ubicacion && this.auction.ubicacion.trim()) {
            setTimeout(() => {
                this.searchLocation(this.auction.ubicacion);
            }, 100);
        }
    }    private async searchLocation(address: string) {
        console.log('Buscando ubicación:', address);
        
        try {
            // Detectar si se especifica un país en la dirección
            const addressLower = address.toLowerCase();
            let searchUrl = '';
            
            // Lista de países de América del Sur para detectar
            const southAmericanCountries = [
                'uruguay', 'brasil', 'brazil', 'chile', 'bolivia', 'paraguay', 
                'colombia', 'venezuela', 'ecuador', 'peru', 'perú', 'guyana', 'suriname'
            ];
            
            const detectedCountry = southAmericanCountries.find(country => 
                addressLower.includes(country)
            );
            
            if (detectedCountry) {
                // Si se detecta un país específico, buscar sin restricción de país
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&addressdetails=1`;
                console.log(`País detectado: ${detectedCountry}, buscando sin restricción geográfica`);
            } else {
                // Si no se especifica país, priorizar Argentina
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=3&addressdetails=1`;
                console.log('No se detectó país específico, priorizando Argentina');
            }
            
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error('Error en la respuesta de Nominatim');
            }
            
            const results: any[] = await response.json();
            console.log('Resultado de geocoding:', results);
            
            if (results && results.length > 0) {
                // Si se detectó un país, filtrar resultados por ese país
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
                        console.log('Resultado filtrado por país:', bestResult);
                    }
                }
                
                const lat = parseFloat(bestResult.lat);
                const lng = parseFloat(bestResult.lon);
                
                console.log('Nueva ubicación encontrada:', { 
                    lat, 
                    lng, 
                    display_name: bestResult.display_name,
                    country: bestResult.address?.country 
                });
                
                // Actualizar la vista del mapa
                if (this.map) {
                    this.map.setView([lat, lng], 15);
                    this.updateMarker(lat, lng, bestResult.display_name);
                }
            } else {
                console.log('No se encontraron resultados para la dirección');
                // Mantener el mapa en Buenos Aires por defecto
                if (this.map) {
                    this.map.setView(this.defaultLatLng, 13);
                    // Agregar un marcador temporal indicando que no se encontró la ubicación
                    this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Ubicación no encontrada - Buenos Aires (por defecto)');
                }
            }
        } catch (error) {
            console.error('Error en geocoding:', error);
            // En caso de error, mantener el mapa en la ubicación por defecto
            if (this.map) {
                this.map.setView(this.defaultLatLng, 13);
                this.updateMarker(this.defaultLatLng[0], this.defaultLatLng[1], 'Error al buscar ubicación - Buenos Aires (por defecto)');
            }
        }
    }    private updateMarker(lat: number, lng: number, customTitle?: string) {
        if (!this.map) {
            console.log('Mapa no está disponible para agregar marcador');
            return;
        }

        // Limpiar marcador anterior
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        // Crear nuevo marcador
        this.marker = L.marker([lat, lng]).addTo(this.map);
        
        // Agregar popup con la dirección
        const popupText = customTitle || this.auction.ubicacion || 'Ubicación seleccionada';
        this.marker.bindPopup(popupText).openPopup();
        
        console.log('Marcador agregado en:', { lat, lng });
    }

    ngOnInit() {
        this.loading = true;
        console.log('[NGONINIT_START] Intentando obtener usuario. Current securityService.actualUser:', this.securityService.actualUser);
        const currentUser = this.securityService.actualUser;
        
        if (currentUser && currentUser.id) {
            this.casaId = currentUser.id;
            console.log(`[NGONINIT_BEHAVIORSUBJECT_SUCCESS] ID de casa obtenido del BehaviorSubject: ${this.casaId}. User:`, currentUser);
            this.initializeComponent();
        } else {
            console.log('[NGONINIT_BEHAVIORSUBJECT_FAIL] No hay usuario en BehaviorSubject o no tiene ID. User:', currentUser);
            this.securityService.getActualUser().subscribe({
                next: (user) => {
                    console.log('[NGONINIT_API_RESPONSE] Respuesta de getActualUser API:', user);
                    if (user && user.id) {
                        this.casaId = user.id;
                        console.log(`[NGONINIT_API_SUCCESS] ID de casa obtenido de la API: ${this.casaId}. User:`, user);
                        this.initializeComponent();
                    } else {
                        console.error('[NGONINIT_API_FAIL] ERROR CRÍTICO: No se pudo obtener el usuario o no tiene ID desde API. User:', user);
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
                    console.error('[NGONINIT_API_ERROR] ERROR CRÍTICO: Error al obtener usuario:', error);
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
        console.log(`[INITIALIZE_COMPONENT] Iniciando con casaId: ${this.casaId}`);
        this.configureTable();
        this.loadAuctionsData();
        this.loadRematadores();
        this.loading = false; 
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
        console.log(`[LOAD_AUCTIONS_DATA_START] Cargando subastas para casaId: ${this.casaId}`);
        
        if (!this.casaId) {
            console.error('[LOAD_AUCTIONS_DATA_ERROR] ERROR CRÍTICO: Intentando cargar subastas sin ID de casa válido');
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
                    console.log('Respuesta de getAuctionsByHouseId:', data);

                    if (data && Array.isArray(data.data)) {
                        this.auctions = data.data;
                    } else if (Array.isArray(data)) {
                        this.auctions = data;
                    } else if (typeof data === 'object' && data !== null) {
                        this.auctions = [data];
                    } else {
                        this.auctions = [];
                    }

                    console.log('Valor final de this.auctions:', this.auctions);
                },
                error: () => {
                    this.auctions = [];
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las subastas', life: 3000 });
                }
            });
    }
    
    loadRematadores() {
        console.log(`[LOAD_REMATADORES_START] Cargando rematadores para casaId: ${this.casaId}`);
        if (!this.casaId) {
            console.error('[LOAD_REMATADORES_ERROR] ERROR CRÍTICO: Intentando cargar rematadores sin ID de casa válido');
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
                    console.log('Rematadores cargados:', this.rematadores);
                },
                error: (error) => {
                    console.error('Error al cargar rematadores:', error);
                    this.rematadores = [];
                }
            });
    }
      openNew() {
        console.log('[OPEN_NEW_START] Abriendo nuevo diálogo de subasta.');
        const currentUser = this.securityService.actualUser;
        console.log('[OPEN_NEW] securityService.actualUser al abrir diálogo:', currentUser);

        if (!currentUser || !currentUser.id) {
            console.error('[OPEN_NEW_ERROR] ERROR CRÍTICO: No hay usuario autenticado o sin ID al crear nueva subasta. User:', currentUser);
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error de autenticación', 
                detail: 'No se puede crear subastas sin autenticación válida', 
                life: 3000 
            });
            return; 
        }
        
        const casaIdForNewAuction = currentUser.id;
        console.log(`[OPEN_NEW] ID de casa para nueva subasta (desde currentUser.id): ${casaIdForNewAuction}`);
        
        const today = new Date();
        this.minDate = this.formatDateForInput(today);
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
            ubicacion: ''
        };        this.rematadorEmail = '';
        this.emailError = '';
        this.dateErrors = { startDate: '', endDate: '' };
        this.submitted = false;
        this.mapVisible = false; // Reset map visibility
        this.auctionDialog = true;
        
        // Inicializar el mapa después de que el diálogo se abra
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
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Subasta eliminada correctamente',
                                life: 3000
                            });
                        },
                        error: () => {
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
    
    findRematadorByEmail(email: string): number | null {
        console.log('Buscando email:', email);
        console.log('Rematadores disponibles:', this.rematadores);
        
        const rematador = this.rematadores.find(r => r.usuario?.email === email);
        
        if (rematador) {
            console.log('Rematador encontrado:', rematador);
            return rematador.rematador?.id || null;
        }
        
        return null;
    }
    
    formatDateForInput(date: Date): string {
        return date.toISOString().slice(0, 16); 
    }


    validateDates(): void {
        const now = new Date();
        const startDate = new Date(this.auction.fechaInicio);
        const endDate = new Date(this.auction.fechaCierre);
        
        this.dateErrors = { startDate: '', endDate: '' };
        
 
        if (startDate < now) {
            this.dateErrors.startDate = 'La fecha de inicio debe ser posterior a la fecha actual';
        } else {
 
            this.minEndDate = this.formatDateForInput(startDate);
        }
 
        if (endDate <= startDate) {
            this.dateErrors.endDate = 'La fecha de cierre debe ser posterior a la fecha de inicio';
        }
    }

    saveAuction() {
        this.submitted = true;
        this.emailError = '';
        console.log('[SAVE_AUCTION_START] Iniciando guardado de subasta.');
        console.log('[SAVE_AUCTION_START] this.auction (antes de obtener currentUser):', JSON.parse(JSON.stringify(this.auction)));
        console.log('[SAVE_AUCTION_START] this.rematadorEmail:', this.rematadorEmail);
        

        this.validateDates();
        
        if (!this.auction.tipoSubasta?.trim() || 
            !this.auction.ubicacion?.trim() || 
            !this.auction.fechaInicio || 
            !this.auction.fechaCierre || 
            !this.rematadorEmail?.trim() ||
            this.dateErrors.startDate ||
            this.dateErrors.endDate) {
            console.warn('[SAVE_AUCTION_VALIDATION_FAIL] Faltan campos requeridos o hay errores de validación.');
            return;
        }
        
        const rematadorId = this.findRematadorByEmail(this.rematadorEmail);
        console.log(`[SAVE_AUCTION] Resultado de findRematadorByEmail: ${rematadorId}`);
        
        if (!rematadorId) {
            this.emailError = 'No se encontró un rematador con ese email';
            console.warn('[SAVE_AUCTION_REMATADOR_FAIL] No se encontró rematador con email:', this.rematadorEmail);
            return;
        }
        
        const currentUser = this.securityService.actualUser;
        console.log('[SAVE_AUCTION] securityService.actualUser (obtenido justo antes de usar su ID):', currentUser);
        

        if (!currentUser || !currentUser.id) {
            console.error('⛔ [SAVE_AUCTION_USER_ID_FAIL] ERROR CRÍTICO: No hay usuario autenticado o no tiene ID. User:', currentUser);
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error de autenticación', 
                detail: 'No se pudo identificar la casa de remates. Por favor inicie sesión nuevamente.', 
                life: 5000,
                sticky: true
            });
            return; 
        }
        
        this.auction.rematador_id = rematadorId;
        console.log(`[SAVE_AUCTION] this.auction.rematador_id asignado: ${this.auction.rematador_id}`);
 
        const casaIdToSave = currentUser.id;
        console.log(`🔴 [SAVE_AUCTION_CASA_ID_VERIFIED] ID DE CASA VERIFICADO ANTES DE CREAR SUBASTA (currentUser.id): ${casaIdToSave}`);
        
       
        const subastaData = {
            casaDeRemates_id: casaIdToSave, 
            rematador_id: this.auction.rematador_id,
            urlTransmision: this.auction.urlTransmision,
            tipoSubasta: this.auction.tipoSubasta,
            estado: 'pendiente_aprobacion',
            fechaInicio: this.auction.fechaInicio,
            fechaCierre: this.auction.fechaCierre,
            ubicacion: this.auction.ubicacion,
            mensajes: [] 
        };
        
        console.log('[SAVE_AUCTION_SUBMIT_DATA] Datos de subasta a crear (ID casa FINAL):', subastaData);
        
       
        this.loading = true;
        this.auctionHouseService.createAuction(subastaData)
            .pipe(finalize(() => {
                this.loading = false;
                console.log('[SAVE_AUCTION_FINALIZE] Finalizó la llamada a createAuction.');
            }))
            .subscribe({
                next: (response) => {
                    console.log('[SAVE_AUCTION_SUCCESS] Respuesta del servidor:', response);
                    
                 
                    if (response && response.data) {
                        this.auction.id = response.data.id;
                        this.auctions.push(response.data);
                    } else if (response && response.id) {
                        this.auction.id = response.id;
                        this.auctions.push(response);
                    }
                    
                    this.auctions = [...this.auctions];
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Éxito', 
                        detail: 'Subasta creada correctamente', 
                        life: 3000 
                    });
                    
                    this.auctionDialog = false;
                    this.rematadorEmail = '';
                },
                error: (error) => {
                    console.error('Error al crear subasta:', error);
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
        console.log('Selección cambiada:', this.selectedAuction);
        

        if (this.selectedAuction && this.selectedAuction.id) {
            console.log('Emitiendo ID de subasta seleccionada:', this.selectedAuction.id);
            this.auctionSelected.emit(this.selectedAuction.id);
        }
    }

    onMapResize() {
        // Invalidar el tamaño del mapa cuando la ventana cambia de tamaño
        if (this.map) {
            setTimeout(() => {
                this.map?.invalidateSize();
            }, 100);
        }
    }
}
