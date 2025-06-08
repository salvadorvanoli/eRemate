import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PrimaryButtonComponent } from '../../../../shared/components/buttons/primary-button/primary-button.component';

export type AuctionResultType = 'winner' | 'closed';

@Component({
  selector: 'app-auction-result-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    PrimaryButtonComponent
  ],
  templateUrl: './auction-result-modal.component.html',
  styleUrl: './auction-result-modal.component.scss'
})
export class AuctionResultModalComponent {
  @Input() visible = false;
  @Input() type: AuctionResultType = 'winner';
  @Output() closed = new EventEmitter<void>();

  get isWinnerModal(): boolean {
    return this.type === 'winner';
  }

  get isClosedModal(): boolean {
    return this.type === 'closed';
  }

  get modalTitle(): string {
    return this.isWinnerModal ? '¡Felicitaciones!' : 'Subasta Finalizada';
  }

  get modalIcon(): string {
    return this.isWinnerModal ? 'pi-trophy' : 'pi-check-circle';
  }

  get iconColorClass(): string {
    return this.isWinnerModal ? 'text-yellow-500' : 'text-blue-500';
  }

  get titleColorClass(): string {
    return this.isWinnerModal ? 'text-green-600' : 'text-blue-600';
  }

  get primaryMessage(): string {
    return this.isWinnerModal 
      ? '¡Has ganado el lote que se estaba subastando!'
      : 'Todos los lotes de esta subasta han sido subastados exitosamente.';
  }

  get secondaryMessage(): string {
    return this.isWinnerModal 
      ? 'En breve recibirás información sobre los próximos pasos para completar tu compra.'
      : 'Gracias por participar en nuestra subasta.';
  }

  get buttonLabel(): string {
    return this.isWinnerModal ? 'Aceptar' : 'Entendido';
  }

  onClose(): void {
    this.closed.emit();
  }
}
