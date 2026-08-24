import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Lieu, LieuType } from '@core/models/festival.model';
import { TranslatePipe } from '@ngx-translate/core';

export interface LieuEditDialogData {
  lieu?: Lieu;
}

@Component({
  selector: 'app-lieu-edit-dialog',
  template: `
    <h2 mat-dialog-title>
      {{ data.lieu ? ('festival.edit_lieu' | translate) : ('festival.add_lieu' | translate) }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form pt-8">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'name' | translate }}</mat-label>
          <input matInput formControlName="nom" placeholder="Ex: Maison symphonique de Montréal" />
          @if (form.get('nom')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.type_lieu' | translate }}</mat-label>
          <mat-select formControlName="type">
            @for (t of lieuTypes; track t) {
              <mat-option [value]="t">
                {{ 'festival.lieu_types.' + t | translate }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.gmap_lien' | translate }}</mat-label>
          <input
            matInput
            formControlName="gmap_lien"
            placeholder="https://maps.google.com/?q=..."
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.gcal_id' | translate }}</mat-label>
          <input matInput formControlName="gcal_id" placeholder="Ex: c_scene_1@bachmontreal.com" />
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
    MatSelectModule,
    TranslatePipe,
  ],
})
export class LieuEditDialog {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<LieuEditDialog>);
  readonly data = inject<LieuEditDialogData>(MAT_DIALOG_DATA);

  lieuTypes: LieuType[] = ['salle_concert', 'hotel', 'aeroport', 'gare', 'autre'];

  form = this.fb.group({
    nom: [this.data.lieu?.nom || '', [Validators.required]],
    type: [this.data.lieu?.type || 'salle_concert', [Validators.required]],
    gmap_lien: [this.data.lieu?.gmap_lien || ''],
    gcal_id: [this.data.lieu?.gcal_id || ''],
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
