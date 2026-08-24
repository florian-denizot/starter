import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Artist } from '@core/models/festival.model';
import { FestivalDataService } from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { ArtistEditDialog } from './edit-dialog';

@Component({
  selector: 'app-festival-artistes',
  templateUrl: './artistes.html',
  styleUrl: './artistes.scss',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MtxGridModule,
    PageHeader,
    TranslatePipe,
  ],
})
export class ArtistesComponent implements OnInit {
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly dialog = inject(MatDialog);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly translate = inject(TranslateService);

  list: Artist[] = [];
  filteredList: Artist[] = [];
  isLoading = true;
  searchQuery = '';

  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '80px',
    },
    {
      header: this.translate.stream('name'),
      field: 'name',
      sortable: true,
      minWidth: 320,
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
    this.festivalSrv.getArtists().subscribe(artists => {
      this.list = artists;
      this.filterList();
      this.isLoading = false;
    });
  }

  filterList() {
    if (!this.searchQuery.trim()) {
      this.filteredList = [...this.list];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredList = this.list.filter(a => a.name.toLowerCase().includes(q));
    }
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(ArtistEditDialog, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((res: { name: string }) => {
      if (res) {
        this.festivalSrv.addArtist({ name: res.name }).subscribe(() => this.loadData());
      }
    });
  }

  openEditDialog(artist: Artist) {
    const dialogRef = this.dialog.open(ArtistEditDialog, {
      width: '500px',
      data: { artist: { ...artist } },
    });

    dialogRef.afterClosed().subscribe((res: { name: string }) => {
      if (res) {
        this.festivalSrv
          .updateArtist({ id: artist.id, name: res.name })
          .subscribe(() => this.loadData());
      }
    });
  }

  deleteArtist(artist: Artist) {
    this.mtxDialog.confirm(this.translate.instant('confirm_delete'), `${artist.name}`, () => {
      this.festivalSrv.deleteArtist(artist.id).subscribe(() => this.loadData());
    });
  }
}
