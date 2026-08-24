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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Festival } from '@core/models/festival.model';
import { FestivalDataService } from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { FestivalEditDialog } from './edit-dialog';

@Component({
  selector: 'app-festival-festivals',
  templateUrl: './festivals.html',
  styleUrl: './festivals.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MtxGridModule,
    PageHeader,
    TranslatePipe,
  ],
})
export class FestivalsComponent implements OnInit {
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly dialog = inject(MatDialog);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly translate = inject(TranslateService);

  list: Festival[] = [];
  filteredList: Festival[] = [];
  isLoading = true;
  searchQuery = '';

  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '70px',
    },
    {
      header: this.translate.stream('festival.year'),
      field: 'year',
      sortable: true,
      minWidth: 200,
    },
    {
      header: this.translate.stream('actions'),
      field: 'actions',
      pinned: 'right',
      width: '120px',
      disabled: true,
    },
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.festivalSrv.getFestivals().subscribe(festivals => {
      this.list = festivals.sort((a, b) => b.year.localeCompare(a.year));
      this.filterList();
      this.isLoading = false;
    });
  }

  filterList() {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredList = this.list.filter(f => !q || f.year.toLowerCase().includes(q));
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(FestivalEditDialog, {
      width: '420px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((res: { year: string }) => {
      if (res) {
        this.festivalSrv.addFestival({ year: res.year }).subscribe(() => this.loadData());
      }
    });
  }

  openEditDialog(festival: Festival) {
    const dialogRef = this.dialog.open(FestivalEditDialog, {
      width: '420px',
      data: { festival: { ...festival } },
    });

    dialogRef.afterClosed().subscribe((res: { year: string }) => {
      if (res) {
        this.festivalSrv
          .updateFestival({ id: festival.id, year: res.year })
          .subscribe(() => this.loadData());
      }
    });
  }

  deleteFestival(festival: Festival) {
    this.mtxDialog.confirm(
      this.translate.instant('confirm_delete'),
      `Édition ${festival.year}`,
      () => {
        this.festivalSrv.deleteFestival(festival.id).subscribe(() => this.loadData());
      }
    );
  }
}
