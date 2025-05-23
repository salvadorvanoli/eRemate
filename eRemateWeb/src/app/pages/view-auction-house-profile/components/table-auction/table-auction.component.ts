import { Component, OnInit, ViewChild } from '@angular/core';
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

interface Auction {
    id: string;
    subasta: string;
    fecha: string;
    casa: string;
    ubicacion: string;
    estado: string;
    rematador: string;
}

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
    auctions: Auction[] = [];
    cols: any[] = [];
    loading = false;
    auctionDialog: boolean = false;
    auction!: Auction;
    selectedAuctions: Auction[] | null = null;
    submitted: boolean = false;
    globalFilterFields: string[] = [];
    
    @ViewChild('dt') dt!: Table;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.configureTable();
        this.loadAuctionsData();
    }
    
    configureTable() {
        this.cols = [
            { field: 'subasta', header: 'Subasta' },
            { field: 'fecha', header: 'Fecha' },
            { field: 'casa', header: 'Casa de subastas' },
            { field: 'ubicacion', header: 'Ubicación' },
            { field: 'estado', header: 'Estado' },
            { field: 'rematador', header: 'Rematador' }
        ];
        this.globalFilterFields = this.cols.map(col => col.field);
    }

    loadAuctionsData() {
        this.loading = true;
        setTimeout(() => {
            this.auctions = [
                {
                    id: '1',
                    subasta: 'Subasta de Arte Moderno',
                    fecha: '10/06/2025',
                    casa: 'Casa Central',
                    ubicacion: 'Montevideo',
                    estado: 'Activa',
                    rematador: 'Juan Pérez'
                },
                {
                    id: '2',
                    subasta: 'Subasta de Antigüedades',
                    fecha: '15/06/2025',
                    casa: 'Galería Sur',
                    ubicacion: 'Punta del Este',
                    estado: 'Programada',
                    rematador: 'María González'
                }
            ];
            this.loading = false;
        }, 500);
    }
    
    openNew() {
        this.auction = {
            id: '',
            subasta: '',
            fecha: '',
            casa: '',
            ubicacion: '',
            estado: '',
            rematador: ''
        };
        this.submitted = false;
        this.auctionDialog = true;
    }
    
    deleteSelectedAuctions() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar las subastas seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.auctions = this.auctions.filter(val => !this.selectedAuctions?.includes(val));
                this.selectedAuctions = null;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Subastas eliminadas', life: 3000 });
            }
        });
    }

    deleteAuction(auction: Auction) {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar la subasta "${auction.subasta}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.auctions = this.auctions.filter(val => val.id !== auction.id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Subasta eliminada correctamente',
                    life: 3000
                });
            }
        });
    }
    
    hideDialog() {
        this.auctionDialog = false;
        this.submitted = false;
    }
    
    saveAuction() {
        this.submitted = true;
        
        if (this.auction.subasta?.trim()) {
            if (this.auction.id) {
                const index = this.findIndexById(this.auction.id);
                this.auctions[index] = this.auction;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Subasta actualizada', life: 3000 });
            } else {
                this.auction.id = this.createId();
                this.auctions.push(this.auction);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Subasta creada', life: 3000 });
            }
            
            this.auctions = [...this.auctions];
            this.auctionDialog = false;
            this.auction = {
                id: '',
                subasta: '',
                fecha: '',
                casa: '',
                ubicacion: '',
                estado: '',
                rematador: ''
            };
        }
    }
    
    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.auctions.length; i++) {
            if (this.auctions[i].id === id) {
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
    
    onFilterGlobal(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        if (this.dt) {
            this.dt.filterGlobal(inputElement.value, 'contains');
        }
    }
}
