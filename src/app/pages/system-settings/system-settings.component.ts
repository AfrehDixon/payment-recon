import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SystemSettingsService } from './system-settings.service';
import {
  SystemSettings,
  EditableSystemSettings,
  BtcBalanceData,
  UpdateSystemSettingsRequest,
} from './system-settings.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss'],
})
export class SystemSettingsComponent implements OnInit {
  settings: SystemSettings | null = null;
  btcBalance: BtcBalanceData | null = null;
  settingsForm: FormGroup;
  loading = false;
  loadingBalance = false;
  error: string | null = null;
  balanceError: string | null = null;
  isEditing = false;
  successMessage: string | null = null;

  constructor(
    private systemSettingsService: SystemSettingsService,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.createForm();
  }

  ngOnInit(): void {
    this.fetchSettings();
    this.fetchBtcBalance();
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        // Basic settings
        markupRate: [
          '',
          [Validators.required, Validators.min(0), Validators.max(100)],
        ],
        transactionFee: ['', [Validators.required, Validators.min(0)]],
        minTransactionAmount: ['', [Validators.required, Validators.min(1)]],
        maxTransactionAmount: ['', [Validators.required, Validators.min(1)]],
        dynamicPricingEnabled: [false],

        // BTC Reserve Config
        btcReserveEnabled: [false],
        btcReserveTargetPct: ['', [Validators.min(0), Validators.max(1)]],
        btcReserveLowerPct: ['', [Validators.min(0), Validators.max(1)]],
        btcReserveUpperPct: ['', [Validators.min(0), Validators.max(1)]],
        btcReserveMaxDailyUsd: ['', [Validators.min(0)]],
        btcReserveMaxTradeUsd: ['', [Validators.min(0)]],
        btcReserveMinTradeUsd: ['', [Validators.min(0)]],
        btcReserveSlippageBps: ['', [Validators.min(0), Validators.max(10000)]],
        btcReserveCooldownSec: ['', [Validators.min(0)]],
        btcRecipient: [''],
        bscRecipient: [''],
        bscRouterAddr: [''],
        bscVaultAddr: [''],
        usdtTokenAddr: [''],

        // BTC Sweep Config
        btcSweepEnabled: [false],
        btcSweepMaxSweepUsd: ['', [Validators.min(0)]],
        btcSweepMinSweepUsd: ['', [Validators.min(0)]],
        btcSweepReserveBtc: ['', [Validators.min(0)]],
        btcSweepPctOfAvail: ['', [Validators.min(0), Validators.max(1)]],
        btcSweepSlippageBps: ['', [Validators.min(0), Validators.max(10000)]],
        treasuryBep20: [''],
      },
      {
        validators: [this.crossFieldValidator],
      }
    );
  }

  // Custom validator for cross-field validation
  private crossFieldValidator(form: FormGroup) {
    const errors: any = {};

    const minAmount = form.get('minTransactionAmount')?.value;
    const maxAmount = form.get('maxTransactionAmount')?.value;

    if (minAmount && maxAmount && Number(minAmount) >= Number(maxAmount)) {
      errors.minMaxAmount = 'Minimum amount must be less than maximum amount';
    }

    const lowerPct = form.get('btcReserveLowerPct')?.value;
    const targetPct = form.get('btcReserveTargetPct')?.value;
    const upperPct = form.get('btcReserveUpperPct')?.value;

    if (lowerPct && targetPct && upperPct) {
      if (
        Number(lowerPct) >= Number(targetPct) ||
        Number(targetPct) >= Number(upperPct)
      ) {
        errors.reserveThresholds =
          'Lower < Target < Upper threshold percentages required';
      }
    }

    const minTradeUsd = form.get('btcReserveMinTradeUsd')?.value;
    const maxTradeUsd = form.get('btcReserveMaxTradeUsd')?.value;

    if (
      minTradeUsd &&
      maxTradeUsd &&
      Number(minTradeUsd) >= Number(maxTradeUsd)
    ) {
      errors.minMaxTrade = 'Min trade USD must be less than max trade USD';
    }

    const minSweepUsd = form.get('btcSweepMinSweepUsd')?.value;
    const maxSweepUsd = form.get('btcSweepMaxSweepUsd')?.value;

    if (
      minSweepUsd &&
      maxSweepUsd &&
      Number(minSweepUsd) >= Number(maxSweepUsd)
    ) {
      errors.minMaxSweep = 'Min sweep USD must be less than max sweep USD';
    }

    return Object.keys(errors).length ? errors : null;
  }

  fetchSettings(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.systemSettingsService
      .getSystemSettings()
      .pipe(
        catchError((error) => {
          this.error =
            'Failed to load system settings. Please try again later.';
          return of({ success: false, message: error.message, data: null });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        if (response.success && response.data) {
          this.settings = response.data;
          this.populateForm(response.data);
        }
      });
  }

  private populateForm(settings: SystemSettings): void {
    this.settingsForm.patchValue({
      // Basic settings
      markupRate: settings.markupRate,
      transactionFee: settings.transactionFee,
      minTransactionAmount: settings.minTransactionAmount,
      maxTransactionAmount: settings.maxTransactionAmount,
      dynamicPricingEnabled: settings.dynamicPricingEnabled,

      // BTC Reserve Config
      btcReserveEnabled: settings.btcReserveConfig.enabled,
      btcReserveTargetPct: settings.btcReserveConfig.targetPct,
      btcReserveLowerPct: settings.btcReserveConfig.lowerPct,
      btcReserveUpperPct: settings.btcReserveConfig.upperPct,
      btcReserveMaxDailyUsd: settings.btcReserveConfig.maxDailyUsd,
      btcReserveMaxTradeUsd: settings.btcReserveConfig.maxTradeUsd,
      btcReserveMinTradeUsd: settings.btcReserveConfig.minTradeUsd,
      btcReserveSlippageBps: settings.btcReserveConfig.slippageBps,
      btcReserveCooldownSec: settings.btcReserveConfig.cooldownSec,
      btcRecipient: settings.btcReserveConfig.btcRecipient,
      bscRecipient: settings.btcReserveConfig.bscRecipient,
      bscRouterAddr: settings.btcReserveConfig.bscRouterAddr,
      bscVaultAddr: settings.btcReserveConfig.bscVaultAddr,
      usdtTokenAddr: settings.btcReserveConfig.usdtTokenAddr,

      // BTC Sweep Config
      btcSweepEnabled: settings.btcSweepConfig.enabled,
      btcSweepMaxSweepUsd: settings.btcSweepConfig.maxSweepUsd,
      btcSweepMinSweepUsd: settings.btcSweepConfig.minSweepUsd,
      btcSweepReserveBtc: settings.btcSweepConfig.reserveBtc,
      btcSweepPctOfAvail: settings.btcSweepConfig.sweepPctOfAvail,
      btcSweepSlippageBps: settings.btcSweepConfig.slippageBps,
      treasuryBep20: settings.btcSweepConfig.treasuryBep20,
    });
  }

  fetchBtcBalance(): void {
    this.loadingBalance = true;
    this.balanceError = null;

    this.systemSettingsService
      .getBtcChainBalance()
      .pipe(
        catchError((error) => {
          this.balanceError =
            'Failed to load BTC balance. Please try again later.';
          return of({ success: false, message: error.message, data: null });
        }),
        finalize(() => {
          this.loadingBalance = false;
        })
      )
      .subscribe((response) => {
        if (response.success && response.data) {
          this.btcBalance = response.data;
        } else if (!response.success) {
          this.balanceError = response.message || 'Failed to load BTC balance';
        }
      });
  }

  refreshAll(): void {
    this.fetchSettings();
    this.fetchBtcBalance();
  }

  formatCurrency(value: number): string {
    return (
      value?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || '0.00'
    );
  }

  formatBtc(value: number): string {
    return (value?.toFixed(8) || '0.00000000') + ' BTC';
  }

  formatSmallCurrency(value: number): string {
    return (
      value?.toLocaleString('en-US', {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      }) || '0.000000'
    );
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.error = null;
    this.successMessage = null;

    if (!this.isEditing && this.settings) {
      // Reset form when canceling edit
      this.populateForm(this.settings);
    }
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.markFormGroupTouched(this.settingsForm);
      this.error = 'Please fix validation errors before saving.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const formValue = this.settingsForm.value;

    const updatedSettings: UpdateSystemSettingsRequest = {
      markupRate: Number(formValue.markupRate),
      transactionFee: Number(formValue.transactionFee),
      minTransactionAmount: Number(formValue.minTransactionAmount),
      maxTransactionAmount: Number(formValue.maxTransactionAmount),
      dynamicPricingEnabled: formValue.dynamicPricingEnabled,
      btcReserveConfig: {
        enabled: formValue.btcReserveEnabled,
        targetPct: Number(formValue.btcReserveTargetPct),
        lowerPct: Number(formValue.btcReserveLowerPct),
        upperPct: Number(formValue.btcReserveUpperPct),
        maxDailyUsd: Number(formValue.btcReserveMaxDailyUsd),
        maxTradeUsd: Number(formValue.btcReserveMaxTradeUsd),
        minTradeUsd: Number(formValue.btcReserveMinTradeUsd),
        slippageBps: Number(formValue.btcReserveSlippageBps),
        cooldownSec: Number(formValue.btcReserveCooldownSec),
        btcRecipient: formValue.btcRecipient || '',
        bscRecipient: formValue.bscRecipient || '',
        bscRouterAddr: formValue.bscRouterAddr || '',
        bscVaultAddr: formValue.bscVaultAddr || '',
        usdtTokenAddr: formValue.usdtTokenAddr || '',
      },
      btcSweepConfig: {
        enabled: formValue.btcSweepEnabled,
        maxSweepUsd: Number(formValue.btcSweepMaxSweepUsd),
        minSweepUsd: Number(formValue.btcSweepMinSweepUsd),
        reserveBtc: Number(formValue.btcSweepReserveBtc),
        sweepPctOfAvail: Number(formValue.btcSweepPctOfAvail),
        slippageBps: Number(formValue.btcSweepSlippageBps),
        treasuryBep20: formValue.treasuryBep20 || '',
      },
    };

    this.systemSettingsService
      .updateSettings(updatedSettings)
      .pipe(
        catchError((error) => {
          this.error = 'Failed to update settings. Please try again later.';
          return of({ success: false, message: error.message, data: null });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        if (response.success && response.data) {
          this.settings = response.data;
          this.isEditing = false;
          this.successMessage = 'Settings updated successfully!';
          setTimeout(() => {
            this.successMessage = null;
          }, 5000);
        } else {
          this.error = response.message || 'Failed to update settings';
        }
      });
  }
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.settingsForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      const errors = field.errors;
      if (errors?.['required']) return `${fieldName} is required`;
      if (errors?.['min']) return `Minimum value is ${errors['min'].min}`;
      if (errors?.['max']) return `Maximum value is ${errors['max'].max}`;
    }
    return null;
  }

  getFormErrors(): string[] {
    const formErrors = this.settingsForm.errors;
    const errors: string[] = [];

    if (formErrors?.['minMaxAmount']) {
      errors.push(formErrors['minMaxAmount']);
    }
    if (formErrors?.['reserveThresholds']) {
      errors.push(formErrors['reserveThresholds']);
    }
    if (formErrors?.['minMaxTrade']) {
      errors.push(formErrors['minMaxTrade']);
    }
    if (formErrors?.['minMaxSweep']) {
      errors.push(formErrors['minMaxSweep']);
    }

    return errors;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
