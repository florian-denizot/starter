import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Artist,
  EvenementType,
  Festival,
  Lieu,
  Participant,
  User,
} from '@core/models/festival.model';
import {
  FestivalDataService,
  HydratedConcert,
  HydratedEvenement,
} from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader, SafeHtmlPipe } from '@shared';
import { QuillEditorComponent } from 'ngx-quill';
import { EvenementEditDialog } from '../evenements/edit-dialog';

@Component({
  selector: 'app-concert-form',
  templateUrl: './concert-form.html',
  styleUrl: './concert-form.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatTooltipModule,
    PageHeader,
    SafeHtmlPipe,
    TranslatePipe,
    QuillEditorComponent,
  ],
})
export class ConcertFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly dialog = inject(MatDialog);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  isEdit = false;
  concertId: number | null = null;
  currentConcert?: HydratedConcert;
  isSaving = false;
  pageTitle = '';

  festivals: Festival[] = [];
  lieux: Lieu[] = [];
  artists: Artist[] = [];
  eventsMap = new Map<number, HydratedEvenement>();

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  };

  form = this.fb.group({
    nom: ['', [Validators.required]],
    id_festival: [1, [Validators.required]],
    date: ['', [Validators.required]],
    duree: ['02:00:00'],
    id_lieu: [null as number | null, [Validators.required]],
    formation: [''],
    artist_ids: [[] as number[]],
    scene_besoin: [''],
    scene_plan: [''],
    scene_commentaires: [''],
    id_scene_montage: [null as number | null],
    id_scene_demontage: [null as number | null],
    id_son_verification: [null as number | null],
    eclairage_besoin: [''],
    eclairage_commentaires: [''],
    id_eclairage_montage: [null as number | null],
    id_eclairage_demontage: [null as number | null],
    id_eclairage_verification: [null as number | null],
    logistique: [''],
    id_repetition: [null as number | null],
    id_porte_ouverture: [null as number | null],
    id_porte_fermeture: [null as number | null],
    id_cocktail_installation: [null as number | null],
    id_cocktail_rangement: [null as number | null],
    id_marchandise_montage: [null as number | null],
    id_marchandise_demontage: [null as number | null],
    id_bistro_montage: [null as number | null],
    id_bistro_demontage: [null as number | null],
    instruments: this.fb.array([]),
    loges: this.fb.array([]),
    transport_event_ids: [[] as number[]],
  });

  get instrumentsArray(): FormArray {
    return this.form.get('instruments') as FormArray;
  }

  get logesArray(): FormArray {
    return this.form.get('loges') as FormArray;
  }

  ngOnInit() {
    this.pageTitle = this.translate.instant('festival.add_concert');

    this.festivalSrv.getFestivals().subscribe(f => {
      this.festivals = f;
      if (!this.form.get('id_festival')?.value && f.length > 0) {
        this.form.patchValue({ id_festival: f[0].id });
      }
    });

    this.festivalSrv.getLieux().subscribe(l => (this.lieux = l));
    this.festivalSrv.getArtists().subscribe(a => (this.artists = a));
    this.loadEvents();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.concertId = Number(idParam);
      this.loadConcert(this.concertId);
    } else {
      this.form.patchValue({
        date: this.formatDateForInput(new Date().toISOString()),
      });
    }
  }

  loadEvents() {
    this.festivalSrv.getHydratedEvenements().subscribe(evts => {
      this.eventsMap.clear();
      evts.forEach(e => this.eventsMap.set(e.id, e));
    });
  }

  getEvent(id?: number | null): HydratedEvenement | undefined {
    if (!id) return undefined;
    return this.eventsMap.get(id);
  }

  createEventForSlot(controlName: string, type: EvenementType, defaultSummary: string) {
    const concertNom = this.form.value.nom?.trim();
    const summary = concertNom ? `${defaultSummary} - ${concertNom}` : defaultSummary;

    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: {
        presetType: type,
        fixedType: true,
        defaultSummary: summary,
        defaultIdFestival: this.form.value.id_festival || 1,
        defaultIdLieu: this.form.value.id_lieu || undefined,
        defaultDateDebut: this.form.value.date || undefined,
      },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .addEvenement(res.evenement, res.transfert, res.participants)
          .subscribe(newEvent => {
            this.eventsMap.set(newEvent.id, newEvent as HydratedEvenement);
            this.form.patchValue({ [controlName]: newEvent.id });
            this.loadEvents();
          });
      }
    });
  }

  editEvent(id: number) {
    const evt = this.getEvent(id);
    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: {
        evenement: evt,
        fixedType: true,
      },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .updateEvenement({ ...res.evenement, id }, res.transfert, res.participants)
          .subscribe(() => {
            this.loadEvents();
          });
      }
    });
  }

  unlinkEvent(controlName: string) {
    this.form.patchValue({ [controlName]: null });
  }

  deleteEvent(id: number, controlName?: string) {
    const evt = this.getEvent(id);
    const title = evt?.summary || `#${id}`;
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), title, () => {
      this.festivalSrv.deleteEvenement(id).subscribe(() => {
        if (controlName) {
          this.form.patchValue({ [controlName]: null });
        }
        this.eventsMap.delete(id);
        this.loadEvents();
      });
    });
  }

  createEventForInstrument(
    instIndex: number,
    field: string,
    type: EvenementType,
    instName: string
  ) {
    const concertNom = this.form.value.nom?.trim();
    const typeLabel = this.translate.instant('festival.event_types.' + type);
    const summary = `${typeLabel} ${instName}${concertNom ? ' - ' + concertNom : ''}`;

    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: {
        presetType: type,
        fixedType: true,
        defaultSummary: summary,
        defaultIdFestival: this.form.value.id_festival || 1,
        defaultIdLieu: this.form.value.id_lieu || undefined,
        defaultDateDebut: this.form.value.date || undefined,
      },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .addEvenement(res.evenement, res.transfert, res.participants)
          .subscribe(newEvent => {
            this.eventsMap.set(newEvent.id, newEvent as HydratedEvenement);
            this.instrumentsArray.at(instIndex).patchValue({ [field]: newEvent.id });
            this.loadEvents();
          });
      }
    });
  }

  unlinkEventFromInstrument(instIndex: number, field: string) {
    this.instrumentsArray.at(instIndex).patchValue({ [field]: null });
  }

  deleteEventFromInstrument(instIndex: number, field: string, id: number) {
    const evt = this.getEvent(id);
    const title = evt?.summary || `#${id}`;
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), title, () => {
      this.festivalSrv.deleteEvenement(id).subscribe(() => {
        this.instrumentsArray.at(instIndex).patchValue({ [field]: null });
        this.eventsMap.delete(id);
        this.loadEvents();
      });
    });
  }

  createEventForLoge(logeIndex: number, field: string, type: EvenementType, logeName: string) {
    const concertNom = this.form.value.nom?.trim();
    const typeLabel = this.translate.instant('festival.event_types.' + type);
    const summary = `${typeLabel} ${logeName}${concertNom ? ' - ' + concertNom : ''}`;

    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: {
        presetType: type,
        fixedType: true,
        defaultSummary: summary,
        defaultIdFestival: this.form.value.id_festival || 1,
        defaultIdLieu: this.form.value.id_lieu || undefined,
        defaultDateDebut: this.form.value.date || undefined,
      },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .addEvenement(res.evenement, res.transfert, res.participants)
          .subscribe(newEvent => {
            this.eventsMap.set(newEvent.id, newEvent as HydratedEvenement);
            this.logesArray.at(logeIndex).patchValue({ [field]: newEvent.id });
            this.loadEvents();
          });
      }
    });
  }

  unlinkEventFromLoge(logeIndex: number, field: string) {
    this.logesArray.at(logeIndex).patchValue({ [field]: null });
  }

  deleteEventFromLoge(logeIndex: number, field: string, id: number) {
    const evt = this.getEvent(id);
    const title = evt?.summary || `#${id}`;
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), title, () => {
      this.festivalSrv.deleteEvenement(id).subscribe(() => {
        this.logesArray.at(logeIndex).patchValue({ [field]: null });
        this.eventsMap.delete(id);
        this.loadEvents();
      });
    });
  }

  createTransportEvent() {
    const concertNom = this.form.value.nom?.trim();
    const summary = `Transfert / Navette${concertNom ? ' - ' + concertNom : ''}`;

    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: {
        presetType: 'transport',
        fixedType: true,
        defaultSummary: summary,
        defaultIdFestival: this.form.value.id_festival || 1,
        defaultIdLieu: this.form.value.id_lieu || undefined,
        defaultDateDebut: this.form.value.date || undefined,
      },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .addEvenement(res.evenement, res.transfert, res.participants)
          .subscribe(newEvent => {
            this.eventsMap.set(newEvent.id, newEvent as HydratedEvenement);
            const currentIds = (this.form.value.transport_event_ids || []) as number[];
            this.form.patchValue({ transport_event_ids: [...currentIds, newEvent.id] });
            this.loadEvents();
          });
      }
    });
  }

  unlinkTransportEvent(id: number) {
    const currentIds = (this.form.value.transport_event_ids || []) as number[];
    this.form.patchValue({
      transport_event_ids: currentIds.filter(i => i !== id),
    });
  }

  deleteTransportEvent(id: number) {
    const evt = this.getEvent(id);
    const title = evt?.summary || `#${id}`;
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), title, () => {
      this.festivalSrv.deleteEvenement(id).subscribe(() => {
        this.unlinkTransportEvent(id);
        this.eventsMap.delete(id);
        this.loadEvents();
      });
    });
  }

  getManagers(evt: HydratedEvenement): (Participant & { user?: User })[] {
    return evt.participantsList?.filter(p => p.manager) || [];
  }

  getNonManagers(evt: HydratedEvenement): (Participant & { user?: User })[] {
    return evt.participantsList?.filter(p => !p.manager) || [];
  }

  getEventTypeColor(type: EvenementType): 'primary' | 'accent' | 'warn' | undefined {
    if (type.includes('montage') || type.includes('demontage') || type.includes('verification')) {
      return 'primary';
    }
    if (type.includes('instrument') || type.includes('loge')) {
      return 'accent';
    }
    if (type.includes('portes') || type.includes('bistro') || type.includes('cocktail')) {
      return 'warn';
    }
    return undefined;
  }

  private loadConcert(id: number) {
    this.festivalSrv.getHydratedConcerts().subscribe(concerts => {
      const concert = concerts.find(c => c.id === id);
      if (!concert) {
        this.router.navigate(['/festival/concerts']);
        return;
      }

      this.currentConcert = concert;
      this.pageTitle = `${this.translate.instant('festival.edit_concert')} : ${concert.nom}`;

      this.form.patchValue({
        nom: concert.nom,
        id_festival: concert.id_festival || 1,
        date: this.formatDateForInput(concert.date),
        duree: concert.duree,
        id_lieu: concert.id_lieu,
        formation: concert.formation,
        artist_ids: concert.artists.map(a => a.id),
        scene_besoin: concert.scene_besoin,
        scene_plan: concert.scene_plan,
        scene_commentaires: concert.scene_commentaires,
        id_scene_montage: concert.id_scene_montage || null,
        id_scene_demontage: concert.id_scene_demontage || null,
        id_son_verification: concert.id_son_verification || null,
        eclairage_besoin: concert.eclairage_besoin,
        eclairage_commentaires: concert.eclairage_commentaires,
        id_eclairage_montage: concert.id_eclairage_montage || null,
        id_eclairage_demontage: concert.id_eclairage_demontage || null,
        id_eclairage_verification: concert.id_eclairage_verification || null,
        logistique: concert.logistique,
        id_repetition: concert.id_repetition || null,
        id_porte_ouverture: concert.id_porte_ouverture || null,
        id_porte_fermeture: concert.id_porte_fermeture || null,
        id_cocktail_installation: concert.id_cocktail_installation || null,
        id_cocktail_rangement: concert.id_cocktail_rangement || null,
        id_marchandise_montage: concert.id_marchandise_montage || null,
        id_marchandise_demontage: concert.id_marchandise_demontage || null,
        id_bistro_montage: concert.id_bistro_montage || null,
        id_bistro_demontage: concert.id_bistro_demontage || null,
        transport_event_ids: concert.transports?.map(t => t.id) || [],
      });

      this.instrumentsArray.clear();
      if (concert.instruments) {
        concert.instruments.forEach(inst => {
          this.instrumentsArray.push(
            this.fb.group({
              id: [inst.id],
              name: [inst.name, [Validators.required]],
              id_instrument_livraison: [inst.id_instrument_livraison || null],
              id_instrument_ramassage: [inst.id_instrument_ramassage || null],
              id_instrument_accordage: [inst.id_instrument_accordage || null],
            })
          );
        });
      }

      this.logesArray.clear();
      if (concert.loges) {
        concert.loges.forEach(loge => {
          this.logesArray.push(
            this.fb.group({
              id: [loge.id],
              nom: [loge.nom, [Validators.required]],
              id_artist: [loge.id_artist || null, [Validators.required]],
              id_loge_installation: [loge.id_loge_installation || null],
              id_loge_rangement: [loge.id_loge_rangement || null],
            })
          );
        });
      }
    });
  }

  addInstrument() {
    this.instrumentsArray.push(
      this.fb.group({
        name: ['', [Validators.required]],
        id_instrument_livraison: [null],
        id_instrument_ramassage: [null],
        id_instrument_accordage: [null],
      })
    );
  }

  removeInstrument(index: number) {
    this.instrumentsArray.removeAt(index);
  }

  addLoge() {
    this.logesArray.push(
      this.fb.group({
        nom: ['', [Validators.required]],
        id_artist: [this.artists.length > 0 ? this.artists[0].id : null, [Validators.required]],
        id_loge_installation: [null],
        id_loge_rangement: [null],
      })
    );
  }

  removeLoge(index: number) {
    this.logesArray.removeAt(index);
  }

  private formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  save() {
    if (this.form.invalid) return;

    this.isSaving = true;
    const val = this.form.getRawValue();

    const concertData = {
      nom: val.nom?.trim() || '',
      id_festival: Number(val.id_festival),
      date: val.date || '',
      duree: val.duree || '',
      id_lieu: Number(val.id_lieu),
      formation: val.formation || '',
      scene_besoin: val.scene_besoin || '',
      scene_plan: val.scene_plan || '',
      scene_commentaires: val.scene_commentaires || '',
      id_scene_montage: val.id_scene_montage ? Number(val.id_scene_montage) : 0,
      id_scene_demontage: val.id_scene_demontage ? Number(val.id_scene_demontage) : 0,
      id_son_verification: val.id_son_verification ? Number(val.id_son_verification) : 0,
      eclairage_besoin: val.eclairage_besoin || '',
      eclairage_commentaires: val.eclairage_commentaires || '',
      id_eclairage_montage: val.id_eclairage_montage ? Number(val.id_eclairage_montage) : 0,
      id_eclairage_demontage: val.id_eclairage_demontage ? Number(val.id_eclairage_demontage) : 0,
      id_eclairage_verification: val.id_eclairage_verification
        ? Number(val.id_eclairage_verification)
        : 0,
      logistique: val.logistique || '',
      id_repetition: val.id_repetition ? Number(val.id_repetition) : 0,
      id_porte_ouverture: val.id_porte_ouverture ? Number(val.id_porte_ouverture) : 0,
      id_porte_fermeture: val.id_porte_fermeture ? Number(val.id_porte_fermeture) : 0,
      id_cocktail_installation: val.id_cocktail_installation
        ? Number(val.id_cocktail_installation)
        : 0,
      id_cocktail_rangement: val.id_cocktail_rangement ? Number(val.id_cocktail_rangement) : 0,
      id_marchandise_montage: val.id_marchandise_montage ? Number(val.id_marchandise_montage) : 0,
      id_marchandise_demontage: val.id_marchandise_demontage
        ? Number(val.id_marchandise_demontage)
        : 0,
      id_bistro_montage: val.id_bistro_montage ? Number(val.id_bistro_montage) : 0,
      id_bistro_demontage: val.id_bistro_demontage ? Number(val.id_bistro_demontage) : 0,
    };

    const artistIds = (val.artist_ids || []).map((id: string | number) => Number(id));
    const instruments = ((val.instruments as any[]) || []).map(inst => ({
      id: inst.id,
      name: inst.name || '',
      id_instrument_livraison: inst.id_instrument_livraison
        ? Number(inst.id_instrument_livraison)
        : 0,
      id_instrument_ramassage: inst.id_instrument_ramassage
        ? Number(inst.id_instrument_ramassage)
        : 0,
      id_instrument_accordage: inst.id_instrument_accordage
        ? Number(inst.id_instrument_accordage)
        : 0,
    }));
    const loges = ((val.loges as any[]) || []).map(loge => ({
      id: loge.id,
      id_artist: Number(loge.id_artist),
      nom: loge.nom || '',
      id_loge_installation: loge.id_loge_installation ? Number(loge.id_loge_installation) : 0,
      id_loge_rangement: loge.id_loge_rangement ? Number(loge.id_loge_rangement) : 0,
    }));
    const transportEventIds = (val.transport_event_ids || []).map((id: string | number) =>
      Number(id)
    );

    if (this.isEdit && this.concertId) {
      this.festivalSrv
        .updateConcert(
          { ...concertData, id: this.concertId },
          artistIds,
          instruments,
          loges,
          transportEventIds
        )
        .subscribe(() => {
          this.isSaving = false;
          this.router.navigate(['/festival/concerts']);
        });
    } else {
      this.festivalSrv
        .addConcert(concertData, artistIds, instruments, loges, transportEventIds)
        .subscribe(() => {
          this.isSaving = false;
          this.router.navigate(['/festival/concerts']);
        });
    }
  }
}
