import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoSubasta, TIPOS_SUBASTA } from '../../../../core/enums/tipo-subasta.enum';
import { EstadoSubasta, ESTADOS_SUBASTA } from '../../../../core/enums/estado-subasta.enum';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoriaNodo } from '../../../../core/models/categoria';

export interface MapFilters {
  tipoSubasta?: string;
  estado?: string[];
  categoria?: number;
}

@Component({
  selector: 'app-map-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.scss']
})
export class MapFiltersComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<MapFilters>();
  @Output() filtersCleared = new EventEmitter<void>();

  selectedTipoSubasta: string = '';
  selectedEstados: string[] = [];
  selectedCategoria: number | null = null;

  appliedTipoSubasta: string = '';
  appliedEstados: string[] = [];
  appliedCategoria: number | null = null;

  tiposSubasta = TIPOS_SUBASTA;
  estadosSubasta = ESTADOS_SUBASTA;
  categorias: {value: number, label: string}[] = [];

  showFilters = false;
  loading = false;

  constructor(private categoryService: CategoryService) {}
  ngOnInit() {
    this.loadCategorias();
    this.initializeDefaultFilters();
  }
  private initializeDefaultFilters() {
    const estadosExcluidos = [EstadoSubasta.CERRADA, EstadoSubasta.CANCELADA];
    this.selectedEstados = this.estadosSubasta
      .filter(estado => !estadosExcluidos.includes(estado.value))
      .map(estado => estado.value as string);
    
    this.applyFilters();
  }

  loadCategorias() {
    this.categoryService.getAllCategoriesTree().subscribe({
      next: (categorias: CategoriaNodo[]) => {
        this.categorias = this.flattenCategorias(categorias);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);

        this.categorias = [
          { value: 1, label: 'Arte y Antigüedades' },
          { value: 2, label: 'Vehículos' },
          { value: 3, label: 'Inmuebles' },
          { value: 4, label: 'Electrónicos' },
          { value: 5, label: 'Otros' }
        ];
      }
    });
  }

  private flattenCategorias(categorias: CategoriaNodo[], prefix = ''): {value: number, label: string}[] {
    const result: {value: number, label: string}[] = [];
    
    categorias.forEach(categoria => {
      const label = prefix ? `${prefix} > ${categoria.nombre}` : categoria.nombre;
      result.push({ value: categoria.id, label });
      
      if (categoria.hijos && categoria.hijos.length > 0) {
        result.push(...this.flattenCategorias(categoria.hijos, label));
      }
    });
    
    return result;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  onTipoSubastaChange(value: string) {
    this.selectedTipoSubasta = value;
  }

  onEstadoChange(estado: string, checked: boolean) {
    if (checked) {
      if (!this.selectedEstados.includes(estado)) {
        this.selectedEstados.push(estado);
      }
    } else {
      this.selectedEstados = this.selectedEstados.filter(e => e !== estado);
    }
  }

  onCategoriaChange(value: string) {
    this.selectedCategoria = value ? Number(value) : null;
  }
  applyFilters() {
    this.appliedTipoSubasta = this.selectedTipoSubasta;
    this.appliedEstados = [...this.selectedEstados];
    this.appliedCategoria = this.selectedCategoria;

    const filters: MapFilters = {};
    
    if (this.selectedTipoSubasta) {
      filters.tipoSubasta = this.selectedTipoSubasta;
    }
    
    if (this.selectedEstados.length > 0) {
      filters.estado = [...this.selectedEstados];
    }
    
    if (this.selectedCategoria) {
      filters.categoria = this.selectedCategoria;
    }

    this.filtersChanged.emit(filters);
    
    
  }  clearFilters() {
    this.selectedTipoSubasta = '';
    this.selectedCategoria = null;
    
    const estadosExcluidos = [EstadoSubasta.CERRADA, EstadoSubasta.CANCELADA];
    this.selectedEstados = this.estadosSubasta
      .filter(estado => !estadosExcluidos.includes(estado.value))
      .map(estado => estado.value as string);
    
    this.applyFilters();
  }hasActiveFilters(): boolean {
    const hasCustomFilters = !!(this.appliedTipoSubasta || this.appliedCategoria);
    
    const estadosExcluidos = [EstadoSubasta.CERRADA, EstadoSubasta.CANCELADA];
    const estadosPorDefecto = this.estadosSubasta
      .filter(estado => !estadosExcluidos.includes(estado.value))
      .map(estado => estado.value as string);
    
    const hasCustomEstados = this.appliedEstados.length !== estadosPorDefecto.length ||
      !this.appliedEstados.every(estado => estadosPorDefecto.includes(estado));
    
    return hasCustomFilters || hasCustomEstados;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.appliedTipoSubasta) count++;
    if (this.appliedCategoria) count++;
    
    const estadosExcluidos = [EstadoSubasta.CERRADA, EstadoSubasta.CANCELADA];
    const estadosPorDefecto = this.estadosSubasta
      .filter(estado => !estadosExcluidos.includes(estado.value))
      .map(estado => estado.value as string);
    
    const hasCustomEstados = this.appliedEstados.length !== estadosPorDefecto.length ||
      !this.appliedEstados.every(estado => estadosPorDefecto.includes(estado));
    
    if (hasCustomEstados) count++;
    
    return count;
  }

  getTipoSubastaLabel(tipoValue: string): string {
    const tipo = this.tiposSubasta.find(t => t.value === tipoValue);
    return tipo ? tipo.label : tipoValue;
  }

  getCategoriaLabel(categoriaId: number): string {
    const categoria = this.categorias.find(c => c.value === categoriaId);
    return categoria ? categoria.label : 'Categoría #' + categoriaId;
  }

  getAppliedTipoSubastaLabel(): string {
    return this.getTipoSubastaLabel(this.appliedTipoSubasta);
  }

  getAppliedCategoriaLabel(): string {
    return this.appliedCategoria ? this.getCategoriaLabel(this.appliedCategoria) : '';
  }
}
