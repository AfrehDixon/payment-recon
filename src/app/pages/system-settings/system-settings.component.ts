import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettings, EditableSystemSettings } from './system-settings.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit {
  settings: SystemSettings | null = null;
  settingsForm: FormGroup;
  loading = false;
  error: string | null = null;
  isEditing = false;

  constructor(
    private systemSettingsService: SystemSettingsService,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.createForm();
  }

  ngOnInit(): void {
    this.fetchSettings();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      markupRate: ['', [Validators.required, Validators.min(0)]],
      transactionFee: ['', [Validators.required, Validators.min(0)]],
      minTransactionAmount: ['', [Validators.required, Validators.min(0)]],
      maxTransactionAmount: ['', [Validators.required, Validators.min(0)]],
      dynamicPricingEnabled: [false]
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
          this.settingsForm.patchValue(response.data);
        }
      });
  }

  formatCurrency(value: number): string {
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.settingsForm.patchValue(this.settings!);
    }
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      return;
    }

    this.loading = true;
    const updatedSettings: Partial<EditableSystemSettings> = this.settingsForm.value;

    this.systemSettingsService.updateSettings(updatedSettings)
      .pipe(
        catchError(error => {
          this.error = 'Failed to update settings. Please try again later.';
          return of({ success: false, message: error.message, data: null });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response.success && response.data) {
          this.settings = response.data;
          this.isEditing = false;
        }
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}