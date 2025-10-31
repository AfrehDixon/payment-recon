// trx-transfer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

interface TrxTransferRequest {
  fromAddress: string;
  toAddress: string;
  amountTrx: number;
  waitConfirm: boolean;
  allowAccountActivation: boolean;
}

interface TrxTransferResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    fromAddress: string;
    toAddress: string;
    amountTrx: number;
    feeTrx: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    timestamp: string;
  };
}

@Component({
  selector: 'app-trx-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trx-transfer.component.html',
  styleUrls: ['./trx-transfer.component.scss'],
})
export class TrxTransferComponent {
  transferForm: FormGroup;
  loading = false;
  transferResult: TrxTransferResponse | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private store: Store
  ) {
    this.transferForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fromAddress: ['', [Validators.required, this.trxAddressValidator]],
      toAddress: [
        '',
        [
          Validators.required,
          this.trxAddressValidator,
          this.differentAddressValidator,
        ],
      ],
      amountTrx: [
        '',
        [Validators.required, Validators.min(0.000001), Validators.max(100000)],
      ],
      waitConfirm: [true],
      allowAccountActivation: [false],
    });
  }

  private trxAddressValidator(control: AbstractControl) {
    const address = control.value;
    if (!address) return null;

    const trxAddressRegex = /^T[a-zA-Z0-9]{33}$/;
    return trxAddressRegex.test(address) ? null : { invalidTrxAddress: true };
  }

  private differentAddressValidator(control: AbstractControl) {
    const toAddress = control.value;
    const fromAddress = control.parent?.get('fromAddress')?.value;
    return toAddress && fromAddress && toAddress === fromAddress
      ? { sameAddress: true }
      : null;
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  onSubmit(): void {
    if (this.transferForm.invalid) {
      this.markFormGroupTouched(this.transferForm);
      this.error = 'Please fix validation errors before submitting.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.transferResult = null;

    const transferData: TrxTransferRequest = this.transferForm.value;

    this.http
      .post<TrxTransferResponse>(
        'https://doronpay.com/api/trx/transfer',
        transferData,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.transferResult = response;

          if (response.success) {
            this.transferForm.reset({
              waitConfirm: true,
              allowAccountActivation: false,
            });
          } else {
            this.error =
              response.message || 'Transfer failed. Please try again.';
          }
        },
        error: (error) => {
          this.loading = false;
          this.error =
            error.error?.message ||
            'Failed to process transfer. Please try again.';
        },
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  resetForm(): void {
    this.transferForm.reset({
      waitConfirm: true,
      allowAccountActivation: false,
    });
    this.transferResult = null;
    this.error = null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.transferForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'This field is required';
      if (field.errors?.['invalidTrxAddress'])
        return 'Invalid TRX address format';
      if (field.errors?.['sameAddress'])
        return 'From and To addresses must be different';
      if (field.errors?.['min'])
        return `Minimum amount is ${field.errors['min'].min} TRX`;
      if (field.errors?.['max'])
        return `Maximum amount is ${field.errors['max'].max} TRX`;
    }
    return null;
  }

  getStatusClass(status: string): string {
    return status;
  }
}
