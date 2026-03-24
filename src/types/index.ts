export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  location: string;
  mapLink: string;
  eventName: string;
  createdAt: number;
}

export interface RouteItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  location: string;
  routeLink: string;
  mapsLink: string;
  gpsCoordinates: string;
  distance: string;
  difficulty: string;
  createdAt: number;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: number;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  description: string;
  link?: string;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  city: string;
  moto: string;
  photo: string;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin';
  createdAt: number;
}

export interface DatabaseSchema {
  gallery: GalleryItem[];
  routes: RouteItem[];
  members: Member[];
  sponsors: Sponsor[];
  events: EventItem[];
  users: User[];
}
