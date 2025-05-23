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
import { InputNumberModule } from 'primeng/inputnumber';
import { finalize } from 'rxjs/operators';

interface Lot {
    id: string;
    subasta: string;
    lote: string;
    vendedorExterno: string;
    valorBase: number;
    incrementoMinimo: number;
}

@Component({
  selector: 'app-table-lots',
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
    InputNumberModule
  ],
  providers: [ConfirmationService],
  templateUrl: './table-lots.component.html',
  styleUrl: './table-lots.component.scss'
})
export class TableLotsComponent implements OnInit {
    lots: Lot[] = [];
    cols: any[] = [];
    loading = false;
    lotDialog: boolean = false;
    lot!: Lot;
    selectedLots: Lot[] | null = null;
    submitted: boolean = false;
    globalFilterFields: string[] = [];
    
    @ViewChild('dt') dt!: Table;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.configureTable();
        this.loadLotsData();
    }
    
    configureTable() {
        this.cols = [
            { field: 'subasta', header: 'Subasta' },
            { field: 'lote', header: 'Lote' },
            { field: 'vendedorExterno', header: 'Vendedor Externo' },
            { field: 'valorBase', header: 'Valor Base' },
            { field: 'incrementoMinimo', header: 'Incremento Mínimo' }
        ];
        this.globalFilterFields = this.cols.map(col => col.field);
    }

    loadLotsData() {
        this.loading = true;
        setTimeout(() => {
            this.lots = [
                {
                    id: '1',
                    subasta: 'Subasta de Arte Moderno',
                    lote: 'Pintura al óleo "Paisaje Marino"',
                    vendedorExterno: 'Galería Arte Siglo XX',
                    valorBase: 5000,
                    incrementoMinimo: 500
                },
                {
                    id: '2',
                    subasta: 'Subasta de Antigüedades',
                    lote: 'Mueble estilo Luis XV',
                    vendedorExterno: 'Anticuario Rossi',
                    valorBase: 8000,
                    incrementoMinimo: 1000
                },
                {
                    id: '3',
                    subasta: 'Subasta de Arte Moderno',
                    lote: 'Escultura en bronce "Figura abstracta"',
                    vendedorExterno: 'Coleccionista privado',
                    valorBase: 12000,
                    incrementoMinimo: 1500
                }
            ];
            this.loading = false;
        }, 500);
    }
    
    openNew() {
        this.lot = {
            id: '',
            subasta: '',
            lote: '',
            vendedorExterno: '',
            valorBase: 0,
            incrementoMinimo: 0
        };
        this.submitted = false;
        this.lotDialog = true;
    }
    
    deleteSelectedLots() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar los lotes seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.lots = this.lots.filter(val => !this.selectedLots?.includes(val));
                this.selectedLots = null;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lotes eliminados', life: 3000 });
            }
        });
    }

    deleteLot(lot: Lot) {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar el lote "${lot.lote}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.lots = this.lots.filter(val => val.id !== lot.id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Lote eliminado correctamente',
                    life: 3000
                });
            }
        });
    }
    
    hideDialog() {
        this.lotDialog = false;
        this.submitted = false;
    }
    
    saveLot() {
        this.submitted = true;
        
        if (this.lot.lote?.trim()) {
            if (this.lot.id) {
                const index = this.findIndexById(this.lot.id);
                this.lots[index] = this.lot;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lote actualizado', life: 3000 });
            } else {
                this.lot.id = this.createId();
                this.lots.push(this.lot);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lote creado', life: 3000 });
            }
            
            this.lots = [...this.lots];
            this.lotDialog = false;
            this.lot = {
                id: '',
                subasta: '',
                lote: '',
                vendedorExterno: '',
                valorBase: 0,
                incrementoMinimo: 0
            };
        }
    }
    
    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.lots.length; i++) {
            if (this.lots[i].id === id) {
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
    
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-UY', {
            style: 'currency',
            currency: 'UYU'
        }).format(value);
    }
}
