import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuctioneerService } from '../../../../core/services/auctioneer.service';
import { SecurityService } from '../../../../core/services/security.service';
import { SubastaService } from '../../../../core/services/subasta.service';
import { Subasta } from '../../../../core/models/subasta';
import { TipoOption, TIPOS_SUBASTA } from '../../../../core/enums/tipo-subasta.enum';
import { finalize } from 'rxjs';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-table-auction-auctioneer',
  standalone: true,  
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './table-auction-auctioneer.component.html',
  styleUrl: './table-auction-auctioneer.component.scss'
})
export class TableAuctionAuctioneerComponent implements OnInit, OnChanges {
  @Input() viewType: 'schedule' | 'requests' = 'schedule';
  @ViewChild('dt') dt!: Table;
    auctions: Subasta[] = [];
  selectedAuction: Subasta | null = null;
  cols: any[] = [];
  globalFilterFields: string[] = [];
  loading: boolean = false;
  auctionDialog: boolean = false;
  submitted: boolean = false;
  rematadorId: number | null = null;
  auction: Subasta = this.initNewAuction();
  rematadorEmail: string = '';
  emailError: string = '';
  
  // Dropdown properties for auction types
  tipos: TipoOption[] = [];
  selectedTipo: TipoOption | null = null;
  loadingTipos: boolean = false;
    constructor(
    private auctioneerService: AuctioneerService,
    private securityService: SecurityService,
    private subastaService: SubastaService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}
  ngOnInit() {
    this.configureTable();
    this.loadCurrentUser();
    this.loadTipos();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['viewType'] && !changes['viewType'].firstChange) {
      this.loadAuctions();
    }
  }
  
  loadCurrentUser() {
    this.loading = true;
    const currentUser = this.securityService.actualUser;
    
    if (currentUser) {
      this.rematadorId = currentUser.id;
      this.loadAuctions();
    } else {
      this.messageService.clear();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo determinar el ID del rematador',
        life: 3000
      });
      this.loading = false;
    }
  }
  
  configureTable() {
    if (this.viewType === 'schedule') {
      this.cols = [
        { field: 'tipoSubasta', header: 'Tipo' },
        { field: 'fechaInicioDisplay', header: 'Fecha Inicio' },
        { field: 'fechaCierreDisplay', header: 'Fecha Cierre' },
        { field: 'ubicacion', header: 'Ubicación' },
        { field: 'estado', header: 'Estado' }
      ];
    } else {
      this.cols = [
        { field: 'tipoSubasta', header: 'Tipo' },
        { field: 'fechaInicioDisplay', header: 'Fecha Inicio' },
        { field: 'fechaCierreDisplay', header: 'Fecha Cierre' },
        { field: 'ubicacion', header: 'Ubicación' },
        { field: 'casaDeRemates_id', header: 'Casa de Remates ID' }
      ];
    }
    
    this.globalFilterFields = this.cols.map(col => col.field);
  }
  
  loadAuctions() {
    if (!this.rematadorId) {
      return;
    }
    
    this.loading = true;
    
    const service = this.viewType === 'schedule' 
      ? this.auctioneerService.getSchedule(this.rematadorId)
      : this.auctioneerService.getRequestedAuctions(this.rematadorId);
    
    service.pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        const auctionsArray = response.data || [];
        this.auctions = this.formatDates(auctionsArray);
      },
      error: (error) => {
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudieron cargar las ${this.viewType === 'schedule' ? 'subastas agendadas' : 'solicitudes de subastas'}`,
          life: 3000
        });
        this.auctions = [];
      }
    });
  }
  
  loadTipos() {
    this.loadingTipos = true;
    this.subastaService.getTipos()
      .pipe(finalize(() => this.loadingTipos = false))
      .subscribe({
        next: (tipos) => {
          this.tipos = tipos;
        },
        error: (error) => {
          console.error('Error loading auction types:', error);
          // Fallback to static types
          this.tipos = TIPOS_SUBASTA;
        }
      });
  }
  
  formatDates(data: Subasta[]): Subasta[] {
    return data.map(item => {
      return {
        ...item,
        fechaInicioDisplay: this.formatDate(item.fechaInicio),
        fechaCierreDisplay: this.formatDate(item.fechaCierre)
      };
    });
  }
  
  formatDate(date: Date | string): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString();
  }
  
  onFilterGlobal(event: Event) {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  
  initNewAuction(): Subasta {
    return {
      id: 0,
      tipoSubasta: '',
      fechaInicio: new Date(),
      fechaCierre: new Date(),
      ubicacion: '',
      estado: 'Pendiente',
      casaDeRemates_id: 0,
      rematador_id: this.rematadorId || 0,
      mensajes: '',
      urlTransmision: '',
      pujaHabilitada: false
    };
  }
    openNew() {
    this.auction = this.initNewAuction();
    this.rematadorEmail = '';
    this.selectedTipo = null;
    this.submitted = false;
    this.auctionDialog = true;
  }
  
  hideDialog() {
    this.auctionDialog = false;
    this.submitted = false;
    this.emailError = '';
  }
  
  onSelectionChange() {
  }
  
  acceptAuction(auction: Subasta) {
    if (!this.rematadorId) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro de aceptar la solicitud de subasta "${auction.tipoSubasta}"?`,
      header: 'Confirmar Aceptación',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.loading = true;
        
        this.auctioneerService.acceptAuction(this.rematadorId!, auction.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Solicitud de subasta aceptada',
                life: 3000
              });
              this.loadAuctions();
            },
            error: (error) => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo aceptar la solicitud de subasta',
                life: 3000
              });
            }
          });
      }
    });
  }
  
  rejectAuction(auction: Subasta) {
    if (!this.rematadorId) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro de rechazar la solicitud de subasta "${auction.tipoSubasta}"?`,
      header: 'Confirmar Rechazo',
      icon: 'pi pi-times-circle',
      accept: () => {
        this.loading = true;
        
        this.auctioneerService.rejectAuction(this.rematadorId!, auction.id!, 'Rechazada por el rematador')
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Solicitud de subasta rechazada',
                life: 3000
              });
              this.loadAuctions();
            },
            error: (error) => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo rechazar la solicitud de subasta',
                life: 3000
              });
            }
          });
      }
    });
  }
  
  cancelAuction(auction: Subasta) {
    this.confirmationService.confirm({
      message: '¿Está seguro de cancelar esta subasta?',
      header: 'Confirmar Cancelación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.rematadorId) return;
        
        this.loading = true;
        this.auctioneerService.rejectAuction(this.rematadorId, auction.id!, 'Cancelada por el rematador')
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Subasta cancelada correctamente',
                life: 3000
              });
              this.loadAuctions();
            },
            error: (error) => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cancelar la subasta',
                life: 3000
              });
            }
          });
      }
    });
  }
    saveAuction() {
    this.submitted = true;
    
    if (!this.selectedTipo || 
        !this.auction.fechaInicio || 
        !this.auction.fechaCierre || 
        !this.auction.ubicacion?.trim()) {
      return;
    }
    
    // Use the selected tipo value
    this.auction.tipoSubasta = this.selectedTipo.value;
    
    setTimeout(() => {
      this.messageService.clear();
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Subasta guardada correctamente',
        life: 3000
      });
      this.auctionDialog = false;
      this.loadAuctions();
    }, 1000);
  }
  
  viewAuctionDetails(auction: Subasta) {
    if (auction.id) {
      this.router.navigate(['/subasta', auction.id]);
    } else {
      this.messageService.clear();
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se puede acceder a los detalles de esta subasta',
        life: 3000
      });
    }
  }
}
