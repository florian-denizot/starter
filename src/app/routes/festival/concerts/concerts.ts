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
import { PageHeader, SafeHtmlPipe } from '@shared';

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
    SafeHtmlPipe,
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
      minWidth: 150,
    },
    {
      header: this.translate.stream('festival.lieu'),
      field: 'lieu',
      minWidth: 180,
    },
    {
      header: this.translate.stream('festival.formation'),
      field: 'formation',
      minWidth: 200,
    },
    // Event Columns
    {
      header: 'Montage Scène',
      field: 'sceneMontage',
      minWidth: 200,
    },
    {
      header: 'Démontage Scène',
      field: 'sceneDemontage',
      minWidth: 200,
    },
    {
      header: 'Balances Son',
      field: 'sonVerification',
      minWidth: 200,
    },
    {
      header: 'Montage Éclairage',
      field: 'eclairageMontage',
      minWidth: 200,
    },
    {
      header: 'Démontage Éclairage',
      field: 'eclairageDemontage',
      minWidth: 200,
    },
    {
      header: 'Calage Éclairage',
      field: 'eclairageVerification',
      minWidth: 200,
    },
    {
      header: 'Répétition Générale',
      field: 'repetition',
      minWidth: 200,
    },
    {
      header: 'Ouverture Portes',
      field: 'porteOuverture',
      minWidth: 200,
    },
    {
      header: 'Fermeture Portes',
      field: 'porteFermeture',
      minWidth: 200,
    },
    {
      header: 'Montage Bistro',
      field: 'bistroMontage',
      minWidth: 200,
    },
    {
      header: 'Démontage Bistro',
      field: 'bistroDemontage',
      minWidth: 200,
    },
    {
      header: 'Installation Cocktail VIP',
      field: 'cocktailInstallation',
      minWidth: 200,
    },
    {
      header: 'Rangement Cocktail VIP',
      field: 'cocktailRangement',
      minWidth: 200,
    },
    {
      header: 'Montage Stand / Disques',
      field: 'marchandiseMontage',
      minWidth: 200,
    },
    {
      header: 'Démontage Stand / Disques',
      field: 'marchandiseDemontage',
      minWidth: 200,
    },
    {
      header: 'Instruments (Événements)',
      field: 'instrumentsEvents',
      minWidth: 880,
    },
    {
      header: 'Loges (Événements)',
      field: 'logesEvents',
      minWidth: 650,
    },
    {
      header: 'Transports & Navettes',
      field: 'transportsEvents',
      minWidth: 520,
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

  getFestivalYear(idFestival?: number): string | number {
    if (!idFestival) return '';
    const fest = this.festivals.find(f => f.id === idFestival);
    return fest ? fest.year : idFestival;
  }

  deleteConcert(concert: HydratedConcert) {
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), concert.nom, () => {
      this.festivalSrv.deleteConcert(concert.id).subscribe(() => {
        this.loadData();
      });
    });
  }
}
