import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettings, EditableSystemSettings, BtcBalanceData } from './system-settings.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
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
    return this.fb.group({
      // Basic settings
      markupRate: ['', [Validators.required, Validators.min(0)]],
      transactionFee: ['', [Validators.required, Validators.min(0)]],
      minTransactionAmount: ['', [Validators.required, Validators.min(0)]],
      maxTransactionAmount: ['', [Validators.required, Validators.min(0)]],
      dynamicPricingEnabled: [false],
      
      // BTC Reserve Config
      btcReserveEnabled: [false],
      btcReserveTargetPct: ['', [Validators.min(0), Validators.max(1)]],
      btcReserveLowerPct: ['', [Validators.min(0), Validators.max(1)]],
      btcReserveUpperPct: ['', [Validators.min(0), Validators.max(1)]],
      btcReserveMaxDailyUsd: ['', [Validators.min(0)]],
      btcReserveMaxTradeUsd: ['', [Validators.min(0)]],
      btcReserveMinTradeUsd: ['', [Validators.min(0)]],
      btcReserveSlippageBps: ['', [Validators.min(0)]],
      btcReserveCooldownSec: ['', [Validators.min(0)]],
      
      // BTC Sweep Config
      btcSweepEnabled: [false],
      btcSweepMaxSweepUsd: ['', [Validators.min(0)]],
      btcSweepMinSweepUsd: ['', [Validators.min(0)]],
      btcSweepReserveBtc: ['', [Validators.min(0)]],
      btcSweepPctOfAvail: ['', [Validators.min(0), Validators.max(1)]],
      btcSweepSlippageBps: ['', [Validators.min(0)]]
    });
  }

  fetchSettings(): void {
    this.loading = true;
    this.error = null;

    this.systemSettingsService.getSystemSettings()
      .pipe(
        catchError(error => {
          this.error = 'Failed to load system settings. Please try again later.';
          return of({ success: false, message: error.message, data: null });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
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
      
      // BTC Sweep Config
      btcSweepEnabled: settings.btcSweepConfig.enabled,
      btcSweepMaxSweepUsd: settings.btcSweepConfig.maxSweepUsd,
      btcSweepMinSweepUsd: settings.btcSweepConfig.minSweepUsd,
      btcSweepReserveBtc: settings.btcSweepConfig.reserveBtc,
      btcSweepPctOfAvail: settings.btcSweepConfig.sweepPctOfAvail,
      btcSweepSlippageBps: settings.btcSweepConfig.slippageBps
    });
  }

  fetchBtcBalance(): void {
    this.loadingBalance = true;
    this.balanceError = null;

    this.systemSettingsService.getBtcChainBalance()
      .pipe(
        catchError(error => {
          this.balanceError = 'Failed to load BTC balance. Please try again later.';
          return of({ success: false, message: error.message, data: null });
        }),
        finalize(() => {
          this.loadingBalance = false;
        })
      )
      .subscribe(response => {
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
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '0.00';
  }

  formatBtc(value: number): string {
    return (value?.toFixed(8) || '0.00000000') + ' BTC';
  }

  formatSmallCurrency(value: number): string {
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }) || '0.000000';
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.settings) {
      this.populateForm(this.settings);
    }
  }

  // saveSettings(): void {
  //   if (this.settingsForm.invalid) {
  //     return;
  //   }

  //   this.loading = true;
  //   const formValue = this.settingsForm.value;
    
  //   const updatedSettings: Partial<EditableSystemSettings> = {
  //     markupRate: formValue.markupRate,
  //     transactionFee: formValue.transactionFee,
  //     minTransactionAmount: formValue.minTransactionAmount,
  //     maxTransactionAmount: formValue.maxTransactionAmount,
  //     dynamicPricingEnabled: formValue.dynamicPricingEnabled,
  //     btcReserveConfig: {
  //       enabled: formValue.btcReserveEnabled,
  //       targetPct: formValue.btcReserveTargetPct,
  //       lowerPct: formValue.btcReserveLowerPct,
  //       upperPct: formValue.btcReserveUpperPct,
  //       maxDailyUsd: formValue.btcReserveMaxDailyUsd,
  //       maxTradeUsd: formValue.btcReserveMaxTradeUsd,
  //       minTradeUsd: formValue.btcReserveMinTradeUsd,
  //       slippageBps: formValue.btcReserveSlippageBps,
  //       cooldownSec: formValue.btcReserveCooldownSec
  //     },
  //     btcSweepConfig: {
  //       enabled: formValue.btcSweepEnabled,
  //       maxSweepUsd: formValue.btcSweepMaxSweepUsd,
  //       minSweepUsd: formValue.btcSweepMinSweepUsd,
  //       reserveBtc: formValue.btcSweepReserveBtc,
  //       sweepPctOfAvail: formValue.btcSweepPctOfAvail,
  //       slippageBps: formValue.btcSweepSlippageBps
  //     }
  //   };

  //   this.systemSettingsService.updateSettings(updatedSettings)
  //     .pipe(
  //       catchError(error => {
  //         this.error = 'Failed to update settings. Please try again later.';
  //         return of({ success: false, message: error.message, data: null });
  //       }),
  //       finalize(() => {
  //         this.loading = false;
  //       })
  //     )
  //     .subscribe(response => {
  //       if (response.success && response.data) {
  //         this.settings = response.data;
  //         this.isEditing = false;
  //         this.error = 'Settings updated successfully!';
  //         setTimeout(() => {
  //           this.error = null;
  //         }, 3000);
  //       }
  //     });
  // }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}