import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { EditorModule } from 'primeng/editor';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-textarea-input',
  standalone: true,
  imports: [
    EditorModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    CommonModule
  ],
  templateUrl: './form-textarea-input.component.html',
  styleUrl: './form-textarea-input.component.scss'
})
export class FormTextareaInputComponent {

  text = signal('');

  @Input() placeholder: string = "";
  @Input() textPattern: RegExp = new RegExp('');
  @Input() errorMessage: string = "";
  @Input() formSubmitted = signal(false);

  @Output() textValue = new EventEmitter<string>();
  @Output() isInputInvalid = new EventEmitter<boolean>();

  // Configuración del editor sin imágenes
  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  showErrorMessage = computed(() => {
    return this.validateText() && this.formSubmitted();
  });
  validateText() {
    // Extraer texto plano del HTML para validación
    const plainText = this.extractPlainText(this.text());
    const isInvalid = plainText.length === 0 || !this.textPattern.test(plainText);
    this.isInputInvalid.emit(isInvalid);
    return isInvalid;
  }

  private extractPlainText(html: string): string {
    // Crear un elemento temporal para extraer solo el texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  reset() {
    this.text.set('');
    this.isInputInvalid.emit(false);
    this.textValue.emit('');
  }

  onTextChange(event: any) {
    this.text.set(event.htmlValue || '');
    this.textValue.emit(this.text());
  }
}
