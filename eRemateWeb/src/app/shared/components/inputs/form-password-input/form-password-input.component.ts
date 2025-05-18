import { Component, computed, EventEmitter, Input, Output, Signal, signal, SimpleChanges } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-form-password-input',
  standalone: true,
  imports: [
    PasswordModule,
    FormsModule,
    ReactiveFormsModule,
    Message
  ],
  templateUrl: './form-password-input.component.html',
  styleUrl: './form-password-input.component.scss'
})
export class FormPasswordInputComponent {

  password = signal('');

  @Input() placeholder: string = "";
  @Input() errorMessage: string = "";
  @Input() formSubmitted = signal(false);
  @Input() resetErrorMessageOnChange: boolean = false;
  @Input() isPasswordWrong: boolean = false;

  @Output() passwordValue = new EventEmitter<string>();
}
