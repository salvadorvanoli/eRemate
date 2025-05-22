import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { Message } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-interactive-password-input',
  standalone: true,
  imports: [
    PasswordModule,
    FormsModule,
    ReactiveFormsModule,
    Message,
    DividerModule,
    FloatLabelModule
  ],
  templateUrl: './interactive-password-input.component.html',
  styleUrl: './interactive-password-input.component.scss'
})
export class InteractivePasswordInputComponent {

  password = signal('');

  mediumRegex: string = '^.{6,}$';
  strongRegex: string = '^(?=.*\\d)(?=.*[!@#$%^&*()_+\\=\\[\\]{};\'":\\\\|,.<>\\/?-]).{8,}$';

  @Input() placeholder: string = "";
  @Input() errorMessage: string = "";
  @Input() formSubmitted = signal(false);

  @Output() passwordValue = new EventEmitter<string>();
  @Output() isPasswordInvalid = new EventEmitter<boolean>();

  showErrorMessage = computed(() => {
    return this.validatePassword() && this.formSubmitted();
  });

  validatePassword() {
    this.passwordValue.emit(this.password());
    const isInvalid = (this.password().length < 6);
    this.isPasswordInvalid.emit(isInvalid);
    return isInvalid;
  }
}
