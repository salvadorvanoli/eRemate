import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs/operators';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { Lote } from '../../../../core/models/lote';
import { SecurityService } from '../../../../core/services/security.service';
import { RegisteredUsersService } from '../../../../core/services/registered-users.service';

interface LoteConEstado extends Omit<Lote, 'ganador_id'> {
  estado_usuario_lote: 'es_ganador' | 'es_perdedor' | 'sin_ganador';
  ganador_id: number | null;
  puja_maxima: number;
  oferta: number;
  resultado_texto?: string; // Nueva propiedad para búsqueda
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
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule,
    TooltipModule,
    DialogModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './table-lots.component.html',
  styleUrl: './table-lots.component.scss'
})
export class TableLotsComponent implements OnInit {
    lots: LoteConEstado[] = [];
    cols: any[] = [];
    loading = false;
    globalFilterFields: string[] = [];
    
    ratingDialog: boolean = false;
    selectedLot: LoteConEstado | null = null;
    rating: number = 0;
    hasExistingRating: boolean = false;
    
    @Input() userId: number | null = null;
    @ViewChild('dt') dt!: Table;
    
    constructor(
        private messageService: MessageService,
        private registeredUsersService: RegisteredUsersService,
        private securityService: SecurityService,
        private router: Router
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
            { field: 'estado_usuario_lote', header: 'Resultado' }
        ];
        this.globalFilterFields = ['nombre', 'descripcion', 'valorBase', 'resultado_texto'];
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
        
        this.registeredUsersService.getBiddedLotsByUserId(String(userId))
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data: LoteConEstado[]) => {
                    // Agregar el texto del resultado para búsqueda
                    this.lots = data.map(lot => ({
                        ...lot,
                        resultado_texto: this.getResultadoTag(lot.estado_usuario_lote).value
                    }));
                },
                error: (error) => {
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

    getResultadoTag(estado: string) {
        switch (estado) {
            case 'es_ganador':
                return { severity: 'success', value: 'Ganador', icon: 'pi pi-trophy' };
            case 'es_perdedor':
                return { severity: 'danger', value: 'Perdedor', icon: 'pi pi-times-circle' };
            case 'sin_ganador':
                return { severity: 'info', value: 'Sin ganador', icon: 'pi pi-clock' };
            default:
                return { severity: 'secondary', value: 'Desconocido', icon: 'pi pi-question' };
        }
    }

    isWinner(lot: LoteConEstado): boolean {
        return lot.estado_usuario_lote === 'es_ganador';
    }
    
    sendMessage(lote: LoteConEstado) {
        this.router.navigate(['/chat-detail', lote.id]);
    }

    showRating(lote: LoteConEstado) {
        this.selectedLot = lote;
        this.loading = true;
        
        const loteIdString = String(lote.id);
        
        this.registeredUsersService.getRatingByLot(loteIdString)
            .subscribe({
                next: (response) => {
                    if (response === null || 
                        response === undefined || 
                        (Array.isArray(response) && response.length === 0)) {
                        this.rating = 0;
                        this.hasExistingRating = false;
                    } else if (Array.isArray(response) && response.length > 0) {
                        const ratingObj = response[0];
                        
                        if (ratingObj.puntaje !== undefined && ratingObj.puntaje !== null) {
                            this.rating = ratingObj.puntaje;
                            this.hasExistingRating = true;
                        } else {
                            this.rating = 0;
                            this.hasExistingRating = false;
                        }
                    } else {
                        if (response.puntaje !== undefined && response.puntaje !== null) {
                            this.rating = response.puntaje;
                            this.hasExistingRating = true;
                        } else {
                            this.rating = 0;
                            this.hasExistingRating = false;
                        }
                    }
                    
                    this.ratingDialog = true;
                    this.loading = false;
                },
                error: (error) => {
                    this.rating = 0;
                    this.hasExistingRating = false;
                    this.ratingDialog = true;
                    this.loading = false;
                }
            });
    }

    selectRating(stars: number) {
        if (!this.hasExistingRating) {
            this.rating = stars;
        }
    }

    createRating() {
        if (!this.selectedLot || this.hasExistingRating || this.rating === 0) {
            return;
        }

        const currentUser = this.securityService.actualUser;
        const userId = this.userId || (currentUser ? currentUser.id : null);

        if (!userId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Usuario no autenticado',
                life: 3000
            });
            return;
        }

        const ratingData = {
            puntaje: this.rating,
            usuarioRegistrado_id: Number(userId),
            lote_id: parseInt(String(this.selectedLot.id))
        };
        
        this.loading = true;

        this.registeredUsersService.createRating(ratingData)
            .subscribe({
                next: (response) => {
                    this.hasExistingRating = true;
                    this.loading = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Calificación guardada correctamente',
                        life: 3000
                    });
                },
                error: (error) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo guardar la calificación',
                        life: 3000
                    });
                }
            });
    }

    closeRatingDialog() {
        this.ratingDialog = false;
        this.selectedLot = null;
        this.rating = 0;
        this.hasExistingRating = false;
    }
}
