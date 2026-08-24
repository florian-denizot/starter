import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Festival } from '@core/models/festival.model';
import { TranslatePipe } from '@ngx-translate/core';

export interface FestivalEditDialogData {
  festival?: Festival;
}

@Component({
  selector: 'app-festival-edit-dialog',
  template: `
    <h2 mat-dialog-title>
      {{
        data.festival
          ? ('festival.edit_festival' | translate)
          : ('festival.add_festival' | translate)
      }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form pt-8">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.year' | translate }}</mat-label>
          <input matInput formControlName="year" placeholder="Ex: 2026" maxlength="4" />
          @if (form.get('year')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
          @if (form.get('year')?.hasError('pattern')) {
            <mat-error>Veuillez entrer une année valide à 4 chiffres (ex: 2026)</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ 'save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 320px;
    }
    mat-form-field {
      display: block;
      width: 100%;
      margin-bottom: 12px;
    }
  `,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
})
export class FestivalEditDialog {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<FestivalEditDialog>);
  readonly data = inject<FestivalEditDialogData>(MAT_DIALOG_DATA);

  form = this.fb.group({
    year: [
      this.data.festival?.year || new Date().getFullYear().toString(),
      [Validators.required, Validators.pattern(/^[0-9]{4}$/)],
    ],
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close({
        year: this.form.value.year?.trim(),
      });
    }
  }
}
