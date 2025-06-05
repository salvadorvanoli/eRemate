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
import { DialogModule } from 'primeng/dialog'; // ✅ AGREGAR ESTA IMPORTACIÓN
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
    TooltipModule,
    DialogModule // ✅ AGREGAR ESTA LÍNEA
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
    
    // ✅ ACTUALIZAR ESTAS PROPIEDADES
    ratingDialog: boolean = false;
    selectedLot: Lote | null = null;
    rating: number = 0; // Cambiar a 0
    hasExistingRating: boolean = false; // Nueva propiedad
    
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
        
        // ✅ CAMBIAR ESTA LÍNEA - convertir a string o number explícitamente
        this.registeredUsersService.getBiddedLotsByUserId(String(userId))
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

    // ✅ ACTUALIZAR ESTE MÉTODO PARA MANEJAR PUNTAJE UNDEFINED
    showRating(lote: Lote) {
        console.log('🚀 [COMPONENT] Iniciando showRating para lote:', lote);
        console.log('🔍 [COMPONENT] ID del lote:', lote.id);
        console.log('🔍 [COMPONENT] Tipo de ID:', typeof lote.id);
        
        this.selectedLot = lote;
        this.loading = true;
        
        const loteIdString = String(lote.id);
        console.log('🔍 [COMPONENT] Lote ID convertido a string:', loteIdString);
        
        this.registeredUsersService.getRatingByLot(loteIdString)
            .subscribe({
                next: (response) => {
                    console.log('✅ [COMPONENT] Rating response recibido:', response);
                    console.log('✅ [COMPONENT] Tipo de response:', typeof response);
                    console.log('✅ [COMPONENT] Es array:', Array.isArray(response));
                    console.log('✅ [COMPONENT] Longitud si es array:', Array.isArray(response) ? response.length : 'N/A');
                    
                    // ✅ VERIFICAR SI ES NULL, ARRAY VACÍO O UNDEFINED
                    if (response === null || 
                        response === undefined || 
                        (Array.isArray(response) && response.length === 0)) {
                        console.log('ℹ️ [COMPONENT] No hay calificación existente (null, undefined o array vacío)');
                        this.rating = 0;
                        this.hasExistingRating = false;
                    } else if (Array.isArray(response) && response.length > 0) {
                        // ✅ SI ES ARRAY CON DATOS, TOMAR EL PRIMER ELEMENTO
                        console.log('✅ [COMPONENT] Calificación existente encontrada en array');
                        const ratingObj = response[0];
                        console.log('✅ [COMPONENT] Objeto del rating completo:', ratingObj);
                        console.log('✅ [COMPONENT] Puntaje directo:', ratingObj.puntaje);
                        console.log('✅ [COMPONENT] Tipo de puntaje:', typeof ratingObj.puntaje);
                        
                        // ✅ VALIDAR QUE PUNTAJE NO SEA UNDEFINED
                        if (ratingObj.puntaje !== undefined && ratingObj.puntaje !== null) {
                            this.rating = ratingObj.puntaje;
                            this.hasExistingRating = true;
                        } else {
                            console.log('⚠️ [COMPONENT] Puntaje es undefined/null, tratando como sin calificación');
                            this.rating = 0;
                            this.hasExistingRating = false;
                        }
                        console.log('✅ [COMPONENT] Rating extraído del array:', ratingObj);
                    } else {
                        // ✅ SI ES OBJETO DIRECTO
                        console.log('✅ [COMPONENT] Calificación existente encontrada como objeto');
                        console.log('✅ [COMPONENT] Objeto del rating completo:', response);
                        console.log('✅ [COMPONENT] Puntaje directo:', response.puntaje);
                        console.log('✅ [COMPONENT] Tipo de puntaje:', typeof response.puntaje);
                        
                        // ✅ VALIDAR QUE PUNTAJE NO SEA UNDEFINED
                        if (response.puntaje !== undefined && response.puntaje !== null) {
                            this.rating = response.puntaje;
                            this.hasExistingRating = true;
                        } else {
                            console.log('⚠️ [COMPONENT] Puntaje es undefined/null, tratando como sin calificación');
                            this.rating = 0;
                            this.hasExistingRating = false;
                        }
                    }
                    
                    this.ratingDialog = true;
                    this.loading = false;
                    console.log('✅ [COMPONENT] Estado actualizado - rating:', this.rating, 'hasExisting:', this.hasExistingRating);
                },
                error: (error) => {
                    console.log('ℹ️ [COMPONENT] Error al obtener rating (probablemente no existe):', error.status);
                    this.rating = 0;
                    this.hasExistingRating = false;
                    this.ratingDialog = true;
                    this.loading = false;
                    console.log('✅ [COMPONENT] Estado para nuevo rating - rating:', this.rating, 'hasExisting:', this.hasExistingRating);
                }
            });
    }

    // ✅ AGREGAR MÉTODO PARA SELECCIONAR RATING
    selectRating(stars: number) {
        if (!this.hasExistingRating) {
            this.rating = stars;
        }
    }

    // ✅ AGREGAR MÉTODO PARA CREAR RATING
    createRating() {
        console.log('🚀 [COMPONENT] Iniciando createRating...');
        console.log('🔍 [COMPONENT] selectedLot:', this.selectedLot);
        console.log('🔍 [COMPONENT] hasExistingRating:', this.hasExistingRating);
        console.log('🔍 [COMPONENT] rating:', this.rating);
        
        if (!this.selectedLot || this.hasExistingRating || this.rating === 0) {
            console.log('❌ [COMPONENT] Validación falló - no se puede crear rating');
            return;
        }

        const currentUser = this.securityService.actualUser;
        console.log('🔍 [COMPONENT] currentUser para crear rating:', currentUser);
        
        const userId = this.userId || (currentUser ? currentUser.id : null);
        console.log('🔍 [COMPONENT] userId para crear rating:', userId);

        if (!userId) {
            console.error('❌ [COMPONENT] No hay usuario autenticado');
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Usuario no autenticado',
                life: 3000
            });
            return;
        }

        // ✅ CORREGIR LOS NOMBRES DE CAMPOS SEGÚN EL BACKEND
        const ratingData = {
            puntaje: this.rating, // ✅ CAMBIAR de puntuacion a puntaje
            usuarioRegistrado_id: Number(userId), // ✅ CAMBIAR de usuario_id a usuarioRegistrado_id
            lote_id: parseInt(String(this.selectedLot.id))
        };

        console.log('🔍 [COMPONENT] Datos del rating a enviar (CORREGIDOS):', ratingData);
        console.log('🔍 [COMPONENT] Tipos: lote_id:', typeof ratingData.lote_id, 'usuarioRegistrado_id:', typeof ratingData.usuarioRegistrado_id, 'puntaje:', typeof ratingData.puntaje);
        
        this.loading = true;

        this.registeredUsersService.createRating(ratingData)
            .subscribe({
                next: (response) => {
                    console.log('✅ [COMPONENT] Rating creado exitosamente:', response);
                    this.hasExistingRating = true;
                    this.loading = false;
                    console.log('✅ [COMPONENT] Estado actualizado después de crear');
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Calificación guardada correctamente',
                        life: 3000
                    });
                },
                error: (error) => {
                    console.error('❌ [COMPONENT] Error al crear rating:', error);
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

    // ✅ ACTUALIZAR MÉTODO PARA RESETEAR ESTADO
    closeRatingDialog() {
        this.ratingDialog = false;
        this.selectedLot = null;
        this.rating = 0;
        this.hasExistingRating = false;
    }
}
