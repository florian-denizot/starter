import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EvenementType, Participant, User } from '@core/models/festival.model';
import { FestivalDataService, HydratedEvenement } from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader, SafeHtmlPipe } from '@shared';
import { EvenementEditDialog } from './edit-dialog';

@Component({
  selector: 'app-festival-evenements',
  templateUrl: './evenements.html',
  styleUrl: './evenements.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MtxGridModule,
    PageHeader,
    SafeHtmlPipe,
    TranslatePipe,
  ],
})
export class EvenementsComponent implements OnInit {
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly dialog = inject(MatDialog);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly translate = inject(TranslateService);

  list: HydratedEvenement[] = [];
  filteredList: HydratedEvenement[] = [];
  users: User[] = [];
  isLoading = true;

  // Filters
  searchQuery = '';
  selectedType: EvenementType | '' = '';
  selectedUserId: number | null = null;
  dateFrom = '';
  dateTo = '';

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

  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '65px',
    },
    {
      header: this.translate.stream('festival.type'),
      field: 'type',
      sortable: true,
      minWidth: 180,
    },
    {
      header: this.translate.stream('festival.horaires'),
      field: 'date_debut',
      sortable: true,
      minWidth: 150,
    },
    {
      header: this.translate.stream('festival.lieu'),
      field: 'lieu',
      minWidth: 200,
    },
    {
      header: this.translate.stream('festival.managers'),
      field: 'managers',
      minWidth: 180,
    },
    {
      header: this.translate.stream('festival.participants'),
      field: 'participants',
      minWidth: 180,
    },
    {
      header: this.translate.stream('festival.commentaires'),
      field: 'commentaires',
      minWidth: 180,
    },
    {
      header: this.translate.stream('festival.commentaires_prod'),
      field: 'commentaires_prod',
      minWidth: 180,
    },
    {
      header: this.translate.stream('actions'),
      field: 'actions',
      pinned: 'right',
      width: '110px',
    },
  ];

  ngOnInit() {
    this.festivalSrv.getUsers().subscribe(u => (this.users = u));
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.festivalSrv.getHydratedEvenements().subscribe(events => {
      this.list = events.sort(
        (a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
      );
      this.filterList();
      this.isLoading = false;
    });
  }

  filterList() {
    const q = this.searchQuery.trim().toLowerCase();

    this.filteredList = this.list.filter(evt => {
      // 1. Text Search
      let matchQuery = true;
      if (q) {
        const typeMatch = evt.type.toLowerCase().includes(q);
        const commentsMatch = evt.commentaires?.toLowerCase().includes(q);
        const commentsProdMatch = evt.commentaires_prod?.toLowerCase().includes(q);
        const lieuMatch = evt.lieu?.nom.toLowerCase().includes(q);
        const destMatch = evt.transfert?.destination?.nom.toLowerCase().includes(q);
        const participantMatch = evt.participantsList.some(
          p => p.user?.prenom.toLowerCase().includes(q) || p.user?.nom.toLowerCase().includes(q)
        );
        matchQuery = !!(
          typeMatch ||
          commentsMatch ||
          commentsProdMatch ||
          lieuMatch ||
          destMatch ||
          participantMatch
        );
      }

      // 2. Type Filter
      const matchType = !this.selectedType || evt.type === this.selectedType;

      // 3. User Filter
      const matchUser =
        !this.selectedUserId ||
        evt.participantsList.some(p => p.id_utilisateur === this.selectedUserId);

      // 4. Date From Filter
      let matchDateFrom = true;
      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom).setHours(0, 0, 0, 0);
        const evtDate = new Date(evt.date_debut).getTime();
        matchDateFrom = evtDate >= fromDate;
      }

      // 5. Date To Filter
      let matchDateTo = true;
      if (this.dateTo) {
        const toDate = new Date(this.dateTo).setHours(23, 59, 59, 999);
        const dateStr = evt.date_fin || evt.date_debut;
        const evtDate = new Date(dateStr).getTime();
        matchDateTo = evtDate <= toDate;
      }

      return matchQuery && matchType && matchUser && matchDateFrom && matchDateTo;
    });
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery.trim() ||
      this.selectedType ||
      this.selectedUserId ||
      this.dateFrom ||
      this.dateTo
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedUserId = null;
    this.dateFrom = '';
    this.dateTo = '';
    this.filterList();
  }

  getManagers(evt: HydratedEvenement): (Participant & { user?: User })[] {
    return evt.participantsList.filter(p => p.manager);
  }

  getNonManagers(evt: HydratedEvenement): (Participant & { user?: User })[] {
    return evt.participantsList.filter(p => !p.manager);
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
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

  openAddDialog() {
    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: {},
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .addEvenement(res.evenement, res.transfert, res.participants)
          .subscribe(() => this.loadData());
      }
    });
  }

  openEditDialog(evt: HydratedEvenement) {
    const dialogRef = this.dialog.open(EvenementEditDialog, {
      width: '680px',
      data: { evenement: evt },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.festivalSrv
          .updateEvenement({ ...res.evenement, id: evt.id }, res.transfert, res.participants)
          .subscribe(() => this.loadData());
      }
    });
  }

  deleteEvenement(evt: HydratedEvenement) {
    this.mtxDialog.confirm(
      this.translate.instant('confirm_delete'),
      `#${evt.id} - ${this.translate.instant('festival.event_types.' + evt.type)}`,
      () => {
        this.festivalSrv.deleteEvenement(evt.id).subscribe(() => this.loadData());
      }
    );
  }
}
