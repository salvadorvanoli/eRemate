import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UsuarioRematador, RematadorResponse } from '../../../../core/models/usuario';
import { SecurityService } from '../../../../core/services/security.service';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { finalize } from 'rxjs/operators';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ToolbarModule,
        FileUploadModule,
        DialogModule,
        ConfirmDialogModule,
        InputTextModule,
        InputNumberModule,
        RatingModule,
        TagModule,
        SelectModule,
        RadioButtonModule,
        TextareaModule,
        IconFieldModule,
        InputIconModule,
        ProgressSpinnerModule
    ],
    providers: [ConfirmationService]
})
export class TableComponent implements OnInit {
    productDialog: boolean = false;
    products: any[] = [];
    product!: any;
    selectedProducts!: any[] | null;
    submitted: boolean = false;
    loading: boolean = false;
    casaId: string | null = null;
    
    @ViewChild('dt') dt!: Table;
    cols!: Column[];
    exportColumns!: ExportColumn[];
    globalFilterFields: string[] = [];
    
    assignDialog: boolean = false;
    rematadorEmail: string = '';
    emailSubmitted: boolean = false;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private securityService: SecurityService,
        private auctionHouseService: AuctionHouseService
    ) {}
    
    ngOnInit() {
        this.configureTable();
        
        // HARDCODEAR el ID de la casa a "1" para desarrollo
        this.casaId = "1";
        console.log('ID de casa HARDCODEADO:', this.casaId);
        
        // Cargar datos con el ID hardcodeado
        this.loadRematadoresData(this.casaId);
        
        // Mantener esto solo para diagnóstico
        const usuario = this.securityService.actualUser;
        console.log('Usuario actual (solo diagnóstico):', usuario);
    }
    
    configureTable() {
        this.cols = [
            { field: 'nombre', header: 'Nombre' },
            { field: 'apellido', header: 'Apellido' },
            { field: 'numeroMatricula', header: 'Matrícula' },
            { field: 'email', header: 'Email' },
            { field: 'telefono', header: 'Teléfono' },
            { field: 'direccionFiscal', header: 'Dirección Fiscal' }
        ];
        
        this.globalFilterFields = this.cols.map(col => col.field);
    }
    
    loadRematadoresData(casaId?: string) {
        if (!casaId) {
            this.loadRematadoresDummyData();
            return;
        }
        
        this.loading = true;
        
        this.auctionHouseService.getAllAuctioneersByHouse(casaId)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response: any) => {
                    console.log('Respuesta completa:', response);
                    
                    if (response && response.success && Array.isArray(response.data)) {
                        // Aplanar la estructura anidada
                        this.products = response.data.map((item: RematadorResponse) => {
                            return {
                                // Del objeto rematador
                                id: item.rematador?.id,
                                nombre: item.rematador?.nombre,
                                apellido: item.rematador?.apellido,
                                numeroMatricula: item.rematador?.numeroMatricula,
                                direccionFiscal: item.rematador?.direccionFiscal,
                                imagen: item.rematador?.imagen,
                                
                                // Del objeto usuario
                                email: item.usuario?.email,
                                telefono: item.usuario?.telefono,
                                tipo: item.usuario?.tipo
                            };
                        });
                        console.log('Datos procesados:', this.products);
                    }
                    else if (response && response.success && response.data && typeof response.data === 'object') {
                        if (response.data.id) {
                            this.products = [response.data];
                        } 
                        else {
                            this.products = Object.values(response.data);
                        }
                    } 
                    else if (Array.isArray(response)) {
                        this.products = response;
                    } 
                    else {
                        console.error('La respuesta de la API no tiene el formato esperado:', response);
                        this.products = []; 
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Formato de datos incorrecto',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    console.error('Error al cargar rematadores:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'No se pudieron cargar los rematadores', 
                        life: 3000 
                    });
                
                }
            });
    }
    
    loadRematadoresDummyData() {
        this.products = [
            {
                id: '1',
                nombre: 'Juan',
                apellido: 'Pérez',
                numeroMatricula: 'R12345',
                email: 'juan.perez@ejemplo.com',
                telefono: '598 99 123 456',
                direccionFiscal: 'Av. Principal 123, Montevideo',
                tipo: 'REMATADOR',
                imagen: 'default-user.png'
            },
            {
                id: '2',
                nombre: 'María',
                apellido: 'González',
                numeroMatricula: 'R67890',
                email: 'maria.gonzalez@ejemplo.com',
                telefono: '598 98 987 654',
                direccionFiscal: 'Calle Secundaria 456, Montevideo',
                tipo: 'REMATADOR',
                imagen: 'default-user.png'
            }
        ];
    }
    
    openNew() {
        this.product = {
            id: '',
            nombre: '',
            apellido: '',
            numeroMatricula: '',
            email: '',
            telefono: '',
            direccionFiscal: '',
            tipo: 'REMATADOR',
            imagen: 'default-user.png'
        };
        this.submitted = false;
        this.productDialog = true;
    }
    
    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar los rematadores seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.products = this.products.filter(val => !this.selectedProducts?.includes(val));
                this.selectedProducts = null;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rematadores eliminados', life: 3000 });
            }
        });
    }
    
    editProduct(product: any) {
        this.product = {...product};
        this.productDialog = true;
    }
    
    deleteProduct(product: any) {
        this.removeRematador(product);
    }
    
    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
    }
    
    saveProduct() {
        this.submitted = true;
        
        if (this.product.nombre?.trim() && this.product.apellido?.trim()) {
            if (this.product.id) {
                this.products[this.findIndexById(this.product.id)] = this.product;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rematador actualizado', life: 3000 });
            } else {
                this.product.id = this.createId();
                this.products.push(this.product);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rematador creado', life: 3000 });
            }
            
            this.products = [...this.products];
            this.productDialog = false;
            this.product = {
                id: '',
                nombre: '',
                apellido: '',
                numeroMatricula: '',
                email: '',
                telefono: '',
                direccionFiscal: '',
                tipo: 'REMATADOR',
                imagen: 'default-user.png'
            };
        }
    }
    
    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.products.length; i++) {
            if (this.products[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }
    
    createId(): string {
        let id = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    
    exportCSV() {
        this.dt.exportCSV();
    }

    onFilterGlobal(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        if (this.dt) {
            this.dt.filterGlobal(inputElement.value, 'contains');
        }
    }
    
    getTableTitle() {
        return 'Gestión de Rematadores';
    }

    getDialogHeader() {
        return 'Detalles del Rematador';
    }

    openAssignDialog() {
        this.rematadorEmail = '';
        this.emailSubmitted = false;
        this.assignDialog = true;
    }

    hideAssignDialog() {
        this.assignDialog = false;
        this.rematadorEmail = '';
        this.emailSubmitted = false;
    }

   assignRematadorByEmail() {
    this.emailSubmitted = true;
    
    if (!this.rematadorEmail?.trim()) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Debe ingresar un email',
            life: 3000
        });
        return;
    }
    
    if (!this.casaId) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se puede identificar la casa de remates',
            life: 3000
        });
        return;
    }
    
    this.loading = true;
    
    try {
        this.auctionHouseService.assignAuctioneerByEmail(this.casaId, this.rematadorEmail.trim())
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Rematador agregado correctamente',
                        life: 3000
                    });
                    this.hideAssignDialog();
                    this.loadRematadoresData(this.casaId!);
                },
                error: (error) => {
                    console.error('Error al agregar rematador:', error);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se encontraron rematadores con ese email.',
                        life: 3000
                    });
                    this.products = [];
                }
            });
    } catch (error) {
        console.error('Error inesperado:', error);
        this.loading = false;
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No hay rematadores',
            life: 3000
        });
        this.products = [];
    }
}

    removeRematador(rematador: any) {
        if (!this.casaId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se puede identificar la casa de remates',
                life: 3000
            });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar a ${rematador.nombre} ${rematador.apellido}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loading = true;
                this.auctionHouseService.removeAuctioneerFromHouse(this.casaId!, rematador.id)
                    .pipe(finalize(() => this.loading = false))
                    .subscribe({
                        next: (response) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: `Rematador eliminado correctamente`,
                                life: 3000
                            });
                            this.loadRematadoresData(this.casaId!);
                        },
                        error: (error) => {
                            console.error('Error al eliminar rematador:', error);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar el rematador',
                                life: 3000
                            });
                        }
                    });
            }
        });
    }
}