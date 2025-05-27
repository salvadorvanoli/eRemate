import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs/operators';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { Lote } from '../../../../core/models/lote';
import { SecurityService } from '../../../../core/services/security.service';
import { RegisteredUsersService } from '../../../../core/services/registered-users.service';

@Component({
  selector: 'app-table-lots',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './table-lots.component.html',
  styleUrl: './table-lots.component.scss'
})
export class TableLotsComponent implements OnInit {
    lots: Lote[] = [];
    cols: any[] = [];
    loading = false;
    globalFilterFields: string[] = [];
    
    @Input() userId: number | null = null;
    @ViewChild('dt') dt!: Table;
    
    constructor(
        private messageService: MessageService,
        private registeredUsersService: RegisteredUsersService,
        private securityService: SecurityService
    ) {}

    ngOnInit() {
        this.configureTable();
        this.loadBiddedLots();
    }
    
    configureTable() {
        this.cols = [
            { field: 'nombre', header: 'Nombre' },
            { field: 'descripcion', header: 'Descripción' },
            { field: 'valorBase', header: 'Valor Base' },
            { field: 'pujaMinima', header: 'Puja Mínima' },
            { field: 'disponibilidad', header: 'Disponibilidad' },
            { field: 'condicionesDeEntrega', header: 'Condiciones' }
        ];
        this.globalFilterFields = this.cols.map(col => col.field);
    }

    loadBiddedLots() {
        this.loading = true;
        
        const currentUser = this.securityService.actualUser;
        const userId = this.userId || (currentUser ? currentUser.id : null);
        
        if (!userId) {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo determinar el ID del usuario', 
                life: 3000 
            });
            this.loading = false;
            return;
        }
        
        this.registeredUsersService.getBiddedLotsByUserId(userId)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data: Lote[]) => {
                    console.log('Lotes con pujas recibidos del servicio:', data);
                    this.lots = data;
                },
                error: (error) => {
                    console.error('Error al cargar lotes con pujas:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'No se pudieron cargar los lotes con pujas', 
                        life: 3000 
                    });
                    this.lots = [];
                }
            });
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
    
    sendMessage(lote: Lote) {
        console.log('Enviar mensaje sobre lote:', lote);
        this.messageService.add({
            severity: 'info',
            summary: 'Acción',
            detail: `Enviar mensaje sobre lote: ${lote.nombre}`,
            life: 3000
        });
    }
    
    toggleFavorite(lote: Lote) {
        console.log('Marcar como favorito:', lote);
        this.messageService.add({
            severity: 'success',
            summary: 'Favorito',
            detail: `Lote "${lote.nombre}" añadido a favoritos`,
            life: 3000
        });
    }
}
