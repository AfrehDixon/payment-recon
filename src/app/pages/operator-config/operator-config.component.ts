import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EAccountType, EOperator, OperatorConfig } from './operator-config.interface';
import { OperatorConfigService } from '../../service/operator-config.service';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EAccountIssuer } from '../charge-config/charge-config.interface';

@Component({
  selector: 'app-operator-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './operator-config.component.html',
  styleUrls: ['./operator-config.component.scss']
})
export class OperatorConfigComponent implements OnInit {
  configForm!: FormGroup;
  operatorConfigs: OperatorConfig[] = [];
  merchants: any[] = [];
  accountTypes = Object.values(EAccountType);
  operators = Object.values(EOperator);
  isEditing = false;
  currentConfigId: string | null = null;
  loading = false;
  showForm = false;
  filterForm!: FormGroup;
  filteredConfigs: OperatorConfig[] = [];
  accountIssuers = Object.values(EAccountIssuer);
  

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private fb: FormBuilder,
    private service: OperatorConfigService,
  ) {
    this.initForm();
    this.initFilterForm();
  }

  ngOnInit() {
    this.loadOperatorConfigs();
    this.loadMerchants();
    this.setupFilterSubscriptions();
  }

  private initForm() {
    this.configForm = this.fb.group({
      name: ['', Validators.required],
      merchantId: [null],
      accountTypes: [[], Validators.required],
      operator: ['', Validators.required],
      isActive: [true],
      priority: [0],
      accountIssuers: [[], Validators.required],
    //   supportedCurrencies: [[]],
    //   transactionLimits: this.fb.group({
    //     minAmount: [null],
    //     maxAmount: [null],
    //     dailyLimit: [null]
    //   })
    });
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      search: [''],
      merchantId: [''],
      accountIssuer: [''],
      transactionType: [''],
      calculationMethod: ['']
    });
  }

  isAccountTypeSelected(type: string): boolean {
    const selectedTypes = this.configForm.get('accountTypes')?.value || [];
    return selectedTypes.includes(type);
  }
  
  toggleAccountType(type: string) {
    const accountTypesControl = this.configForm.get('accountTypes');
    const currentTypes = accountTypesControl?.value || [];
    
    if (currentTypes.includes(type)) {
      // Remove type if already selected
    accountTypesControl?.setValue(currentTypes.filter((t: string) => t !== type));
    } else {
      // Add type if not selected
      accountTypesControl?.setValue([...currentTypes, type]);
    }
  }

    private setupFilterSubscriptions() {
      // Subscribe to search input changes with debounce
      this.filterForm.get('search')?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        console.log("Search filter updated");
        this.applyFilters();
      });
    
      // Subscribe to dropdown changes
      ['merchantId', 'accountIssuer', 'transactionType', 'calculationMethod'].forEach(control => {
        this.filterForm.get(control)?.valueChanges.subscribe(value => {
          console.log(`${control} filter updated: `, value);
          this.applyFilters();
        });
      });
    
      // Apply filters immediately on initialization
      setTimeout(() => this.applyFilters(), 0);
    }

    toggleAccountIssuer(issuer: string) {
      const control = this.configForm.get('accountIssuers');
      const currentValues = control?.value || [];
      
      if (currentValues.includes(issuer)) {
        control?.setValue(currentValues.filter((v: string) => v !== issuer));
      } else {
        control?.setValue([...currentValues, issuer]);
      }
    }

    isAccountIssuerSelected(issuer: string): boolean {
      return (this.configForm.get('accountIssuers')?.value || []).includes(issuer);
    }


    private applyFilters() {
      const filters = this.filterForm.value;
      console.log("Filters applied: ", filters);
    
      setTimeout(() => { // Ensure values are fully updated before filtering
        this.filteredConfigs = this.operatorConfigs.filter(config => {
          let matches = true;
    
          // Search text
          if (filters.search && filters.search.trim()) {
            const searchLower = filters.search.toLowerCase();
            const merchantName = this.getMerchantName(config.merchantId || '').toLowerCase();
    
            matches = matches && (
              config.name.toLowerCase().includes(searchLower) ||
              merchantName.includes(searchLower) ||
              // config.name.some(issuer => issuer.toLowerCase().includes(searchLower)) ||
              config.accountTypes.some(type => type.toLowerCase().includes(searchLower))
            );
          }
    
          // Merchant filter
          if (filters.merchantId && filters.merchantId !== '') {
            matches = matches && (config.merchantId === filters.merchantId || (filters.merchantId === 'global' && config.merchantId === null));
          }
    
          // Account issuer filter
          if (filters.accountIssuer && filters.accountIssuer !== '') {
            matches = matches && config.operator.includes(filters.accountIssuer);
          }
    
          // Transaction type filter
          if (filters.transactionType && filters.transactionType !== '') {
            matches = matches && config.accountTypes.includes(filters.transactionType);
          }
    
          // Calculation method filter
          // if (filters.calculationMethod && filters.calculationMethod !== '') {
          //   matches = matches && config.calculationMethod === filters.calculationMethod;
          // }
    
          return matches;
        });
    
        console.log("Filtered results: ", this.filteredConfigs);
    
        this.totalItems = this.filteredConfigs.length;
        this.currentPage = 1; // Reset pagination when filters change
      });
    }

    clearFilters() {
      this.filterForm.reset({
        search: '',
        merchantId: '',
        accountIssuer: '',
        transactionType: '',
        calculationMethod: ''
      });
      this.applyFilters();
    }

  loadOperatorConfigs() {
    this.loading = true;
    this.service.getOperatorConfigs().subscribe({
      next: (response) => {
        this.operatorConfigs = response.data;
        this.filteredConfigs = [...this.operatorConfigs]; // Initialize filtered configs
        this.totalItems = this.operatorConfigs.length;
        this.loading = false;

        this.applyFilters();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

    get paginatedConfigs(): OperatorConfig[] {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      return this.filteredConfigs.slice(startIndex, startIndex + this.pageSize);
    }
  
    get totalPages(): number {
      return Math.ceil(this.totalItems / this.pageSize);
    }

  getMerchantName(merchantId: string): string {
    const merchant = this.merchants.find(m => m._id === merchantId);
    return merchant ? merchant.merchant_tradeName : '';
  }

  loadMerchants() {
    this.service.getMerchants().subscribe({
      next: (response) => {
        this.merchants = response.data;
      },
      error: () => {}
    });
  }

  onSubmit() {
    if (this.configForm.invalid) return;

    this.loading = true;
    const config = this.configForm.value;
    const operation = this.isEditing
      ? this.service.updateOperatorConfig(this.currentConfigId!, config)
      : this.service.createOperatorConfig(config);

    operation.subscribe({
      next: () => {
        this.resetForm();
        this.loadOperatorConfigs();
        this.showForm = false;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editConfig(config: OperatorConfig) {
    this.isEditing = true;
    this.showForm = true;
    this.currentConfigId = config._id ?? null;
    this.configForm.patchValue(config);
  }

  resetForm() {
    this.isEditing = false;
    this.currentConfigId = null;
    this.showForm = false;
    this.configForm.reset({
      isActive: true,
      priority: 0,
      supportedCurrencies: [],
      accountTypes: []
    });
  }
}