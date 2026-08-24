export type UserRole =
  | 'fournisseur_scene'
  | 'fournisseur_lumiere'
  | 'accordeur'
  | 'location_instrument'
  | 'location_materiel'
  | 'chauffeur'
  | 'transporteur_instrument'
  | 'referant_salle'
  | 'referant_technique'
  | 'traiteur'
  | 'photographe'
  | 'bénévole'
  | 'artiste'
  | 'directeur_production'
  | 'coordinateur_logistique'
  | 'responsable_billetterie'
  | 'responsable_marketing'
  | 'directeur_artistique'
  | 'directeur_excecutif';

export type EvenementType =
  | 'instrument_livraison'
  | 'instrument_ramassage'
  | 'instrument_accordage'
  | 'traiteur_livraison'
  | 'traiteur_ramassage'
  | 'cocktail_installation'
  | 'cocktail_rangement'
  | 'billeterie_installation'
  | 'billeterie_rangement'
  | 'loge_installation'
  | 'loge_rangement'
  | 'scene_montage'
  | 'scene_demontage'
  | 'son_verification'
  | 'eclairage_montage'
  | 'eclairage_demontage'
  | 'eclairage_verification'
  | 'portes_ouverture'
  | 'portes_fermeture'
  | 'bistro_montage'
  | 'bistro_demontage'
  | 'inventaire_bistro'
  | 'inventaire_materiel'
  | 'inventaire_ventes'
  | 'inventaire_caisses'
  | 'transport'
  | 'reunion'
  | 'courses';

export type LieuType = 'aeroport' | 'gare' | 'salle_concert' | 'hotel' | 'autre';

export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
}

export interface UserRoleRecord {
  id_utilisateur: number;
  role: UserRole;
}

export interface Participant {
  id_utilisateur: number;
  id_evenement: number;
  manager: boolean;
}

export interface Lieu {
  id: number;
  nom: string;
  gmap_lien: string;
  gcal_id: string;
  type: LieuType;
}

export interface Evenement {
  id: number;
  type: EvenementType;
  date_debut: string; // ISO 8601 string or YYYY-MM-DDTHH:mm:ss
  date_fin: string;
  commentaires: string;
  commentaires_prod: string;
  gcal_id: string;
  id_lieu: number;
}

export interface EvenementTransfert {
  id_evenement: number;
  id_lieu_destination: number;
  duree: string; // e.g. "00:45:00" or "45 min"
}

export interface Artist {
  id: number;
  name: string;
}

export interface ArtistConcert {
  id_artist: number;
  id_concert: number;
}

export interface Concert {
  id: number;
  nom: string;
  date: string;
  duree: string;
  id_lieu: number;
  formation: string;
  scene_besoin: string;
  scene_plan: string;
  scene_commentaires: string;
  id_scene_montage: number;
  id_scene_demontage: number;
  id_son_verification: number;
  eclairage_besoin: string;
  eclairage_commentaires: string;
  id_eclairage_montage: number;
  id_eclairage_demontage: number;
  id_eclairage_verification: number;
  logistique: string;
  id_repetition: number;
  id_porte_ouverture: number;
  id_porte_fermeture: number;
  id_cocktail_installation: number;
  id_cocktail_rangement: number;
  id_marchandise_montage: number;
  id_marchandise_demontage: number;
  id_bistro_montage: number;
  id_bistro_demontage: number;
}

export interface InstrumentConcert {
  id: number;
  id_concert: number;
  name: string;
  id_instrument_livraison: number;
  id_instrument_ramassage: number;
  id_instrument_accordage: number;
}

export interface LogeConcert {
  id: number;
  id_concert: number;
  id_artist: number;
  nom: string;
  id_loge_installation: number;
  id_loge_rangement: number;
}

export interface TransportConcert {
  id_concert: number;
  id_transport: number;
}

export interface FestivalDataset {
  users: User[];
  user_roles: UserRoleRecord[];
  lieux: Lieu[];
  artists: Artist[];
  evenements: Evenement[];
  evenement_transferts: EvenementTransfert[];
  participants: Participant[];
  concerts: Concert[];
  artist_concerts: ArtistConcert[];
  instrument_concerts: InstrumentConcert[];
  loge_concerts: LogeConcert[];
  transport_concerts: TransportConcert[];
}
