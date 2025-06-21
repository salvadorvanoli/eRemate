import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
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
import { AccordionModule } from 'primeng/accordion';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextarea} from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs/operators';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { Lote } from '../../../../core/models/lote';
import { Articulo } from '../../../../core/models/articulo';
import { AddItemComponent } from '../add-item/add-item.component';
import { SecurityService } from '../../../../core/services/security.service';
import { ItemService } from '../../../../core/services/item.service';
import { Router } from '@angular/router';

interface Lot {
    id: string;
    subasta: string;
    lote: string;
    descripcion: string;
    vendedorExterno: string;
    valorBase: number;
    incrementoMinimo: number;
    condicionesEntrega: string; 
    articulos: Articulo[];
    disponibilidad?: string;
    tieneGanador?: boolean;
    esEditable?: boolean;
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
    InputNumberModule,
    AccordionModule,
    FileUploadModule,
    InputTextarea,
    TooltipModule,
    AddItemComponent,
    RadioButtonModule,
    DropdownModule
  ],
  providers: [ConfirmationService],
  templateUrl: './table-lots.component.html',
  styleUrl: './table-lots.component.scss'
})
export class TableLotsComponent implements OnInit, OnChanges {
    lots: Lot[] = [];
    cols: any[] = [];
    loading = false;
    lotDialog: boolean = false;
    lot!: Lot;
    selectedLots: Lot | null = null;
    submitted: boolean = false;
    globalFilterFields: string[] = [];
    
    @Input() auctionId: number | null = null;
    @ViewChild('dt') dt!: Table;

    articleDialog: boolean = false;
    currentArticle: Articulo = {
      nombre: '', 
      lote_id: 0,
      imagenes: [],
      estado: '',
      especificacionesTecnicas: ''
    };
    editingArticleIndex: number = -1;
    submittedArticle: boolean = false;
    
    articlesManagementDialog: boolean = false;
    selectedLotForArticles: Lot | null = null;
    
    vendedorExternoOption: string = '';

    editLotDialog: boolean = false;
    editingLot: any = {};
    editSubmittedLot: boolean = false;
    
    resetImagesTrigger: boolean = false;
    
    readonly MAX_IMAGES = 5;
    
    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private auctionHouseService: AuctionHouseService,
        private securityService: SecurityService,
        private itemService: ItemService,
        public router: Router
    ) {}

    ngOnInit() {
        this.configureTable();
        
        const currentUser = this.securityService.actualUser;
        if (!currentUser) {
        }
    }
    
    ngOnChanges(changes: SimpleChanges) {
        if (changes['auctionId'] && changes['auctionId'].currentValue) {
            const newAuctionId = changes['auctionId'].currentValue;
            this.loadLotsByAuctionId(newAuctionId);
        }
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

    loadLotsByAuctionId(auctionId: number) {
        this.loading = true;
        this.auctionHouseService.getLotsByAuctionId(auctionId.toString())
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data: any) => {
                    let lots: any[] = [];
                    if (data && Array.isArray(data.data)) {
                        lots = data.data;
                    } else if (Array.isArray(data)) {
                        lots = data;
                    } else if (typeof data === 'object' && data !== null) {
                        lots = [data];
                    } else {
                        lots = [];
                    }
                    
                    this.lots = lots.map(lot => ({
                        id: lot.id?.toString() || '',
                        subasta: lot.subasta_id?.toString() || '',
                        lote: lot.nombre || '',
                        descripcion: lot.descripcion || '',
                        vendedorExterno: lot.vendedorExterno === 1 ? 'Sí' : 'No',
                        valorBase: lot.valorBase || 0,
                        incrementoMinimo: lot.pujaMinima || 0,
                        condicionesEntrega: lot.condicionesDeEntrega || '',
                        disponibilidad: lot.disponibilidad || '',
                        articulos: lot.articulos || [],
                        tieneGanador: false,
                        esEditable: true
                    }));
                    
                    this.loadLotStatuses();
                },
                error: (error) => {
                    this.lots = [];
                }
            });
    }

    loadLotStatuses() {
        this.lots.forEach(lot => {
            this.auctionHouseService.getLotStatus(lot.id)
                .subscribe({
                    next: (status) => {
                        lot.tieneGanador = status.tieneGanador || false;
                        lot.esEditable = status.esEditable !== false;
                    },
                    error: (error) => {
                        lot.tieneGanador = false;
                        lot.esEditable = true;
                    }
                });
        });
    }

    onSelectionChange() {
    }

    editArticlesForLot(lot: Lot) {
        if (!lot.esEditable) return;
        
        this.selectedLotForArticles = {...lot};
        this.loading = true;
        
        this.auctionHouseService.getItemsByLotId(lot.id)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response: any) => {
                    let articulos: Articulo[] = [];
                    
                    if (Array.isArray(response)) {
                        articulos = response;
                    } else if (response && typeof response === 'object' && !response.data) {
                        articulos = [response as Articulo];
                    } else if (response && response.data && Array.isArray(response.data)) {
                        articulos = response.data;
                    } else if (response && response.data && typeof response.data === 'object') {
                        articulos = [response.data as Articulo];
                    }
                    
                    articulos = articulos.map(art => ({
                        id: art.id,
                        nombre: art.nombre || 'Sin nombre',
                        lote_id: art.lote_id || parseInt(lot.id),
                        imagenes: art.imagenes || [],
                        estado: art.estado || '',
                        especificacionesTecnicas: art.especificacionesTecnicas || '',
                        categoria_id: art.categoria_id,
                        categoria: art.categoria
                    }));
                    
                    this.selectedLotForArticles!.articulos = articulos;
                    this.articlesManagementDialog = true;
                },
                error: (error) => {
                    if (error.status && error.status !== 404) {
                        this.messageService.clear();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudieron cargar los artículos del lote',
                            life: 3000
                        });
                    }
                    
                    this.selectedLotForArticles!.articulos = [];
                    this.articlesManagementDialog = true;
                }
            });
    }
    
    openArticlesDialog() {
        if (this.selectedLots && this.selectedLots.esEditable) {
            const selectedLot = this.selectedLots;            
            this.selectedLotForArticles = {...selectedLot};
            this.loading = true;
            
            this.auctionHouseService.getItemsByLotId(selectedLot.id)
                .pipe(finalize(() => this.loading = false))
                .subscribe({
                    next: (response: any) => {
                        let articulos: Articulo[] = [];
                        
                        if (Array.isArray(response)) {
                            articulos = response;
                        } else if (response && typeof response === 'object' && !response.data) {
                            articulos = [response as Articulo];
                        } else if (response && response.data && Array.isArray(response.data)) {
                            articulos = response.data;
                        } else if (response && response.data && typeof response.data === 'object') {
                            articulos = [response.data as Articulo];
                        }
                        
                        articulos = articulos.map(art => ({
                            id: art.id,
                            nombre: art.nombre || 'Sin nombre',
                            lote_id: art.lote_id || parseInt(selectedLot.id),
                            imagenes: art.imagenes || [],
                            estado: art.estado || '',
                            especificacionesTecnicas: art.especificacionesTecnicas || '',
                            categoria_id: art.categoria_id,
                            categoria: art.categoria
                        }));
                        
                        this.selectedLotForArticles!.articulos = articulos;
                        this.articlesManagementDialog = true;
                    },
                    error: (error) => {
                        if (error.status && error.status !== 404) {
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudieron cargar los artículos del lote',
                                life: 3000
                            });
                        }
                        
                        this.selectedLotForArticles!.articulos = [];
                        this.articlesManagementDialog = true;
                    }
                });
        }
    }
    
    hideArticlesDialog() {
        this.articlesManagementDialog = false;
        this.selectedLotForArticles = null;
    }
    
    saveArticleChanges() {
        if (this.selectedLotForArticles) {
            const index = this.findIndexById(this.selectedLotForArticles.id);
            if (index >= 0) {
                this.lots[index].articulos = [...this.selectedLotForArticles.articulos];
                this.messageService.clear();
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Artículos actualizados correctamente', 
                    life: 3000 
                });
            }
        }
        this.articlesManagementDialog = false;
        this.selectedLotForArticles = null;
    }
      
    addNewArticle() {
      this.articleDialog = false;
      setTimeout(() => {
        this.submittedArticle = false;
        this.editingArticleIndex = -1;
        
        // Crear un artículo completamente nuevo
        this.currentArticle = {
          nombre: '',
          lote_id: this.selectedLotForArticles?.id ? parseInt(this.selectedLotForArticles.id) : 0,
          imagenes: [],
          estado: '',
          especificacionesTecnicas: '',
          categoria_id: undefined,
          categoria: undefined
        };
        
        // Forzar reinicio del componente de imágenes
        this.resetImagesTrigger = true;
        setTimeout(() => {
          this.resetImagesTrigger = false;
          this.articleDialog = true;
        }, 150);
      }, 100);
    }

    openNew() {
        this.lot = {
            id: '',
            subasta: this.auctionId?.toString() || '',
            lote: '',
            descripcion: '',
            vendedorExterno: '',
            valorBase: 0,
            incrementoMinimo: 0,
            condicionesEntrega: '', 
            articulos: [],
            disponibilidad: '' 
        };
        this.vendedorExternoOption = ''; 
        this.submitted = false;
        this.lotDialog = true;
    }    editArticle(index: number) {
      if (!this.selectedLotForArticles) return;

      this.submittedArticle = false;
      this.editingArticleIndex = index;

      const articuloOriginal = this.selectedLotForArticles.articulos[index];
      
      // Crear una copia completamente nueva del artículo para evitar referencias
      this.currentArticle = {
        id: articuloOriginal.id,
        nombre: articuloOriginal.nombre || '',
        lote_id: articuloOriginal.lote_id,
        imagenes: articuloOriginal.imagenes ? [...articuloOriginal.imagenes] : [],
        estado: articuloOriginal.estado || '',
        especificacionesTecnicas: articuloOriginal.especificacionesTecnicas || '',
        categoria_id: articuloOriginal.categoria_id,
        categoria: articuloOriginal.categoria ? {...articuloOriginal.categoria} : undefined
      };

      // Forzar reinicio del componente de imágenes
      this.resetImagesTrigger = true;
      setTimeout(() => {
        this.resetImagesTrigger = false;
        this.articleDialog = true;
      }, 150);
    }

    // Método para verificar si se pueden agregar más imágenes
    canAddMoreImages(): boolean {
      return this.currentArticle.imagenes.length < this.MAX_IMAGES;
    }

    // Método para obtener el número de imágenes restantes que se pueden agregar
    getRemainingImageSlots(): number {
      return this.MAX_IMAGES - this.currentArticle.imagenes.length;
    }

    // Método para eliminar una imagen específica del artículo actual
    removeImageFromCurrentArticle(index: number): void {
      if (this.currentArticle.imagenes && index >= 0 && index < this.currentArticle.imagenes.length) {
        this.currentArticle.imagenes.splice(index, 1);
      }
    }

    saveArticle(articulo?: Articulo) {
        this.submittedArticle = true;
        
        const articuloToSave: Articulo = articulo ? {...articulo} : {...this.currentArticle};
        
        if (!articuloToSave.nombre?.trim() || 
            !articuloToSave.estado?.trim() || 
            !articuloToSave.especificacionesTecnicas?.trim() || 
            !articuloToSave.categoria_id ||
            !articuloToSave.imagenes || 
            articuloToSave.imagenes.length === 0 ||
            !this.selectedLotForArticles) {
            
            let errorMessage = 'Todos los campos del artículo son obligatorios, incluyendo la categoría';
            if (!articuloToSave.imagenes || articuloToSave.imagenes.length === 0) {
                errorMessage += ' y al menos una imagen';
            }
            
            this.messageService.clear();
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 3000
            });
            
            return;
        }

        articuloToSave.lote_id = parseInt(this.selectedLotForArticles.id);
        
        this.loading = true;
        
        if (this.editingArticleIndex >= 0 && this.selectedLotForArticles.articulos[this.editingArticleIndex].id) {
            const articuloId = this.selectedLotForArticles.articulos[this.editingArticleIndex].id!;
            
            const updateData = {
              nombre: articuloToSave.nombre,
              estado: articuloToSave.estado,
              especificacionesTecnicas: articuloToSave.especificacionesTecnicas,
              categoria_id: articuloToSave.categoria_id,
              lote_id: articuloToSave.lote_id,
              imagenes: articuloToSave.imagenes || []
            };
            
            this.auctionHouseService.updateItem(articuloId, updateData)
                .pipe(finalize(() => this.loading = false))
                .subscribe({
                    next: (response) => {
                        this.messageService.clear();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Artículo actualizado correctamente',
                            life: 3000
                        });
                        
                        this.selectedLotForArticles!.articulos[this.editingArticleIndex] = {
                            id: articuloId,
                            nombre: articuloToSave.nombre,
                            lote_id: articuloToSave.lote_id,
                            imagenes: articuloToSave.imagenes || [],
                            estado: articuloToSave.estado,
                            especificacionesTecnicas: articuloToSave.especificacionesTecnicas,
                            categoria_id: articuloToSave.categoria_id,
                            categoria: articuloToSave.categoria
                        };
                        
                        this.articleDialog = false;
                    },
                    error: (error) => {
                        this.messageService.clear();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo actualizar el artículo',
                            life: 3000
                        });
                    }
                });
        } else {
            const createData = {
              nombre: articuloToSave.nombre,
              estado: articuloToSave.estado,
              especificacionesTecnicas: articuloToSave.especificacionesTecnicas,
              categoria_id: articuloToSave.categoria_id,
              lote_id: articuloToSave.lote_id,
              imagenes: articuloToSave.imagenes || []
            };
            
            this.auctionHouseService.createItem(createData)
                .pipe(finalize(() => this.loading = false))
                .subscribe({
                    next: (response) => {
                        const nuevoArticulo: Articulo = {
                            id: response.id || Date.now(),
                            nombre: articuloToSave.nombre,
                            lote_id: articuloToSave.lote_id,
                            imagenes: articuloToSave.imagenes || [],
                            estado: articuloToSave.estado,
                            especificacionesTecnicas: articuloToSave.especificacionesTecnicas,
                            categoria_id: articuloToSave.categoria_id,
                            categoria: articuloToSave.categoria
                        };
                        
                        if (!this.selectedLotForArticles!.articulos) {
                            this.selectedLotForArticles!.articulos = [];
                        }
                        
                        this.selectedLotForArticles!.articulos.push(nuevoArticulo);
                        
                        this.articleDialog = false;
                        
                        setTimeout(() => {
                          this.currentArticle = Object.assign({}, {
                            nombre: '',
                            lote_id: this.selectedLotForArticles?.id ? parseInt(this.selectedLotForArticles.id) : 0,
                            imagenes: [],
                            estado: '',
                            especificacionesTecnicas: '',
                            categoria_id: undefined,
                            categoria: undefined
                          });
                          
                          this.submittedArticle = false;
                          this.editingArticleIndex = -1;
                        }, 300);
                        
                        this.messageService.clear();
                        this.messageService.add({
                          severity: 'success',
                          summary: 'Éxito',
                          detail: 'Artículo agregado correctamente',
                          life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.clear();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo crear el artículo',
                            life: 3000
                        });
                    }
                });
        }
    }
    
    deleteSelectedLots() {
        if (!this.selectedLots) {
            this.messageService.clear();
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Advertencia', 
                detail: 'Debe seleccionar un lote para eliminar', 
                life: 3000 
            });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar el lote "${this.selectedLots.lote}"?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Aceptar',
            rejectLabel: 'Cancelar',
            accept: () => {
                const lotToDelete = this.selectedLots!;
                this.lots = this.lots.filter(val => val.id !== lotToDelete.id);
                this.selectedLots = null;
                this.messageService.clear();
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Lote eliminado', 
                    life: 3000 
                });
            }
        });
    }

    deleteLot(lot: Lot) {
        if (!lot.esEditable) return;
        
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar el lote?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Aceptar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.loading = true;
                
                this.auctionHouseService.deleteLot(lot.id)
                    .pipe(finalize(() => this.loading = false))
                    .subscribe({
                        next: (response) => {
                            this.lots = this.lots.filter(val => val.id !== lot.id);
                            
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Lote eliminado correctamente',
                                life: 3000
                            });
                        },
                        error: (error) => {
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar el lote',
                                life: 3000
                            });
                        }
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
      
      if (!this.lot.lote?.trim() || 
          !this.lot.descripcion?.trim() ||
          !this.vendedorExternoOption || 
          !this.lot.valorBase || 
          this.lot.valorBase <= 0 ||
          !this.lot.incrementoMinimo || 
          this.lot.incrementoMinimo <= 0 ||
          !this.lot.disponibilidad?.trim() || 
          !this.lot.condicionesEntrega?.trim()) {
          this.messageService.clear();
          this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Por favor complete todos los campos requeridos correctamente', 
              life: 3000 
          });
          return;
      }
      
      this.lot.vendedorExterno = this.vendedorExternoOption;
      
      if (this.auctionId) {
          this.lot.subasta = this.auctionId.toString();
      }
      
      if (this.lot.articulos && this.lot.articulos.length > 0) {
          const invalidArticles = this.lot.articulos.filter(a => !a.nombre.trim());
          if (invalidArticles.length > 0) {
            this.messageService.clear();
              this.messageService.add({ 
                  severity: 'error', 
                  summary: 'Error', 
                  detail: 'Todos los artículos deben tener un nombre', 
                  life: 3000 
              });
              return;
          }
      }
      
      const lotToSave = {
          subasta_id: parseInt(this.lot.subasta),
          nombre: this.lot.lote,
          descripcion: this.lot.descripcion,
          vendedorExterno: this.vendedorExternoOption === 'Sí' ? 1 : 0,
          valorBase: this.lot.valorBase,
          pujaMinima: this.lot.incrementoMinimo,
          disponibilidad: this.lot.disponibilidad,
          condicionesDeEntrega: this.lot.condicionesEntrega, 
          articulos: this.lot.articulos
      };

      this.loading = true;

      if (this.lot.id) {
          const index = this.findIndexById(this.lot.id);
          this.lots[index] = this.lot;
          this.messageService.clear();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lote actualizado', life: 3000 });
          this.lots = [...this.lots];
          this.lotDialog = false;
          this.lot = {
              id: '',
              subasta: '',
              lote: '',
              descripcion: '',
              vendedorExterno: '',
              valorBase: 0,
              incrementoMinimo: 0,
              condicionesEntrega: '', 
              articulos: []
          };
          this.loading = false;
      } else {
          this.auctionHouseService.createLot(lotToSave)
              .pipe(finalize(() => {
                  this.loading = false;
              }))
              .subscribe({
                  next: (response) => {
                    this.messageService.clear();
                      this.messageService.add({ 
                          severity: 'success', 
                          summary: 'Éxito', 
                          detail: 'Lote creado correctamente', 
                          life: 3000 
                      });
                      
                      if (this.auctionId) {
                          this.loadLotsByAuctionId(this.auctionId);
                      }
                      
                      this.lotDialog = false;
                      this.lot = {
                          id: '',
                          subasta: '',
                          lote: '',
                          descripcion: '',
                          vendedorExterno: '',
                          valorBase: 0,
                          incrementoMinimo: 0,
                          condicionesEntrega: '', 
                          articulos: []
                      };
                  },
                  error: (error) => {
                    this.messageService.clear();
                      this.messageService.add({ 
                          severity: 'error', 
                          summary: 'Error', 
                          detail: 'No se pudo crear el lote', 
                          life: 3000 
                      });
                  }
              });
      }
    }
    
    editLot(lot: Lot) {
        if (!lot.esEditable) return;
        
        this.editingLot = {
            id: lot.id,
            nombre: lot.lote,
            descripcion: lot.descripcion,
            valorBase: lot.valorBase,
            pujaMinima: lot.incrementoMinimo,
            disponibilidad: lot.disponibilidad,
            condicionesDeEntrega: lot.condicionesEntrega
        };
        
        this.editSubmittedLot = false;
        this.editLotDialog = true;
    }

    hideEditLotDialog() {
        this.editLotDialog = false;
        this.editSubmittedLot = false;
    }

    updateLot() {
        this.editSubmittedLot = true;
        
        if (!this.editingLot.nombre?.trim() || 
            !this.editingLot.descripcion?.trim() || 
            !this.editingLot.valorBase || 
            this.editingLot.valorBase <= 0 ||
            !this.editingLot.pujaMinima || 
            this.editingLot.pujaMinima <= 0 ||
            !this.editingLot.disponibilidad?.trim() || 
            !this.editingLot.condicionesDeEntrega?.trim()) {
            
            return;
        }
        
        const updateData = {
            nombre: this.editingLot.nombre,
            descripcion: this.editingLot.descripcion,
            valorBase: this.editingLot.valorBase,
            pujaMinima: this.editingLot.pujaMinima,
            disponibilidad: this.editingLot.disponibilidad,
            condicionesDeEntrega: this.editingLot.condicionesDeEntrega
        };
        
        this.loading = true;
        this.auctionHouseService.updateLot(this.editingLot.id, updateData)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {
                    const index = this.lots.findIndex(l => l.id === this.editingLot.id);
                    if (index !== -1) {
                        this.lots[index] = {
                            ...this.lots[index],
                            lote: this.editingLot.nombre,
                            descripcion: this.editingLot.descripcion,
                            valorBase: this.editingLot.valorBase,
                            incrementoMinimo: this.editingLot.pujaMinima,
                            disponibilidad: this.editingLot.disponibilidad,
                            condicionesEntrega: this.editingLot.condicionesDeEntrega
                        };
                        this.lots = [...this.lots];
                    }
                    this.messageService.clear();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Lote actualizado correctamente',
                        life: 3000
                    });
                    
                    this.hideEditLotDialog();
                },
                error: (error) => {
                    this.messageService.clear();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el lote',
                        life: 3000
                    });
                }
            });
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

    removeArticle(index: number) {
        if (!this.selectedLotForArticles) return;
        
        const articulo = this.selectedLotForArticles.articulos[index];
        
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar este artículo?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Aceptar',
            rejectLabel: 'Cancelar',
            accept: () => {
                if (!articulo.id) {
                    this.selectedLotForArticles!.articulos.splice(index, 1);
                    return;
                }
                
                this.loading = true;
                
                this.auctionHouseService.removeItemFromLot(this.selectedLotForArticles!.id, articulo.id)
                    .pipe(finalize(() => this.loading = false))
                    .subscribe({
                        next: (response) => {
                            this.selectedLotForArticles!.articulos.splice(index, 1);
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Artículo eliminado correctamente',
                                life: 3000
                            });
                        },
                        error: (error) => {
                            this.messageService.clear();
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar el artículo',
                                life: 3000
                            });
                        }
                    });
            }
        });
    }    // Métodos adicionales para pasar al componente AddItem
    onImageRemoved = (index: number) => {
        this.removeImageFromCurrentArticle(index);
    };

    onImagesUpdated = (images: string[]) => {
        this.currentArticle.imagenes = [...images];
    };

    hasEditableLots(): boolean {
        return this.lots.length === 0 || this.lots.some(lot => lot.esEditable === true);
    }
}
