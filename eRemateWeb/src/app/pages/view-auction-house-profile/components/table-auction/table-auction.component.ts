import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { Subasta } from '../../../../core/models/subasta';
import { UsuarioRematador, RematadorResponse } from '../../../../core/models/usuario';

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
    ProgressSpinnerModule
  ],
  providers: [ConfirmationService],
  templateUrl: './table-auction.component.html',
  styleUrl: './table-auction.component.scss'
})
export class TableAuctionComponent implements OnInit {
    auctions: Subasta[] = [];
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
    casaId: number = 1; // ID hardcodeado de la casa de remates
    
    @ViewChild('dt') dt!: Table;

 
    @Output() auctionSelected = new EventEmitter<number>();

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private auctionHouseService: AuctionHouseService
    ) {}

    ngOnInit() {
        this.configureTable();
        this.loadAuctionsData();
        this.loadRematadores();
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
        this.auctionHouseService.getAuctionsByHouseId('1')
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data: any) => {
                    console.log('Respuesta de getAuctionsByHouseId:', data);

                 
                    if (data && Array.isArray(data.data)) {
                        this.auctions = data.data;
                    }
                  
                    else if (Array.isArray(data)) {
                        this.auctions = data;
                    }
                
                    else if (typeof data === 'object' && data !== null) {
                        this.auctions = [data];
                    }
                  
                    else {
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
        this.auction = {
            casaDeRemates_id: this.casaId,
            rematador_id: 0,
            mensajes: '',
            urlTransmision: 'https://ejemplo.com/stream',
            tipoSubasta: '',
            estado: 'pendiente',
            pujaHabilitada: false,
            fechaInicio: new Date(),
            fechaCierre: new Date(),
            ubicacion: ''
        };
        this.rematadorEmail = '';
        this.emailError = '';
        this.submitted = false;
        this.auctionDialog = true;
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
        
        // Busca el rematador con ese email en el objeto usuario
        const rematador = this.rematadores.find(r => r.usuario?.email === email);
        
        if (rematador) {
            console.log('Rematador encontrado:', rematador);
            return rematador.rematador?.id || null;
        }
        
        return null;
    }
    
    saveAuction() {
        this.submitted = true;
        this.emailError = '';
        
        // Validar campos requeridos
        if (!this.auction.tipoSubasta?.trim() || !this.auction.ubicacion?.trim() || 
            !this.auction.fechaInicio || !this.auction.fechaCierre || !this.rematadorEmail?.trim()) {
            return;
        }
        
        // Buscar el ID del rematador por email
        const rematadorId = this.findRematadorByEmail(this.rematadorEmail);
        
        if (!rematadorId) {
            this.emailError = 'No se encontró un rematador con ese email';
            return;
        }
        
        // Asignar el ID del rematador encontrado
        this.auction.rematador_id = rematadorId;
        
        // Preparar datos para enviar
        const subastaData = {
            casaDeRemates_id: this.casaId,
            rematador_id: this.auction.rematador_id,
            urlTransmision: this.auction.urlTransmision,
            tipoSubasta: this.auction.tipoSubasta,
            estado: 'pendiente',
            fechaInicio: this.auction.fechaInicio,
            fechaCierre: this.auction.fechaCierre,
            ubicacion: this.auction.ubicacion,
            mensajes: []
        };
        
        console.log('Datos de subasta a crear:', subastaData);
        
        // Llamar al servicio para crear la subasta
        this.loading = true;
        this.auctionHouseService.createAuction(subastaData)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {
                    console.log('Respuesta del servidor:', response);
                    
                    // Actualizar la interfaz
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

    // Agregar este método para detectar cambios en la selección
    onSelectionChange() {
        console.log('Selección cambiada:', this.selectedAuction);
        
        // Si hay una subasta seleccionada, emitir su ID
        if (this.selectedAuction && this.selectedAuction.id) {
            console.log('Emitiendo ID de subasta seleccionada:', this.selectedAuction.id);
            this.auctionSelected.emit(this.selectedAuction.id);
        }
    }
}
