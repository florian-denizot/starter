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
import { Lieu, LieuType } from '@core/models/festival.model';
import { FestivalDataService } from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { LieuEditDialog } from './edit-dialog';

@Component({
  selector: 'app-festival-lieux',
  templateUrl: './lieux.html',
  imports: [
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
    TranslatePipe,
  ],
})
export class LieuxComponent implements OnInit {
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly dialog = inject(MatDialog);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly translate = inject(TranslateService);

  list: Lieu[] = [];
  filteredList: Lieu[] = [];
  isLoading = true;
  searchQuery = '';
  selectedType: LieuType | '' = '';

  lieuTypes: LieuType[] = ['salle_concert', 'hotel', 'aeroport', 'gare', 'autre'];

  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '80px',
    },
    {
      header: this.translate.stream('name'),
      field: 'nom',
      sortable: true,
      minWidth: 260,
    },
    {
      header: this.translate.stream('festival.type_lieu'),
      field: 'type',
      sortable: true,
      minWidth: 180,
    },
    {
      header: this.translate.stream('festival.gmap_lien'),
      field: 'gmap_lien',
      minWidth: 160,
    },
    {
      header: this.translate.stream('actions'),
      field: 'actions',
      pinned: 'right',
      width: '120px',
    },
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.festivalSrv.getLieux().subscribe(lieux => {
      this.list = lieux;
      this.filterList();
      this.isLoading = false;
    });
  }

  filterList() {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredList = this.list.filter(l => {
      const matchQuery =
        !q ||
        l.nom.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        (l.gmap_lien && l.gmap_lien.toLowerCase().includes(q));

      const matchType = !this.selectedType || l.type === this.selectedType;

      return matchQuery && matchType;
    });
  }

  getTypeColor(type: LieuType): 'primary' | 'accent' | 'warn' | undefined {
    switch (type) {
      case 'salle_concert':
        return 'primary';
      case 'hotel':
        return 'accent';
      case 'aeroport':
      case 'gare':
        return 'warn';
      default:
        return undefined;
    }
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(LieuEditDialog, {
      width: '550px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((res: Omit<Lieu, 'id'>) => {
      if (res) {
        this.festivalSrv.addLieu(res).subscribe(() => this.loadData());
      }
    });
  }

  openEditDialog(lieu: Lieu) {
    const dialogRef = this.dialog.open(LieuEditDialog, {
      width: '550px',
      data: { lieu: { ...lieu } },
    });

    dialogRef.afterClosed().subscribe((res: Omit<Lieu, 'id'>) => {
      if (res) {
        this.festivalSrv.updateLieu({ ...res, id: lieu.id }).subscribe(() => this.loadData());
      }
    });
  }

  deleteLieu(lieu: Lieu) {
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), `${lieu.nom}`, () => {
      this.festivalSrv.deleteLieu(lieu.id).subscribe(() => this.loadData());
    });
  }
}
