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

interface Lot {
    id: string;
    subasta: string;
    lote: string;
    descripcion: string; // ✅ Agregar este campo
    vendedorExterno: string;
    valorBase: number;
    incrementoMinimo: number;
    condicionesEntrega: string; 
    articulos: Articulo[];
    disponibilidad?: string;
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

    // ✅ Agregar nuevas propiedades para edición de lote
    editLotDialog: boolean = false;
    editingLot: any = {};
    editSubmittedLot: boolean = false;
    
    resetImagesTrigger: boolean = false; // <-- AGREGAR ESTA LÍNEA
    
    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private auctionHouseService: AuctionHouseService,
        private securityService: SecurityService,
        private itemService: ItemService // ✅ Agregar ItemService
    ) {}

    ngOnInit() {
        this.configureTable();
        
        const currentUser = this.securityService.actualUser;
        if (!currentUser) {
            console.warn('No se pudo obtener el usuario');
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
            { field: 'nombre', header: 'Nombre' },        // ✅ Se mostrará lot.lote
            { field: 'descripcion', header: 'Descripción' },
            { field: 'valorBase', header: 'Valor Base' },
            { field: 'pujaMinima', header: 'Puja Mínima' }, // ✅ Se mostrará lot.incrementoMinimo
            { field: 'disponibilidad', header: 'Disponibilidad' },
            { field: 'condicionesDeEntrega', header: 'Condiciones' } // ✅ Se mostrará lot.condicionesEntrega
        ];
        this.globalFilterFields = this.cols.map(col => col.field);
    }

    loadLotsByAuctionId(auctionId: number) {
        this.loading = true;
        this.auctionHouseService.getLotsByAuctionId(auctionId.toString())
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data: any) => {
                    console.log('Datos recibidos del servidor:', data); // ✅ Debug
                    
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
                    
                    // ✅ Mapear correctamente los datos del servidor al formato esperado
                    this.lots = lots.map(lot => ({
                        id: lot.id?.toString() || '',
                        subasta: lot.subasta_id?.toString() || '',
                        lote: lot.nombre || '',                    // ✅ Servidor: nombre -> Frontend: lote
                        descripcion: lot.descripcion || '',        // ✅ Mapear descripcion
                        vendedorExterno: lot.vendedorExterno === 1 ? 'Sí' : 'No',
                        valorBase: lot.valorBase || 0,             // ✅ Mapear valorBase
                        incrementoMinimo: lot.pujaMinima || 0,     // ✅ Servidor: pujaMinima -> Frontend: incrementoMinimo
                        condicionesEntrega: lot.condicionesDeEntrega || '', // ✅ Mapear condicionesEntrega
                        disponibilidad: lot.disponibilidad || '', // ✅ Mapear disponibilidad
                        articulos: lot.articulos || []
                    }));
                    
                    console.log('Lotes mapeados:', this.lots); // ✅ Debug
                },
                error: (error) => {
                    this.lots = [];
                    console.error('Error al cargar lotes:', error);
                }
            });
    }

    // ✅ Agregar método onSelectionChange
    onSelectionChange() {
        console.log('Lote seleccionado:', this.selectedLots);
    }

    editArticlesForLot(lot: Lot) {
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
                    
                    // ✅ Mapear correctamente incluyendo la categoría
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
                    
                    console.log('Artículos mapeados con categorías:', articulos);
                    
                    this.selectedLotForArticles!.articulos = articulos;
                    this.articlesManagementDialog = true;
                },
                error: (error) => {
                    console.error('Error al cargar artículos:', error);
                    
                    // ✅ SOLO mostrar toast si es un error real del servidor, no cuando simplemente no hay artículos
                    if (error.status && error.status !== 404) {
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
        if (this.selectedLots) {
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
                        
                        // ✅ Mapear correctamente incluyendo la categoría
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
                        
                        console.log('Artículos mapeados con categorías:', articulos);
                        
                        this.selectedLotForArticles!.articulos = articulos;
                        this.articlesManagementDialog = true;
                    },
                    error: (error) => {
                        console.error('Error al cargar artículos:', error);
                        
                        // ✅ SOLO mostrar toast si es un error real del servidor, no cuando simplemente no hay artículos
                        if (error.status && error.status !== 404) {
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
        this.submittedArticle = false; // <-- Esto es CLAVE
        this.currentArticle = {
          nombre: '',
          lote_id: this.selectedLotForArticles?.id ? parseInt(this.selectedLotForArticles.id) : 0,
          imagenes: [],
          estado: '',
          especificacionesTecnicas: '',
          categoria_id: undefined,
          categoria: undefined
        };
        this.editingArticleIndex = -1;
        setTimeout(() => {
          this.articleDialog = true;
        }, 100);
      }, 100);
    }

    openNew() {
        this.lot = {
            id: '',
            subasta: this.auctionId?.toString() || '',
            lote: '',
            descripcion: '', // ✅ Agregar este campo
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
    }
    
    editArticle(index: number) {
  if (!this.selectedLotForArticles) return;

  this.submittedArticle = false; // <-- Resetear validación

  this.editingArticleIndex = index;

  // Hacer una copia profunda del artículo
  const articuloOriginal = this.selectedLotForArticles.articulos[index];
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

  // 🔑 ACTIVAR EL RESET DE IMÁGENES
  this.resetImagesTrigger = true;
  setTimeout(() => this.resetImagesTrigger = false, 100);

  this.articleDialog = true;
}

    saveArticle(articulo?: Articulo) {
        this.submittedArticle = true;
        
        const articuloToSave: Articulo = articulo ? {...articulo} : {...this.currentArticle};
        
        // ✅ Agregar validación de categoría E IMAGEN
        if (!articuloToSave.nombre?.trim() || 
            !articuloToSave.estado?.trim() || 
            !articuloToSave.especificacionesTecnicas?.trim() || 
            !articuloToSave.categoria_id ||
            !articuloToSave.imagenes || 
            articuloToSave.imagenes.length === 0 || // ✅ Validar que hay imágenes
            !this.selectedLotForArticles) {
            
            let errorMessage = 'Todos los campos del artículo son obligatorios, incluyendo la categoría';
            if (!articuloToSave.imagenes || articuloToSave.imagenes.length === 0) {
                errorMessage += ' y al menos una imagen';
            }
            
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
            
            // ✅ Incluir todas las propiedades en la actualización
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
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Artículo actualizado correctamente',
                            life: 3000
                        });
                        
                        // ✅ CORREGIR: Preservar TODOS los datos del artículo actualizado
                        this.selectedLotForArticles!.articulos[this.editingArticleIndex] = {
                            id: articuloId, // ✅ Preservar ID original
                            nombre: articuloToSave.nombre, // ✅ Usar datos enviados
                            lote_id: articuloToSave.lote_id, // ✅ Preservar lote_id
                            imagenes: articuloToSave.imagenes || [], // ✅ Preservar imágenes
                            estado: articuloToSave.estado, // ✅ Usar estado actualizado
                            especificacionesTecnicas: articuloToSave.especificacionesTecnicas, // ✅ Usar especificaciones actualizadas
                            categoria_id: articuloToSave.categoria_id, // ✅ Usar categoria_id actualizada
                            categoria: articuloToSave.categoria // ✅ Preservar objeto categoría completo
                        };
                        
                        console.log('Artículo actualizado en la lista:', this.selectedLotForArticles!.articulos[this.editingArticleIndex]);
                        
                        this.articleDialog = false;
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo actualizar el artículo',
                            life: 3000
                        });
                    }
                });
        } else {
            // ✅ Incluir todas las propiedades en la creación
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
                        // ✅ CORREGIR: Crear artículo completo con todos los datos
                        const nuevoArticulo: Articulo = {
                            id: response.id || Date.now(), // ✅ ID del servidor o temporal
                            nombre: articuloToSave.nombre, // ✅ Usar datos enviados
                            lote_id: articuloToSave.lote_id, // ✅ Usar lote_id correcto
                            imagenes: articuloToSave.imagenes || [], // ✅ Preservar imágenes
                            estado: articuloToSave.estado, // ✅ Usar estado correcto
                            especificacionesTecnicas: articuloToSave.especificacionesTecnicas, // ✅ Usar especificaciones correctas
                            categoria_id: articuloToSave.categoria_id, // ✅ Usar categoria_id correcta
                            categoria: articuloToSave.categoria // ✅ Preservar objeto categoría completo
                        };
                        
                        if (!this.selectedLotForArticles!.articulos) {
                            this.selectedLotForArticles!.articulos = [];
                        }
                        
                        this.selectedLotForArticles!.articulos.push(nuevoArticulo);
                        
                        console.log('Nuevo artículo agregado:', nuevoArticulo);
                        
                        // Cerrar el diálogo
                        this.articleDialog = false;
                        
                        // Resetear completamente después de cerrarse
                        setTimeout(() => {
                          // ✅ CREAR UN OBJETO COMPLETAMENTE NUEVO
                          this.currentArticle = Object.assign({}, {
                            nombre: '',
                            lote_id: this.selectedLotForArticles?.id ? parseInt(this.selectedLotForArticles.id) : 0,
                            imagenes: [], // Array completamente nuevo
                            estado: '',
                            especificacionesTecnicas: '',
                            categoria_id: undefined,
                            categoria: undefined
                          });
                          
                          // Resetear TODOS los estados de validación
                          this.submittedArticle = false;
                          this.editingArticleIndex = -1;
                        }, 300);
                        
                        this.messageService.add({
                          severity: 'success',
                          summary: 'Éxito',
                          detail: 'Artículo agregado correctamente',
                          life: 3000
                        });
                    },
                    error: (error) => {
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
        if (!this.selectedLots) { // ✅ Cambiar validación
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Advertencia', 
                detail: 'Debe seleccionar un lote para eliminar', 
                life: 3000 
            });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar el lote "${this.selectedLots.lote}"?`, // ✅ Cambiar mensaje
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const lotToDelete = this.selectedLots!; // ✅ Cambiar lógica
                this.lots = this.lots.filter(val => val.id !== lotToDelete.id);
                this.selectedLots = null;
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
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea eliminar el lote?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loading = true;
                
                this.auctionHouseService.deleteLot(lot.id)
                    .pipe(finalize(() => this.loading = false))
                    .subscribe({
                        next: (response) => {
                            this.lots = this.lots.filter(val => val.id !== lot.id);
                            
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Lote eliminado correctamente',
                                life: 3000
                            });
                        },
                        error: (error) => {
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
          !this.lot.descripcion?.trim() || // ✅ Validar descripción
          !this.vendedorExternoOption || 
          !this.lot.valorBase || 
          this.lot.valorBase <= 0 ||
          !this.lot.incrementoMinimo || 
          this.lot.incrementoMinimo <= 0 ||
          !this.lot.disponibilidad?.trim() || 
          !this.lot.condicionesEntrega?.trim()) {
          
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
              this.messageService.add({ 
                  severity: 'error', 
                  summary: 'Error', 
                  detail: 'Todos los artículos deben tener un nombre', 
                  life: 3000 
              });
              return;
          }
      }
      
      // ✅ Modificar el objeto lotToSave
      const lotToSave = {
          subasta_id: parseInt(this.lot.subasta),
          nombre: this.lot.lote,
          descripcion: this.lot.descripcion, // ✅ Usar la descripción del formulario
          vendedorExterno: this.vendedorExternoOption === 'Sí' ? 1 : 0, // ✅ Enviar como boolean (1 o 0)
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
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lote actualizado', life: 3000 });
          this.lots = [...this.lots];
          this.lotDialog = false;
          this.lot = {
              id: '',
              subasta: '',
              lote: '',
              descripcion: '', // ✅ Resetear descripción
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
                          descripcion: '', // ✅ Resetear descripción
                          vendedorExterno: '',
                          valorBase: 0,
                          incrementoMinimo: 0,
                          condicionesEntrega: '', 
                          articulos: []
                      };
                  },
                  error: (error) => {
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
    
    // ✅ Agregar método para abrir el modal de edición
    editLot(lot: Lot) {
        console.log('Editando lote:', lot);
        
        // ✅ Mapear correctamente TODOS los campos del lote
        this.editingLot = {
            id: lot.id,
            nombre: lot.lote,                           // ✅ lot.lote -> nombre
            descripcion: lot.descripcion,               // ✅ Mantener descripcion
            valorBase: lot.valorBase,                   // ✅ Mantener valorBase
            pujaMinima: lot.incrementoMinimo,          // ✅ lot.incrementoMinimo -> pujaMinima
            disponibilidad: lot.disponibilidad,        // ✅ Mantener disponibilidad
            condicionesDeEntrega: lot.condicionesEntrega // ✅ lot.condicionesEntrega -> condicionesDeEntrega
        };
        
        this.editSubmittedLot = false;
        this.editLotDialog = true;
        
        console.log('Lote preparado para edición:', this.editingLot);
    }

    // ✅ Agregar método para cerrar el modal de edición
    hideEditLotDialog() {
        this.editLotDialog = false;
        this.editSubmittedLot = false;
    }

    // ✅ Agregar método para actualizar el lote
    updateLot() {
        this.editSubmittedLot = true;
        console.log('Actualizando lote:', this.editingLot);
        
        // Validar campos requeridos
        if (!this.editingLot.nombre?.trim() || 
            !this.editingLot.descripcion?.trim() || 
            !this.editingLot.valorBase || 
            this.editingLot.valorBase <= 0 ||
            !this.editingLot.pujaMinima || 
            this.editingLot.pujaMinima <= 0 ||
            !this.editingLot.disponibilidad?.trim() || 
            !this.editingLot.condicionesDeEntrega?.trim()) {
            
            console.warn('Faltan campos requeridos o hay errores de validación en edición de lote.');
            return;
        }
        
        // Preparar datos para actualizar
        const updateData = {
            nombre: this.editingLot.nombre,
            descripcion: this.editingLot.descripcion,
            valorBase: this.editingLot.valorBase,
            pujaMinima: this.editingLot.pujaMinima,
            disponibilidad: this.editingLot.disponibilidad,
            condicionesDeEntrega: this.editingLot.condicionesDeEntrega
        };
        
        console.log('Datos a actualizar:', updateData);
        
        this.loading = true;
        this.auctionHouseService.updateLot(this.editingLot.id, updateData)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {
                    console.log('Lote actualizado correctamente:', response);
                    
                    // ✅ CORREGIR: Actualizar el lote en la lista local con los nombres de campos correctos
                    const index = this.lots.findIndex(l => l.id === this.editingLot.id);
                    if (index !== -1) {
                        this.lots[index] = {
                            ...this.lots[index],
                            lote: this.editingLot.nombre,                    // ✅ editingLot.nombre -> lots[].lote
                            descripcion: this.editingLot.descripcion,       // ✅ Mantener descripcion
                            valorBase: this.editingLot.valorBase,           // ✅ Mantener valorBase
                            incrementoMinimo: this.editingLot.pujaMinima,   // ✅ editingLot.pujaMinima -> lots[].incrementoMinimo
                            disponibilidad: this.editingLot.disponibilidad, // ✅ Mantener disponibilidad
                            condicionesEntrega: this.editingLot.condicionesDeEntrega // ✅ editingLot.condicionesDeEntrega -> lots[].condicionesEntrega
                        };
                        this.lots = [...this.lots]; // Trigger change detection
                    }
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Lote actualizado correctamente',
                        life: 3000
                    });
                    
                    this.hideEditLotDialog();
                },
                error: (error) => {
                    console.error('Error al actualizar lote:', error);
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
                            
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Artículo eliminado correctamente',
                                life: 3000
                            });
                        },
                        error: (error) => {
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
    
    onUpload(event: any) {
        const files = event.files;
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            
            reader.readAsDataURL(file);
            reader.onload = () => {
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
