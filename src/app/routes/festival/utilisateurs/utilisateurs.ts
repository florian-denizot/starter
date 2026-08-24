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
import { UserRole } from '@core/models/festival.model';
import { FestivalDataService, HydratedUser } from '@core/services/festival-data.service';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeader } from '@shared';
import { UserEditDialog } from './edit-dialog';

@Component({
  selector: 'app-festival-utilisateurs',
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.scss',
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
export class UtilisateursComponent implements OnInit {
  private readonly festivalSrv = inject(FestivalDataService);
  private readonly dialog = inject(MatDialog);
  private readonly mtxDialog = inject(MtxDialog);
  private readonly translate = inject(TranslateService);

  list: HydratedUser[] = [];
  filteredList: HydratedUser[] = [];
  isLoading = true;
  searchQuery = '';
  selectedRole: UserRole | '' = '';

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

  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '70px',
    },
    {
      header: this.translate.stream('name'),
      field: 'user_info',
      sortable: true,
      minWidth: 260,
    },
    {
      header: this.translate.stream('festival.roles'),
      field: 'roles',
      minWidth: 320,
    },
    {
      header: this.translate.stream('festival.actions'),
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
    this.festivalSrv.getHydratedUsers().subscribe(users => {
      this.list = users;
      this.filterList();
      this.isLoading = false;
    });
  }

  filterList() {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredList = this.list.filter(u => {
      const matchQuery =
        !q ||
        u.prenom.toLowerCase().includes(q) ||
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some(r => r.toLowerCase().includes(q));

      const matchRole = !this.selectedRole || u.roles.includes(this.selectedRole);

      return matchQuery && matchRole;
    });
  }

  getRoleColor(role: UserRole): 'primary' | 'accent' | 'warn' | undefined {
    if (role.startsWith('directeur') || role.startsWith('coordinateur')) {
      return 'primary';
    }
    if (role === 'artiste') {
      return 'accent';
    }
    if (role.includes('technique') || role.includes('scene') || role.includes('lumiere')) {
      return 'warn';
    }
    return undefined;
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(UserEditDialog, {
      width: '580px',
      data: {},
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { prenom: string; nom: string; email: string; roles: UserRole[] }) => {
        if (res) {
          this.festivalSrv
            .addUser({ prenom: res.prenom, nom: res.nom, email: res.email }, res.roles || [])
            .subscribe(() => this.loadData());
        }
      });
  }

  openEditDialog(user: HydratedUser) {
    const dialogRef = this.dialog.open(UserEditDialog, {
      width: '580px',
      data: { user: { ...user } },
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { prenom: string; nom: string; email: string; roles: UserRole[] }) => {
        if (res) {
          this.festivalSrv
            .updateUser(
              { id: user.id, prenom: res.prenom, nom: res.nom, email: res.email },
              res.roles || []
            )
            .subscribe(() => this.loadData());
        }
      });
  }

  deleteUser(user: HydratedUser) {
    this.mtxDialog.confirm(
      this.translate.instant('confirm_delete'),
      `${user.prenom} ${user.nom}`,
      () => {
        this.festivalSrv.deleteUser(user.id).subscribe(() => this.loadData());
      }
    );
  }
}
