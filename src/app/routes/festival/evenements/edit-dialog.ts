import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EvenementType, Festival, Lieu, User } from '@core/models/festival.model';
import { FestivalDataService, HydratedEvenement } from '@core/services/festival-data.service';
import { TranslatePipe } from '@ngx-translate/core';
import { QuillEditorComponent } from 'ngx-quill';

export interface EvenementEditDialogData {
  evenement?: HydratedEvenement;
  presetType?: EvenementType;
  fixedType?: boolean;
  defaultIdFestival?: number;
  defaultIdLieu?: number;
  defaultSummary?: string;
  defaultDateDebut?: string;
}

@Component({
  selector: 'app-evenement-edit-dialog',
  template: `
    <h2 mat-dialog-title>
      {{
        data.evenement
          ? ('festival.edit_evenement' | translate)
          : ('festival.add_evenement' | translate)
      }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form pt-8">
        <!-- Summary Field -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.summary' | translate }}</mat-label>
          <input
            matInput
            formControlName="summary"
            placeholder="Ex: Accueil aéroport VIP Maestro Suzuki"
          />
          @if (form.get('summary')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <!-- Festival Edition Select -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.festival' | translate }}</mat-label>
          <mat-select formControlName="id_festival">
            @for (f of festivals; track f.id) {
              <mat-option [value]="f.id">Édition {{ f.year }}</mat-option>
            }
          </mat-select>
          @if (form.get('id_festival')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <!-- Event Type -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.type' | translate }}</mat-label>
          <mat-select formControlName="type">
            @for (t of eventTypes; track t) {
              <mat-option [value]="t">
                {{ 'festival.event_types.' + t | translate }}
              </mat-option>
            }
          </mat-select>
          @if (form.get('type')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <!-- Start Datetime -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.date_debut' | translate }}</mat-label>
          <input matInput type="datetime-local" formControlName="date_debut" />
          @if (form.get('date_debut')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <!-- Checkbox: Pas de date de fin -->
        <div class="mb-12">
          <mat-checkbox formControlName="no_end_date" color="primary">
            {{ 'festival.no_end_date' | translate }}
          </mat-checkbox>
        </div>

        <!-- End Datetime -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.date_fin' | translate }}</mat-label>
          <input matInput type="datetime-local" formControlName="date_fin" />
          @if (form.get('date_fin')?.hasError('required') && !form.get('no_end_date')?.value) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <!-- Venue / Location -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.lieu' | translate }}</mat-label>
          <mat-select formControlName="id_lieu">
            @for (lieu of lieux; track lieu.id) {
              <mat-option [value]="lieu.id">{{ lieu.nom }}</mat-option>
            }
          </mat-select>
          @if (form.get('id_lieu')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <!-- Transfer Specific Fields -->
        @if (form.get('type')?.value === 'transport') {
          <mat-form-field appearance="outline">
            <mat-label>{{ 'festival.destination' | translate }}</mat-label>
            <mat-select formControlName="id_lieu_destination">
              @for (lieu of lieux; track lieu.id) {
                <mat-option [value]="lieu.id">{{ lieu.nom }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'festival.duree_trajet' | translate }}</mat-label>
            <input matInput formControlName="duree_transfert" placeholder="00:30:00 ou 30 min" />
          </mat-form-field>
        }

        <!-- Managers -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.managers' | translate }}</mat-label>
          <mat-select formControlName="manager_ids" multiple>
            @for (u of users; track u.id) {
              <mat-option [value]="u.id">{{ u.prenom }} {{ u.nom }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Participants -->
        <mat-form-field appearance="outline">
          <mat-label>{{ 'festival.participants' | translate }}</mat-label>
          <mat-select formControlName="participant_ids" multiple>
            @for (u of users; track u.id) {
              <mat-option [value]="u.id">{{ u.prenom }} {{ u.nom }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Quill Rich Text Editor for Commentaires Publics -->
        <div class="quill-block mb-16">
          <div class="quill-label font-weight-bold mb-4">
            {{ 'festival.commentaires' | translate }}
          </div>
          <quill-editor
            formControlName="commentaires"
            [modules]="quillModules"
            placeholder="Informations visibles par les participants..."
            style="display: block; min-height: 120px;"
          />
        </div>

        <!-- Quill Rich Text Editor for Commentaires Prod -->
        <div class="quill-block mb-16">
          <div class="quill-label font-weight-bold mb-4 text-primary">
            {{ 'festival.commentaires_prod' | translate }}
          </div>
          <quill-editor
            formControlName="commentaires_prod"
            [modules]="quillModules"
            placeholder="Notes techniques et logistiques internes..."
            style="display: block; min-height: 120px;"
          />
        </div>
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
      min-width: 480px;
    }
    mat-form-field {
      display: block;
      width: 100%;
      margin-bottom: 12px;
    }
    .quill-block {
      display: block;
      width: 100%;
      .quill-label {
        font-size: 13px;
        color: var(--mat-sys-on-surface, #1e293b);
      }
      .ql-container {
        min-height: 100px;
        font-family: inherit;
        font-size: 14px;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
      }
      .ql-toolbar {
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        background: var(--mat-sys-surface-container-low, #f8fafc);
      }
    }
  `,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    QuillEditorComponent,
  ],
})
export class EvenementEditDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly festivalSrv = inject(FestivalDataService);
  readonly dialogRef = inject(MatDialogRef<EvenementEditDialog>);
  readonly data = inject<EvenementEditDialogData>(MAT_DIALOG_DATA);

  lieux: Lieu[] = [];
  users: User[] = [];
  festivals: Festival[] = [];

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  };

  eventTypes: EvenementType[] = [
    'scene_montage',
    'scene_demontage',
    'son_verification',
    'eclairage_montage',
    'eclairage_demontage',
    'eclairage_verification',
    'instrument_livraison',
    'instrument_ramassage',
    'instrument_accordage',
    'loge_installation',
    'loge_rangement',
    'portes_ouverture',
    'portes_fermeture',
    'reunion',
    'transport',
    'cocktail_installation',
    'cocktail_rangement',
    'traiteur_livraison',
    'traiteur_ramassage',
    'bistro_montage',
    'bistro_demontage',
    'billeterie_installation',
    'billeterie_rangement',
    'inventaire_bistro',
    'inventaire_materiel',
    'inventaire_ventes',
    'inventaire_caisses',
    'courses',
  ];

  form = this.fb.group({
    summary: [
      this.data.evenement?.summary || this.data.defaultSummary || '',
      [Validators.required],
    ],
    id_festival: [
      this.data.evenement?.id_festival || this.data.defaultIdFestival || 1,
      [Validators.required],
    ],
    type: [
      {
        value: this.data.evenement?.type || this.data.presetType || 'scene_montage',
        disabled: !!this.data.fixedType,
      },
      [Validators.required],
    ],
    date_debut: [
      this.formatDateForInput(
        this.data.evenement?.date_debut || this.data.defaultDateDebut || new Date().toISOString()
      ),
      [Validators.required],
    ],
    no_end_date: [!this.data.evenement?.date_fin && this.data.evenement?.id ? true : false],
    date_fin: [
      this.formatDateForInput(
        this.data.evenement?.date_fin || this.data.defaultDateDebut || new Date().toISOString()
      ),
      [Validators.required],
    ],
    id_lieu: [
      this.data.evenement?.id_lieu || this.data.defaultIdLieu || null,
      [Validators.required],
    ],
    id_lieu_destination: [this.data.evenement?.transfert?.id_lieu_destination || null],
    duree_transfert: [this.data.evenement?.transfert?.duree || '00:30:00'],
    manager_ids: [
      this.data.evenement?.participantsList?.filter(p => p.manager).map(p => p.id_utilisateur) ||
        [],
    ],
    participant_ids: [
      this.data.evenement?.participantsList?.filter(p => !p.manager).map(p => p.id_utilisateur) ||
        [],
    ],
    commentaires: [this.data.evenement?.commentaires || ''],
    commentaires_prod: [this.data.evenement?.commentaires_prod || ''],
  });

  ngOnInit() {
    this.festivalSrv.getLieux().subscribe(l => (this.lieux = l));
    this.festivalSrv.getUsers().subscribe(u => (this.users = u));
    this.festivalSrv.getFestivals().subscribe(f => {
      this.festivals = f;
      if (!this.form.get('id_festival')?.value && f.length > 0) {
        this.form.patchValue({ id_festival: f[0].id });
      }
    });

    // Handle no_end_date toggle
    this.form.get('no_end_date')?.valueChanges.subscribe(noEnd => {
      const dateFinCtrl = this.form.get('date_fin');
      if (noEnd) {
        dateFinCtrl?.setValue('');
        dateFinCtrl?.disable();
        dateFinCtrl?.clearValidators();
      } else {
        dateFinCtrl?.enable();
        dateFinCtrl?.setValidators([Validators.required]);
      }
      dateFinCtrl?.updateValueAndValidity();
    });

    if (this.form.get('no_end_date')?.value) {
      this.form.get('date_fin')?.disable();
      this.form.get('date_fin')?.clearValidators();
    }
  }

  private formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  save() {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const managerIds: number[] = val.manager_ids || [];
      const participantIds: number[] = val.participant_ids || [];

      const participants: { id_utilisateur: number; manager: boolean }[] = [
        ...managerIds.map(id => ({ id_utilisateur: id, manager: true })),
        ...participantIds
          .filter(id => !managerIds.includes(id))
          .map(id => ({ id_utilisateur: id, manager: false })),
      ];

      const transfert =
        val.type === 'transport' && val.id_lieu_destination
          ? {
              id_lieu_destination: Number(val.id_lieu_destination),
              duree: val.duree_transfert || '00:30:00',
            }
          : undefined;

      this.dialogRef.close({
        evenement: {
          summary: val.summary?.trim() || '',
          id_festival: Number(val.id_festival),
          type: val.type as EvenementType,
          date_debut: val.date_debut,
          date_fin: val.no_end_date ? '' : val.date_fin || '',
          id_lieu: Number(val.id_lieu),
          commentaires: val.commentaires || '',
          commentaires_prod: val.commentaires_prod || '',
          gcal_id: this.data.evenement?.gcal_id || '',
        },
        transfert,
        participants,
      });
    }
  }
}
