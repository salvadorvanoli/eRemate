import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule]
})
export class ModalComponent {
    @Input() visible: boolean = false;
    @Input() size: 'small' | 'medium' | 'large' | 'extra-large' = 'medium';
    @Output() closed = new EventEmitter<void>();

    get modalWidth(): string {
        switch (this.size) {
            case 'small': return '400px';
            case 'medium': return '600px';
            case 'large': return '900px';
            case 'extra-large': return '1200px';
            default: return '600px';
        }
    }

    get modalMaxWidth(): string {
        switch (this.size) {
            case 'small': return '90vw';
            case 'medium': return '90vw';
            case 'large': return '95vw';
            case 'extra-large': return '98vw';
            default: return '90vw';
        }
    }

    close() {
        this.closed.emit();
    }
}