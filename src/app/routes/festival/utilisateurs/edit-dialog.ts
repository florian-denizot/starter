import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserRole } from '@core/models/festival.model';
import { HydratedUser } from '@core/services/festival-data.service';
import { TranslatePipe } from '@ngx-translate/core';

export interface UserEditDialogData {
  user?: HydratedUser;
}

@Component({
  selector: 'app-user-edit-dialog',
  template: `
    <h2 mat-dialog-title>
      {{ data.user ? ('festival.edit_user' | translate) : ('festival.add_user' | translate) }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form pt-8">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.prenom' | translate }}</mat-label>
          <input matInput formControlName="prenom" placeholder="Ex: François" />
          @if (form.get('prenom')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.nom' | translate }}</mat-label>
          <input matInput formControlName="nom" placeholder="Ex: Gagnon" />
          @if (form.get('nom')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.email' | translate }}</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
            placeholder="f.gagnon@bachmontreal.com"
          />
          @if (form.get('email')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>{{ 'validation.invalid_email' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.roles' | translate }}</mat-label>
          <mat-select formControlName="roles" multiple>
            @for (r of allRoles; track r) {
              <mat-option [value]="r">
                {{ 'festival.roles_list.' + r | translate }}
              </mat-option>
            }
          </mat-select>
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
export class UserEditDialog {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<UserEditDialog>);
  readonly data = inject<UserEditDialogData>(MAT_DIALOG_DATA);

  allRoles: UserRole[] = [
    'directeur_production',
    'coordinateur_logistique',
    'directeur_artistique',
    'directeur_excecutif',
    'referant_technique',
    'referant_salle',
    'fournisseur_scene',
    'fournisseur_lumiere',
    'accordeur',
    'location_instrument',
    'transporteur_instrument',
    'location_materiel',
    'chauffeur',
    'artiste',
    'traiteur',
    'photographe',
    'responsable_billetterie',
    'responsable_marketing',
    'bénévole',
  ];

  form = this.fb.group({
    prenom: [this.data.user?.prenom || '', [Validators.required]],
    nom: [this.data.user?.nom || '', [Validators.required]],
    email: [this.data.user?.email || '', [Validators.required, Validators.email]],
    roles: [this.data.user?.roles || []],
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
