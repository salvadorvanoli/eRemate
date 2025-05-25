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
import { finalize } from 'rxjs/operators';
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { Lote } from '../../../../core/models/lote';
import { Articulo } from '../../../../core/models/articulo';
import { AddItemComponent } from '../add-item/add-item.component';


interface Lot {
    id: string;
    subasta: string;
    lote: string;
    vendedorExterno: string;
    valorBase: number;
    incrementoMinimo: number;
    condicionesEntrega: string; 
    articulos: Articulo[];
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
    AddItemComponent
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
    selectedLots: Lot[] | null = null;
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
    
    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private auctionHouseService: AuctionHouseService
    ) {}

    ngOnInit() {
        this.configureTable();
    }
    
    ngOnChanges(changes: SimpleChanges) {
        if (changes['auctionId'] && changes['auctionId'].currentValue) {
            const newAuctionId = changes['auctionId'].currentValue;
            console.log('Cambió ID de subasta:', newAuctionId);
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
                    console.log('Respuesta de getLotsByAuctionId:', data);
                    
                    if (data && Array.isArray(data.data)) {
                        this.lots = data.data;
                    } else if (Array.isArray(data)) {
                        this.lots = data;
                    } else if (typeof data === 'object' && data !== null) {
                        this.lots = [data];
                    } else {
                        this.lots = [];
                    }
                },
                error: (error) => {
                    console.error('Error al cargar lotes:', error);
                    this.lots = [];
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los lotes', life: 3000 });
                }
            });
    }
    

    openArticlesDialog() {
        if (this.selectedLots && this.selectedLots.length === 1) {
            const selectedLot = this.selectedLots[0];
            
            
            this.selectedLotForArticles = {...selectedLot};
            this.loading = true;
            
            
            this.auctionHouseService.getItemsByLotId(selectedLot.id)
                .pipe(finalize(() => this.loading = false))
                .subscribe({
                    next: (response: any) => {
                        console.log('Respuesta original de artículos:', response);
                        
                 
                        let articulos: Articulo[] = [];
                        
                       
                        if (Array.isArray(response)) {
                            articulos = response;
                        }
                       
                        else if (response && typeof response === 'object' && !response.data) {
                            articulos = [response as Articulo];
                        }
                
                        else if (response && response.data && Array.isArray(response.data)) {
                            articulos = response.data;
                        }
                       
                        else if (response && response.data && typeof response.data === 'object') {
                            articulos = [response.data as Articulo];
                        }
                        
                        console.log('Artículos procesados como array:', articulos);
                        
                      
                        this.selectedLotForArticles!.articulos = articulos;
                        this.articlesManagementDialog = true;
                    },
                    error: (error) => {
                        console.error('Error al cargar artículos:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudieron cargar los artículos del lote',
                            life: 3000
                        });
                        
                        this.selectedLotForArticles!.articulos = [];
                        this.articlesManagementDialog = true;
                    }
                });
        }
    }
    
 
    editArticlesForLot(lot: Lot) {
        this.selectedLotForArticles = {...lot};
        this.loading = true;
        
        console.log('🔍 CARGANDO ARTÍCULOS PARA LOTE:', lot.id);
        
        
        this.auctionHouseService.getItemsByLotId(lot.id)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response: any) => {
                    console.log('📦 RESPUESTA ORIGINAL:', JSON.stringify(response));
                    
                  
                    let articulos: Articulo[] = [];
                    
                    
                    if (Array.isArray(response)) {
                        articulos = response;
                        console.log('✅ RESPUESTA ES ARRAY');
                    }
                   
                    else if (response && typeof response === 'object' && !response.data) {
                        articulos = [response as Articulo];
                        console.log('✅ RESPUESTA ES OBJETO SIMPLE');
                    }
                  
                    else if (response && response.data && Array.isArray(response.data)) {
                        articulos = response.data;
                        console.log('✅ RESPUESTA TIENE DATA ARRAY');
                    }
                    
                    else if (response && response.data && typeof response.data === 'object') {
                        articulos = [response.data as Articulo];
                        console.log('✅ RESPUESTA TIENE DATA OBJETO');
                    }
                    
                    console.log('📋 ARTÍCULOS PROCESADOS:', JSON.stringify(articulos));
                    console.log('📋 ARTÍCULOS NOMBRES:', articulos.map(a => a.nombre));
                    
                   
                    articulos = articulos.map(art => ({
                        id: art.id,
                        nombre: art.nombre || 'Sin nombre',
                        lote_id: art.lote_id || parseInt(lot.id),
                        imagenes: art.imagenes || [],
                        estado: art.estado || '',
                        especificacionesTecnicas: art.especificacionesTecnicas || ''
                    }));
                    
                   
                    this.selectedLotForArticles!.articulos = articulos;
                    console.log('📋 ARTÍCULOS FINALES:', this.selectedLotForArticles!.articulos);
                    
                    this.articlesManagementDialog = true;
                },
                error: (error) => {
                    console.error('❌ ERROR AL CARGAR ARTÍCULOS:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar los artículos del lote',
                        life: 3000
                    });
                    
                    this.selectedLotForArticles!.articulos = [];
                    this.articlesManagementDialog = true;
                }
            });
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
        this.submittedArticle = false;
        this.currentArticle = {
            nombre: '',
            lote_id: 0,
            imagenes: [],
            estado: '',
            especificacionesTecnicas: ''
        };
        this.editingArticleIndex = -1;
        this.articleDialog = true;
    }

    openNew() {
        this.lot = {
            id: '',
            subasta: this.auctionId?.toString() || '',
            lote: '',
            vendedorExterno: '',
            valorBase: 0,
            incrementoMinimo: 0,
            condicionesEntrega: '', 
            articulos: []
        };
        this.submitted = false;
        this.lotDialog = true;
    }
    
  
    editArticle(index: number) {
        if (!this.selectedLotForArticles) return;
        
        this.submittedArticle = false;
        this.editingArticleIndex = index;
       
        this.currentArticle = {...this.selectedLotForArticles.articulos[index]};
        
       
        if (!this.currentArticle.estado) {
            this.currentArticle.estado = '';
        }
        if (!this.currentArticle.imagenes) {
            this.currentArticle.imagenes = [];
        }
        
        this.articleDialog = true;
    }

    
    saveArticle(articulo?: Articulo) {
        this.submittedArticle = true;
        
        console.log('⬇️ saveArticle RECIBIÓ:', articulo);
        
        
        const articuloToSave: Articulo = articulo ? {...articulo} : {...this.currentArticle};
        
        console.log('🔄 ARTÍCULO A GUARDAR:', articuloToSave);
        
        if (!articuloToSave.nombre?.trim() || !this.selectedLotForArticles) {
            console.error('❌ ERROR: Nombre vacío o lote no seleccionado');
            return;
        }
        
    
        articuloToSave.lote_id = parseInt(this.selectedLotForArticles.id);
        
     
        articuloToSave.imagenes = ["https://picsum.photos/id/237/200/300"];
        
        this.loading = true;
        
        console.log('📤 ENVIANDO AL BACKEND:', articuloToSave);
        
        if (this.editingArticleIndex >= 0 && this.selectedLotForArticles.articulos[this.editingArticleIndex].id) {
     
            const articuloId = this.selectedLotForArticles.articulos[this.editingArticleIndex].id!;
            
            this.auctionHouseService.updateItem(articuloId, articuloToSave)
                .pipe(finalize(() => this.loading = false))
                .subscribe({
                    next: (response) => {
                        console.log('✅ Artículo actualizado con éxito:', response);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Artículo actualizado correctamente',
                            life: 3000
                        });
                        
                     
                        this.selectedLotForArticles!.articulos[this.editingArticleIndex] = {
                            ...response,
                            especificacionesTecnicas: articuloToSave.especificacionesTecnicas
                        };
                        this.articleDialog = false;
                    },
                    error: (error) => {
                        console.error('❌ Error al actualizar artículo:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo actualizar el artículo',
                            life: 3000
                        });
                    }
                });
        } else {
          
            console.log('🆕 CREANDO NUEVO ARTÍCULO');
            this.auctionHouseService.createItem(articuloToSave)
                .pipe(finalize(() => this.loading = false))
                .subscribe({
                    next: (response) => {
                        console.log('✅ ARTÍCULO CREADO CON ÉXITO:', response);
                        
                       
                        const nuevoArticulo: Articulo = {
                            id: response.id || 0,
                            nombre: response.nombre || articuloToSave.nombre || 'Sin nombre',
                            lote_id: response.lote_id || articuloToSave.lote_id,
                            imagenes: response.imagenes || articuloToSave.imagenes || [],
                            estado: response.estado || articuloToSave.estado || '',
                            especificacionesTecnicas: response.especificacionesTecnicas || articuloToSave.especificacionesTecnicas || ''
                        };
                        
                        console.log('🆕 NUEVO ARTÍCULO ESTRUCTURADO:', nuevoArticulo);
                        
                        // Asegurarse de que el array de artículos existe
                        if (!this.selectedLotForArticles!.articulos) {
                            this.selectedLotForArticles!.articulos = [];
                        }
                        
                        // Añadir el artículo al array
                        this.selectedLotForArticles!.articulos.push(nuevoArticulo);
                        
                        console.log('📋 ARRAY DE ARTÍCULOS ACTUALIZADO:', 
                            this.selectedLotForArticles!.articulos);
                        
                        this.articleDialog = false;
                        
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Artículo agregado correctamente',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        console.error('❌ Error al crear artículo:', error);
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
                // Mostrar indicador de carga
                this.loading = true;
                
                // Llamar al servicio para eliminar el lote en el backend
                this.auctionHouseService.deleteLot(lot.id)
                    .pipe(finalize(() => this.loading = false))
                    .subscribe({
                        next: (response) => {
                            console.log('Lote eliminado con éxito:', response);
                            
                            // Eliminar el lote de la lista local
                            this.lots = this.lots.filter(val => val.id !== lot.id);
                            
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Lote eliminado correctamente',
                                life: 3000
                            });
                        },
                        error: (error) => {
                            console.error('Error al eliminar lote:', error);
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
      
      if (!this.lot.lote?.trim()) {
          return;
      }
      
      // Asigna el ID de la subasta seleccionada
      if (this.auctionId) {
          this.lot.subasta = this.auctionId.toString();
      }
      
      // Verificar que los artículos tengan nombre
      if (this.lot.articulos && this.lot.articulos.length > 0) {
          const invalidArticles = this.lot.articulos.filter(a => !a.nombre.trim());
          if (invalidArticles.length > 0) {
              this.messageService.add({ 
                  severity: 'error', 
                  summary: 'Error', 
                  detail: 'Todos los artículos deben tener un nombre', 
                  life: 3000 
              });
              return;
          }
      }
      
      // Preparar el objeto lote para enviar al servidor
      const lotToSave = {
          subasta_id: parseInt(this.lot.subasta),
          nombre: this.lot.lote,
          descripcion: this.lot.vendedorExterno || '', // Usando vendedorExterno como descripción
          valorBase: this.lot.valorBase,
          pujaMinima: this.lot.incrementoMinimo,
          disponibilidad: 'Disponible', // Valor predeterminado
          condicionesDeEntrega: this.lot.condicionesEntrega, 
          articulos: this.lot.articulos
      };

      this.loading = true;

      if (this.lot.id) {
        
          const index = this.findIndexById(this.lot.id);
          this.lots[index] = this.lot;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lote actualizado', life: 3000 });
          this.lots = [...this.lots];
          this.lotDialog = false;
          this.lot = {
              id: '',
              subasta: '',
              lote: '',
              vendedorExterno: '',
              valorBase: 0,
              incrementoMinimo: 0,
              condicionesEntrega: '', // Inicializar con valor vacío
              articulos: []
          };
          this.loading = false;
      } else {
          // Usar el servicio para crear lote
          this.auctionHouseService.createLot(lotToSave)
              .pipe(finalize(() => {
                  this.loading = false;
              }))
              .subscribe({
                  next: (response) => {
                      this.messageService.add({ 
                          severity: 'success', 
                          summary: 'Éxito', 
                          detail: 'Lote creado correctamente', 
                          life: 3000 
                      });
                      
                      // Recargar lotes para mostrar el nuevo lote
                      if (this.auctionId) {
                          this.loadLotsByAuctionId(this.auctionId);
                      }
                      
                      this.lotDialog = false;
                      this.lot = {
                          id: '',
                          subasta: '',
                          lote: '',
                          vendedorExterno: '',
                          valorBase: 0,
                          incrementoMinimo: 0,
                          condicionesEntrega: '', // Inicializar con valor vacío
                          articulos: []
                      };
                  },
                  error: (error) => {
                      console.error('Error al crear lote:', error);
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

    // Eliminar un artículo
    removeArticle(index: number) {
        if (!this.selectedLotForArticles) return;
        
        const articulo = this.selectedLotForArticles.articulos[index];
        
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar este artículo?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // Si el artículo no tiene ID, es porque no se ha guardado en el backend
                if (!articulo.id) {
                    this.selectedLotForArticles!.articulos.splice(index, 1);
                    return;
                }
                
                // Mostrar indicador de carga
                this.loading = true;
                
                // Llamar al servicio para eliminar el artículo en el backend
                this.auctionHouseService.removeItemFromLot(this.selectedLotForArticles!.id, articulo.id)
                    .pipe(finalize(() => this.loading = false))
                    .subscribe({
                        next: (response) => {
                            console.log('Artículo eliminado con éxito:', response);
                            
                            // Eliminar el artículo de la lista local
                            this.selectedLotForArticles!.articulos.splice(index, 1);
                            
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Artículo eliminado correctamente',
                                life: 3000
                            });
                        },
                        error: (error) => {
                            console.error('Error al eliminar artículo:', error);
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
    }
    
    // Reemplazar el método onUpload actual
    onUpload(event: any) {
        const files = event.files;
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Usar imagenes (array) en lugar de imagen
                if (!this.currentArticle.imagenes) {
                    this.currentArticle.imagenes = [];
                }
                
                if (this.currentArticle.imagenes.length === 0) {
                    this.currentArticle.imagenes.push(reader.result as string);
                } else {
                    this.currentArticle.imagenes[0] = reader.result as string;
                }
            };
        }
    }
}
