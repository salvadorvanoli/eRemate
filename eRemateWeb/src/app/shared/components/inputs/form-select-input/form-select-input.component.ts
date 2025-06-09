import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-form-select-input',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    Message
],
  templateUrl: './form-select-input.component.html',
  styleUrls: ['./form-select-input.component.scss']
})
export class FormSelectInputComponent {
  @Input() options: { label: string, value: any }[] = [];
  @Input() placeholder: string = '';
  @Input() errorMessage: string = "";
  @Input() formSubmitted = signal(false);

  @Output() textValue = new EventEmitter<any>();
  @Output() isInputInvalid = new EventEmitter<boolean>();

  value: string | null = '';

  onValueChange(event: any) {
    this.value = event;
    this.textValue.emit(event);
    this.validateText();
  }

  showErrorMessage = computed(() => {
    return this.validateText() && this.formSubmitted();
  });

  validateText() {
    const isInvalid = !this.value || this.value === '';
    this.isInputInvalid.emit(isInvalid);
    return isInvalid;
  }

  reset() {
    this.value = '';
    this.isInputInvalid.emit(false);
    this.textValue.emit(null);
  }
}