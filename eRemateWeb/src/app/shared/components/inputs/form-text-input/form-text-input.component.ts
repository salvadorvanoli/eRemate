import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { Message } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-form-text-input',
  standalone: true,
  imports: [
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    Message,
    FloatLabelModule
  ],
  templateUrl: './form-text-input.component.html',
  styleUrl: './form-text-input.component.scss'
})
export class FormTextInputComponent {

  text = signal('');

  @Input() placeholder: string = "";
  @Input() textPattern: RegExp = new RegExp('');
  @Input() errorMessage: string = "";
  @Input() formSubmitted = signal(false);

  @Output() textValue = new EventEmitter<string>();
  @Output() isInputInvalid = new EventEmitter<boolean>();

  showErrorMessage = computed(() => {
    return this.validateText() && this.formSubmitted();
  });

  validateText() {
    const isInvalid = !this.textPattern.test(this.text());
    this.isInputInvalid.emit(isInvalid);
    return isInvalid;
  }

  reset() {
    this.text.set('');
    this.isInputInvalid.emit(false);
    this.textValue.emit('');
  }
}
