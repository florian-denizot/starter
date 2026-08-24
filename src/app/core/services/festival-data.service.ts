import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, shareReplay, tap } from 'rxjs';
import {
  Artist,
  ArtistConcert,
  Concert,
  Evenement,
  EvenementTransfert,
  Festival,
  FestivalDataset,
  InstrumentConcert,
  Lieu,
  LogeConcert,
  Participant,
  TransportConcert,
  User,
  UserRole,
  UserRoleRecord,
} from '../models/festival.model';

export interface HydratedEvenement extends Evenement {
  lieu?: Lieu;
  festival?: Festival;
  transfert?: EvenementTransfert & { destination?: Lieu };
  participantsList: (Participant & { user?: User })[];
}

export interface HydratedConcert extends Concert {
  lieu?: Lieu;
  artists: Artist[];
  sceneMontage?: HydratedEvenement;
  sceneDemontage?: HydratedEvenement;
  sonVerification?: HydratedEvenement;
  eclairageMontage?: HydratedEvenement;
  eclairageDemontage?: HydratedEvenement;
  eclairageVerification?: HydratedEvenement;
  repetition?: HydratedEvenement;
  porteOuverture?: HydratedEvenement;
  porteFermeture?: HydratedEvenement;
  cocktailInstallation?: HydratedEvenement;
  cocktailRangement?: HydratedEvenement;
  marchandiseMontage?: HydratedEvenement;
  marchandiseDemontage?: HydratedEvenement;
  bistroMontage?: HydratedEvenement;
  bistroDemontage?: HydratedEvenement;
  instruments: (InstrumentConcert & {
    livraison?: HydratedEvenement;
    ramassage?: HydratedEvenement;
    accordage?: HydratedEvenement;
  })[];
  loges: (LogeConcert & {
    artist?: Artist;
    installation?: HydratedEvenement;
    rangement?: HydratedEvenement;
  })[];
  transports: HydratedEvenement[];
}

export interface HydratedUser extends User {
  roles: UserRole[];
}

@Injectable({
  providedIn: 'root',
})
export class FestivalDataService {
  private readonly http = inject(HttpClient);
  private dataset$?: Observable<FestivalDataset>;

  // Reactive State Store
  private readonly state$ = new BehaviorSubject<FestivalDataset | null>(null);
  readonly datasetSignal = signal<FestivalDataset | null>(null);

  /**
   * Load the full festival dataset from JSON or return in-memory state
   */
  getDataset(): Observable<FestivalDataset> {
    if (this.state$.value) {
      return of(this.state$.value);
    }
    if (!this.dataset$) {
      this.dataset$ = this.http.get<FestivalDataset>('data/festival/festival-dataset.json').pipe(
        tap(data => {
          this.state$.next(data);
          this.datasetSignal.set(data);
        }),
        shareReplay(1)
      );
    }
    return this.dataset$;
  }

  private getCurrentState(): FestivalDataset {
    const s = this.state$.value;
    if (!s) {
      throw new Error('Dataset not yet loaded');
    }
    return s;
  }

  private updateState(updater: (current: FestivalDataset) => FestivalDataset) {
    const current = this.getCurrentState();
    const updated = updater(current);
    this.state$.next(updated);
    this.datasetSignal.set(updated);
  }

  // ==========================================
  // FESTIVALS CRUD
  // ==========================================

  getFestivals(): Observable<Festival[]> {
    return this.getDataset().pipe(map(d => [...(d.festivals || [])]));
  }

  getFestivalById(id: number): Observable<Festival | undefined> {
    return this.getDataset().pipe(map(d => (d.festivals || []).find(f => f.id === id)));
  }

  addFestival(festival: Omit<Festival, 'id'>): Observable<Festival> {
    return this.getDataset().pipe(
      map(data => {
        const festivals = data.festivals || [];
        const nextId = Math.max(0, ...festivals.map(f => f.id)) + 1;
        const newFest: Festival = { ...festival, id: nextId };
        this.updateState(curr => ({
          ...curr,
          festivals: [...(curr.festivals || []), newFest],
        }));
        return newFest;
      })
    );
  }

  updateFestival(festival: Festival): Observable<Festival> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          festivals: (curr.festivals || []).map(f => (f.id === festival.id ? { ...festival } : f)),
        }));
        return festival;
      })
    );
  }

  deleteFestival(id: number): Observable<boolean> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          festivals: (curr.festivals || []).filter(f => f.id !== id),
        }));
        return true;
      })
    );
  }

  // ==========================================
  // LIEUX CRUD
  // ==========================================

  getLieux(): Observable<Lieu[]> {
    return this.getDataset().pipe(map(d => [...d.lieux]));
  }

  addLieu(lieu: Omit<Lieu, 'id'>): Observable<Lieu> {
    return this.getDataset().pipe(
      map(data => {
        const nextId = Math.max(0, ...data.lieux.map(l => l.id)) + 1;
        const newLieu: Lieu = { ...lieu, id: nextId };
        this.updateState(curr => ({
          ...curr,
          lieux: [...curr.lieux, newLieu],
        }));
        return newLieu;
      })
    );
  }

  updateLieu(lieu: Lieu): Observable<Lieu> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          lieux: curr.lieux.map(l => (l.id === lieu.id ? { ...lieu } : l)),
        }));
        return lieu;
      })
    );
  }

  deleteLieu(id: number): Observable<boolean> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          lieux: curr.lieux.filter(l => l.id !== id),
        }));
        return true;
      })
    );
  }

  // ==========================================
  // USERS & ROLES CRUD
  // ==========================================

  getUsers(): Observable<User[]> {
    return this.getDataset().pipe(map(d => [...d.users]));
  }

  getHydratedUsers(): Observable<HydratedUser[]> {
    return this.getDataset().pipe(
      map(data => {
        return data.users.map(u => ({
          ...u,
          roles: data.user_roles.filter(ur => ur.id_utilisateur === u.id).map(ur => ur.role),
        }));
      })
    );
  }

  addUser(user: Omit<User, 'id'>, roles: UserRole[]): Observable<HydratedUser> {
    return this.getDataset().pipe(
      map(data => {
        const nextId = Math.max(0, ...data.users.map(u => u.id)) + 1;
        const newUser: User = { ...user, id: nextId };
        const newRoles: UserRoleRecord[] = roles.map(r => ({
          id_utilisateur: nextId,
          role: r,
        }));

        this.updateState(curr => ({
          ...curr,
          users: [...curr.users, newUser],
          user_roles: [...curr.user_roles, ...newRoles],
        }));

        return { ...newUser, roles };
      })
    );
  }

  updateUser(user: User, roles: UserRole[]): Observable<HydratedUser> {
    return this.getDataset().pipe(
      map(() => {
        const newRoles: UserRoleRecord[] = roles.map(r => ({
          id_utilisateur: user.id,
          role: r,
        }));

        this.updateState(curr => ({
          ...curr,
          users: curr.users.map(u => (u.id === user.id ? { ...user } : u)),
          user_roles: [...curr.user_roles.filter(ur => ur.id_utilisateur !== user.id), ...newRoles],
        }));

        return { ...user, roles };
      })
    );
  }

  deleteUser(id: number): Observable<boolean> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          users: curr.users.filter(u => u.id !== id),
          user_roles: curr.user_roles.filter(ur => ur.id_utilisateur !== id),
          participants: curr.participants.filter(p => p.id_utilisateur !== id),
        }));
        return true;
      })
    );
  }

  // ==========================================
  // ARTISTES CRUD
  // ==========================================

  getArtists(): Observable<Artist[]> {
    return this.getDataset().pipe(map(d => [...d.artists]));
  }

  addArtist(artist: Omit<Artist, 'id'>): Observable<Artist> {
    return this.getDataset().pipe(
      map(data => {
        const nextId = Math.max(0, ...data.artists.map(a => a.id)) + 1;
        const newArtist: Artist = { ...artist, id: nextId };
        this.updateState(curr => ({
          ...curr,
          artists: [...curr.artists, newArtist],
        }));
        return newArtist;
      })
    );
  }

  updateArtist(artist: Artist): Observable<Artist> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          artists: curr.artists.map(a => (a.id === artist.id ? { ...artist } : a)),
        }));
        return artist;
      })
    );
  }

  deleteArtist(id: number): Observable<boolean> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          artists: curr.artists.filter(a => a.id !== id),
          artist_concerts: curr.artist_concerts.filter(ac => ac.id_artist !== id),
        }));
        return true;
      })
    );
  }

  // ==========================================
  // MASTER TIMELINE & CONCERTS CRUD
  // ==========================================

  getEvenements(): Observable<Evenement[]> {
    return this.getDataset().pipe(map(d => d.evenements));
  }

  addEvenement(
    evenement: Omit<Evenement, 'id'>,
    transfert?: { id_lieu_destination: number; duree: string },
    participants?: { id_utilisateur: number; manager: boolean }[]
  ): Observable<HydratedEvenement> {
    return this.getDataset().pipe(
      map(data => {
        const nextId = Math.max(0, ...data.evenements.map(e => e.id)) + 1;
        const newEvt: Evenement = { ...evenement, id: nextId };

        const newTransferts =
          transfert && evenement.type === 'transport'
            ? [
                ...data.evenement_transferts,
                {
                  id_evenement: nextId,
                  id_lieu_destination: transfert.id_lieu_destination,
                  duree: transfert.duree,
                },
              ]
            : data.evenement_transferts;

        const newParts: Participant[] = participants
          ? [
              ...data.participants,
              ...participants.map(p => ({
                id_evenement: nextId,
                id_utilisateur: p.id_utilisateur,
                manager: p.manager,
              })),
            ]
          : data.participants;

        this.updateState(curr => ({
          ...curr,
          evenements: [...curr.evenements, newEvt],
          evenement_transferts: newTransferts,
          participants: newParts,
        }));

        const userMap = new Map(data.users.map(u => [u.id, u]));
        const lieuMap = new Map(data.lieux.map(l => [l.id, l]));

        return {
          ...newEvt,
          lieu: lieuMap.get(newEvt.id_lieu),
          transfert:
            transfert && evenement.type === 'transport'
              ? {
                  id_evenement: nextId,
                  id_lieu_destination: transfert.id_lieu_destination,
                  duree: transfert.duree,
                  destination: lieuMap.get(transfert.id_lieu_destination),
                }
              : undefined,
          participantsList: (participants || []).map(p => ({
            ...p,
            id_evenement: nextId,
            user: userMap.get(p.id_utilisateur),
          })),
        };
      })
    );
  }

  updateEvenement(
    evenement: Evenement,
    transfert?: { id_lieu_destination: number; duree: string },
    participants?: { id_utilisateur: number; manager: boolean }[]
  ): Observable<HydratedEvenement> {
    return this.getDataset().pipe(
      map(data => {
        const updatedTransferts = data.evenement_transferts.filter(
          t => t.id_evenement !== evenement.id
        );
        if (transfert && evenement.type === 'transport') {
          updatedTransferts.push({
            id_evenement: evenement.id,
            id_lieu_destination: transfert.id_lieu_destination,
            duree: transfert.duree,
          });
        }

        const updatedParticipants = data.participants.filter(p => p.id_evenement !== evenement.id);
        if (participants) {
          updatedParticipants.push(
            ...participants.map(p => ({
              id_evenement: evenement.id,
              id_utilisateur: p.id_utilisateur,
              manager: p.manager,
            }))
          );
        }

        this.updateState(curr => ({
          ...curr,
          evenements: curr.evenements.map(e => (e.id === evenement.id ? { ...evenement } : e)),
          evenement_transferts: updatedTransferts,
          participants: updatedParticipants,
        }));

        const userMap = new Map(data.users.map(u => [u.id, u]));
        const lieuMap = new Map(data.lieux.map(l => [l.id, l]));

        return {
          ...evenement,
          lieu: lieuMap.get(evenement.id_lieu),
          transfert:
            transfert && evenement.type === 'transport'
              ? {
                  id_evenement: evenement.id,
                  id_lieu_destination: transfert.id_lieu_destination,
                  duree: transfert.duree,
                  destination: lieuMap.get(transfert.id_lieu_destination),
                }
              : undefined,
          participantsList: (participants || []).map(p => ({
            ...p,
            id_evenement: evenement.id,
            user: userMap.get(p.id_utilisateur),
          })),
        };
      })
    );
  }

  deleteEvenement(id: number): Observable<boolean> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          evenements: curr.evenements.filter(e => e.id !== id),
          evenement_transferts: curr.evenement_transferts.filter(t => t.id_evenement !== id),
          participants: curr.participants.filter(p => p.id_evenement !== id),
        }));
        return true;
      })
    );
  }

  getHydratedEvenements(): Observable<HydratedEvenement[]> {
    return this.getDataset().pipe(
      map(data => {
        const userMap = new Map(data.users.map(u => [u.id, u]));
        const lieuMap = new Map(data.lieux.map(l => [l.id, l]));
        const festivalMap = new Map((data.festivals || []).map(f => [f.id, f]));
        const transfertMap = new Map(data.evenement_transferts.map(t => [t.id_evenement, t]));

        return data.evenements.map(evt => {
          const trans = transfertMap.get(evt.id);
          const parts = data.participants
            .filter(p => p.id_evenement === evt.id)
            .map(p => ({
              ...p,
              user: userMap.get(p.id_utilisateur),
            }));

          return {
            ...evt,
            lieu: lieuMap.get(evt.id_lieu),
            festival: evt.id_festival ? festivalMap.get(evt.id_festival) : undefined,
            transfert: trans
              ? {
                  ...trans,
                  destination: lieuMap.get(trans.id_lieu_destination),
                }
              : undefined,
            participantsList: parts,
          };
        });
      })
    );
  }

  getHydratedConcerts(): Observable<HydratedConcert[]> {
    return this.getDataset().pipe(
      map(data => {
        const userMap = new Map(data.users.map(u => [u.id, u]));
        const lieuMap = new Map(data.lieux.map(l => [l.id, l]));
        const artistMap = new Map(data.artists.map(a => [a.id, a]));
        const transfertMap = new Map(data.evenement_transferts.map(t => [t.id_evenement, t]));

        const hydrateEvent = (id?: number): HydratedEvenement | undefined => {
          if (!id) return undefined;
          const evt = data.evenements.find(e => e.id === id);
          if (!evt) return undefined;
          const trans = transfertMap.get(evt.id);
          const parts = data.participants
            .filter(p => p.id_evenement === evt.id)
            .map(p => ({
              ...p,
              user: userMap.get(p.id_utilisateur),
            }));

          return {
            ...evt,
            lieu: lieuMap.get(evt.id_lieu),
            transfert: trans
              ? {
                  ...trans,
                  destination: lieuMap.get(trans.id_lieu_destination),
                }
              : undefined,
            participantsList: parts,
          };
        };

        return data.concerts.map(concert => {
          const concertArtists = data.artist_concerts
            .filter(ac => ac.id_concert === concert.id)
            .map(ac => artistMap.get(ac.id_artist))
            .filter((a): a is Artist => !!a);

          const instruments = data.instrument_concerts
            .filter(ic => ic.id_concert === concert.id)
            .map(ic => ({
              ...ic,
              livraison: hydrateEvent(ic.id_instrument_livraison),
              ramassage: hydrateEvent(ic.id_instrument_ramassage),
              accordage: hydrateEvent(ic.id_instrument_accordage),
            }));

          const loges = data.loge_concerts
            .filter(lc => lc.id_concert === concert.id)
            .map(lc => ({
              ...lc,
              artist: artistMap.get(lc.id_artist),
              installation: hydrateEvent(lc.id_loge_installation),
              rangement: hydrateEvent(lc.id_loge_rangement),
            }));

          const transports = data.transport_concerts
            .filter(tc => tc.id_concert === concert.id)
            .map(tc => hydrateEvent(tc.id_transport))
            .filter((t): t is HydratedEvenement => !!t);

          return {
            ...concert,
            lieu: lieuMap.get(concert.id_lieu),
            artists: concertArtists,
            sceneMontage: hydrateEvent(concert.id_scene_montage),
            sceneDemontage: hydrateEvent(concert.id_scene_demontage),
            sonVerification: hydrateEvent(concert.id_son_verification),
            eclairageMontage: hydrateEvent(concert.id_eclairage_montage),
            eclairageDemontage: hydrateEvent(concert.id_eclairage_demontage),
            eclairageVerification: hydrateEvent(concert.id_eclairage_verification),
            repetition: hydrateEvent(concert.id_repetition),
            porteOuverture: hydrateEvent(concert.id_porte_ouverture),
            porteFermeture: hydrateEvent(concert.id_porte_fermeture),
            cocktailInstallation: hydrateEvent(concert.id_cocktail_installation),
            cocktailRangement: hydrateEvent(concert.id_cocktail_rangement),
            marchandiseMontage: hydrateEvent(concert.id_marchandise_montage),
            marchandiseDemontage: hydrateEvent(concert.id_marchandise_demontage),
            bistroMontage: hydrateEvent(concert.id_bistro_montage),
            bistroDemontage: hydrateEvent(concert.id_bistro_demontage),
            instruments,
            loges,
            transports,
          };
        });
      })
    );
  }

  addConcert(
    concert: Omit<Concert, 'id'>,
    artistIds: number[] = [],
    instruments: {
      name: string;
      id_instrument_livraison?: number;
      id_instrument_ramassage?: number;
      id_instrument_accordage?: number;
    }[] = [],
    loges: {
      id_artist: number;
      nom: string;
      id_loge_installation?: number;
      id_loge_rangement?: number;
    }[] = [],
    transportEventIds: number[] = []
  ): Observable<HydratedConcert> {
    return this.getDataset().pipe(
      map(data => {
        const nextId = Math.max(0, ...data.concerts.map(c => c.id)) + 1;
        const newConcert: Concert = { ...concert, id: nextId };

        const newArtistConcerts: ArtistConcert[] = artistIds.map(aId => ({
          id_artist: aId,
          id_concert: nextId,
        }));

        let maxInstId = Math.max(0, ...data.instrument_concerts.map(i => i.id));
        const newInstruments: InstrumentConcert[] = instruments.map(inst => ({
          id: ++maxInstId,
          id_concert: nextId,
          name: inst.name,
          id_instrument_livraison: inst.id_instrument_livraison || 0,
          id_instrument_ramassage: inst.id_instrument_ramassage || 0,
          id_instrument_accordage: inst.id_instrument_accordage || 0,
        }));

        let maxLogeId = Math.max(0, ...data.loge_concerts.map(l => l.id));
        const newLoges: LogeConcert[] = loges.map(l => ({
          id: ++maxLogeId,
          id_concert: nextId,
          id_artist: l.id_artist,
          nom: l.nom,
          id_loge_installation: l.id_loge_installation || 0,
          id_loge_rangement: l.id_loge_rangement || 0,
        }));

        const newTransports: TransportConcert[] = transportEventIds.map(tId => ({
          id_concert: nextId,
          id_transport: tId,
        }));

        this.updateState(curr => ({
          ...curr,
          concerts: [...curr.concerts, newConcert],
          artist_concerts: [...curr.artist_concerts, ...newArtistConcerts],
          instrument_concerts: [...curr.instrument_concerts, ...newInstruments],
          loge_concerts: [...curr.loge_concerts, ...newLoges],
          transport_concerts: [...curr.transport_concerts, ...newTransports],
        }));

        return newConcert as HydratedConcert;
      })
    );
  }

  updateConcert(
    concert: Concert,
    artistIds: number[] = [],
    instruments: {
      id?: number;
      name: string;
      id_instrument_livraison?: number;
      id_instrument_ramassage?: number;
      id_instrument_accordage?: number;
    }[] = [],
    loges: {
      id?: number;
      id_artist: number;
      nom: string;
      id_loge_installation?: number;
      id_loge_rangement?: number;
    }[] = [],
    transportEventIds: number[] = []
  ): Observable<HydratedConcert> {
    return this.getDataset().pipe(
      map(data => {
        const newArtistConcerts: ArtistConcert[] = artistIds.map(aId => ({
          id_artist: aId,
          id_concert: concert.id,
        }));

        let maxInstId = Math.max(0, ...data.instrument_concerts.map(i => i.id));
        const updatedInstruments: InstrumentConcert[] = instruments.map(inst => ({
          id: inst.id || ++maxInstId,
          id_concert: concert.id,
          name: inst.name,
          id_instrument_livraison: inst.id_instrument_livraison || 0,
          id_instrument_ramassage: inst.id_instrument_ramassage || 0,
          id_instrument_accordage: inst.id_instrument_accordage || 0,
        }));

        let maxLogeId = Math.max(0, ...data.loge_concerts.map(l => l.id));
        const updatedLoges: LogeConcert[] = loges.map(l => ({
          id: l.id || ++maxLogeId,
          id_concert: concert.id,
          id_artist: l.id_artist,
          nom: l.nom,
          id_loge_installation: l.id_loge_installation || 0,
          id_loge_rangement: l.id_loge_rangement || 0,
        }));

        const updatedTransports: TransportConcert[] = transportEventIds.map(tId => ({
          id_concert: concert.id,
          id_transport: tId,
        }));

        this.updateState(curr => ({
          ...curr,
          concerts: curr.concerts.map(c => (c.id === concert.id ? { ...concert } : c)),
          artist_concerts: [
            ...curr.artist_concerts.filter(ac => ac.id_concert !== concert.id),
            ...newArtistConcerts,
          ],
          instrument_concerts: [
            ...curr.instrument_concerts.filter(ic => ic.id_concert !== concert.id),
            ...updatedInstruments,
          ],
          loge_concerts: [
            ...curr.loge_concerts.filter(lc => lc.id_concert !== concert.id),
            ...updatedLoges,
          ],
          transport_concerts: [
            ...curr.transport_concerts.filter(tc => tc.id_concert !== concert.id),
            ...updatedTransports,
          ],
        }));

        return concert as HydratedConcert;
      })
    );
  }

  deleteConcert(id: number): Observable<boolean> {
    return this.getDataset().pipe(
      map(() => {
        this.updateState(curr => ({
          ...curr,
          concerts: curr.concerts.filter(c => c.id !== id),
          artist_concerts: curr.artist_concerts.filter(ac => ac.id_concert !== id),
          instrument_concerts: curr.instrument_concerts.filter(ic => ic.id_concert !== id),
          loge_concerts: curr.loge_concerts.filter(lc => lc.id_concert !== id),
          transport_concerts: curr.transport_concerts.filter(tc => tc.id_concert !== id),
        }));
        return true;
      })
    );
  }

  getUserRoadbook(userId: number): Observable<{
    user: User;
    roles: UserRole[];
    events: HydratedEvenement[];
  }> {
    return this.getDataset().pipe(
      map(data => {
        const user = data.users.find(u => u.id === userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        const roles = data.user_roles.filter(ur => ur.id_utilisateur === userId).map(ur => ur.role);

        const userEventIds = new Set(
          data.participants.filter(p => p.id_utilisateur === userId).map(p => p.id_evenement)
        );

        const lieuMap = new Map(data.lieux.map(l => [l.id, l]));
        const userMap = new Map(data.users.map(u => [u.id, u]));
        const transfertMap = new Map(data.evenement_transferts.map(t => [t.id_evenement, t]));

        const events = data.evenements
          .filter(evt => userEventIds.has(evt.id))
          .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
          .map(evt => {
            const trans = transfertMap.get(evt.id);
            const parts = data.participants
              .filter(p => p.id_evenement === evt.id)
              .map(p => ({
                ...p,
                user: userMap.get(p.id_utilisateur),
              }));

            return {
              ...evt,
              lieu: lieuMap.get(evt.id_lieu),
              transfert: trans
                ? {
                    ...trans,
                    destination: lieuMap.get(trans.id_lieu_destination),
                  }
                : undefined,
              participantsList: parts,
            };
          });

        return { user, roles, events };
      })
    );
  }
}
