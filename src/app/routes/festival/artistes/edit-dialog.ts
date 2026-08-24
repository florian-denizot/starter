import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Artist } from '@core/models/festival.model';
import { TranslatePipe } from '@ngx-translate/core';

export interface ArtistEditDialogData {
  artist?: Artist;
}

@Component({
  selector: 'app-artist-edit-dialog',
  template: `
    <h2 mat-dialog-title>
      {{ data.artist ? ('festival.edit_artist' | translate) : ('festival.add_artist' | translate) }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form pt-8">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'name' | translate }}</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex: Bach Collegium Japan (Dir. Masaaki Suzuki)"
          />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
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
export class ArtistEditDialog {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<ArtistEditDialog>);
  readonly data = inject<ArtistEditDialogData>(MAT_DIALOG_DATA);

  form = this.fb.group({
    name: [this.data.artist?.name || '', [Validators.required]],
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
