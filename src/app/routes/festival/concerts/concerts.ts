import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Festival, Lieu } from '@core/models/festival.model';
import { FestivalDataService, HydratedConcert } from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';

@Component({
  selector: 'app-festival-concerts',
  templateUrl: './concerts.html',
  styleUrl: './concerts.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
    TranslatePipe,
  ],
})
export class ConcertsComponent implements OnInit {
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly translate = inject(TranslateService);

  list: HydratedConcert[] = [];
  filteredList: HydratedConcert[] = [];
  festivals: Festival[] = [];
  lieux: Lieu[] = [];
  isLoading = true;

  searchQuery = '';
  selectedFestivalId: number | null = null;
  selectedLieuId: number | null = null;

  columns: MtxGridColumn[] = [
    {
      header: this.translate.stream('festival.concert_name'),
      field: 'nom',
      sortable: true,
      minWidth: 260,
      pinned: 'left',
    },
    {
      header: this.translate.stream('date'),
      field: 'date',
      sortable: true,
      minWidth: 160,
    },
    {
      header: this.translate.stream('festival.lieu'),
      field: 'lieu',
      minWidth: 200,
    },
    {
      header: this.translate.stream('festival.artists'),
      field: 'artists',
      minWidth: 220,
    },
    {
      header: this.translate.stream('festival.formation'),
      field: 'formation',
      minWidth: 220,
    },
    {
      header: this.translate.stream('festival.technical_rider'),
      field: 'regie',
      minWidth: 240,
    },
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '65px',
    },
    {
      header: this.translate.stream('actions'),
      field: 'actions',
      pinned: 'right',
      width: '110px',
      disabled: true,
    },
  ];

  ngOnInit() {
    this.festivalSrv.getFestivals().subscribe(f => (this.festivals = f));
    this.festivalSrv.getLieux().subscribe(l => (this.lieux = l));
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.festivalSrv.getHydratedConcerts().subscribe(concerts => {
      this.list = concerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.filterList();
      this.isLoading = false;
    });
  }

  filterList() {
    const q = this.searchQuery.trim().toLowerCase();

    this.filteredList = this.list.filter(c => {
      let matchQuery = true;
      if (q) {
        const nomMatch = c.nom.toLowerCase().includes(q);
        const formationMatch = c.formation?.toLowerCase().includes(q);
        const lieuMatch = c.lieu?.nom.toLowerCase().includes(q);
        const artistMatch = c.artists.some(a => a.name.toLowerCase().includes(q));
        matchQuery = !!(nomMatch || formationMatch || lieuMatch || artistMatch);
      }

      const matchFestival = !this.selectedFestivalId || c.id_festival === this.selectedFestivalId;

      const matchLieu = !this.selectedLieuId || c.id_lieu === this.selectedLieuId;

      return matchQuery && matchFestival && matchLieu;
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery.trim() || this.selectedFestivalId || this.selectedLieuId);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedFestivalId = null;
    this.selectedLieuId = null;
    this.filterList();
  }

  getFestivalYear(festivalId?: number): string {
    if (!festivalId) return '2026';
    const fest = this.festivals.find(f => f.id === festivalId);
    return fest ? fest.year : '2026';
  }

  deleteConcert(concert: HydratedConcert) {
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), concert.nom, () => {
      this.festivalSrv.deleteConcert(concert.id).subscribe(() => this.loadData());
    });
  }
}
