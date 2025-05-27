import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotProductDetailsComponent } from '../lot-product-details/lot-product-details.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';
import { LoteService } from '../../../../core/services/lote.service';
import { SubastaService } from '../../../../core/services/subasta.service';
import { Subasta } from '../../../../core/models/subasta';
import { Lote } from '../../../../core/models/lote';

@Component({
  selector: 'app-live-bidding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LotProductDetailsComponent,
    PrimaryButtonComponent
  ],
  templateUrl: './live-bidding.component.html',
  styleUrl: './live-bidding.component.scss'
})
export class LiveBiddingComponent implements OnInit, OnDestroy {  @Input() subasta?: Subasta;
  
  loteActual?: Lote;
  loading = false;
  error = false;
  errorMessage = '';
  successMessage = '';
  
  // Datos de puja
  pujaAmount: number = 0;
  pujando = false;

  constructor(
    private loteService: LoteService,
    private subastaService: SubastaService
  ) {}

  ngOnInit() {
    this.loadLoteActual();
  }

  ngOnDestroy() {
    // Cleanup subscriptions if any
  }  loadLoteActual() {
    if (!this.subasta?.id) {
      this.error = true;
      this.errorMessage = 'No se ha proporcionado un ID de subasta válido';
      return;
    }

    this.loading = true;
    this.error = false;
    this.errorMessage = '';
    this.successMessage = '';

    // Use SubastaService to get the current lot
    this.subastaService.getLoteActual(this.subasta.id).subscribe({
      next: (lote: Lote) => {
        this.loteActual = lote;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar lote actual:', error);
        this.error = true;
        this.errorMessage = error.message || 'Error al cargar el lote actual';
        this.loading = false;
      }
    });
  }

  // Bidding methods
  get valorActual(): number {
    return this.loteActual?.oferta || this.loteActual?.valorBase || 0;
  }

  get pujaMinima(): number {
    return this.loteActual?.pujaMinima || 0;
  }

  get totalAPagar(): number {
    return this.valorActual + this.pujaAmount;
  }  get puedeRealizar(): boolean {
    const valorMinimo = this.valorActual + this.pujaMinima;
    return this.pujaAmount > 0 && 
           this.totalAPagar >= valorMinimo && 
           !this.pujando;
  }realizarPuja() {
    if (!this.puedeRealizar || !this.loteActual || !this.subasta) return;    this.pujando = true;
    this.errorMessage = '';
    this.successMessage = '';
      console.log('Datos de la puja:', {
      subastaId: this.subasta.id,
      loteId: this.loteActual.id,
      pujaAmount: this.pujaAmount, // Solo el monto de la puja (lo que se envía)
      valorActual: this.valorActual,
      pujaMinima: this.pujaMinima,
      totalCalculado: this.totalAPagar // El total calculado para mostrar al usuario
    });// Use SubastaService to place the bid with the input amount (not total)
    this.subastaService.realizarPuja(this.subasta.id, this.loteActual.id, this.pujaAmount).subscribe({      next: (response) => {
        console.log('Puja realizada exitosamente:', response);
        // Update the current lot's offer value with the new total from backend
        if (this.loteActual && response.data?.nuevo_total_lote) {
          this.loteActual.oferta = response.data.nuevo_total_lote;
        }
        this.pujaAmount = 0;
        this.pujando = false;
        this.successMessage = 'Puja realizada exitosamente';
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error al realizar la puja:', error);
        this.pujando = false;
        this.errorMessage = error.message || 'Error al realizar la puja';
      }
    });
  }
  incrementarPuja(amount: number) {
    this.pujaAmount = Math.max(0, this.pujaAmount + amount);
  }

  refreshLoteActual() {
    this.loadLoteActual();
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
