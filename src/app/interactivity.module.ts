import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InactivityTimeoutService } from './service/interactivity-timeout.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    InactivityTimeoutService
  ]
})
export class InactivityModule { }