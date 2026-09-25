// Hand-collected venue data. Public sources, verified 2026-08-22.
// Live cinemas from the District scraper API use the same shape plus `sessions`.
import type { Film } from "./films";

/** One real screening: a specific film at a specific time. */
export type Session = { time: string; film: Film; format?: string };

export type Cinema = {
  name: string; brand: string; locality: string; area: string;
  lat: number; lng: number; showtimes: string[]; avgTicketPrice: number;
  /** Per-film showtimes. Present for live data; the hand-collected set has times only. */
  sessions?: Session[];
  source?: "live" | "sample";
  url?: string;
};

export type Occasion = "date" | "friends" | "family" | "quick";

export type Restaurant = {
  name: string; cuisines: string[]; locality: string; area: string;
  lat: number; lng: number; priceForTwo: number; rating: number | null;
  takesReservations: boolean; mealDurationMins: number;
  venueType: string; occasionFit: Occasion[];
  vegFriendly: string; districtBooking: string; sourceUrl: string; checkedOn: string;
  /** "live" = found near a cinema by the maps scraper; absent = hand-collected. */
  source?: "live";
  priceEstimated?: boolean;
  mapsUrl?: string;
};

export const AREAS = ["Gurgaon", "Noida", "South Delhi"] as const;

export const cinemas: Cinema[] = [
  {
    "name": "Pepsi PVR Ambience, Ambience Mall, Gurugram",
    "brand": "PVR INOX",
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.50562,
    "lng": 77.09647,
    "showtimes": [
      "09:00 AM",
      "09:05 AM",
      "09:30 AM",
      "10:05 AM",
      "10:20 AM",
      "11:15 AM",
      "12:35 PM",
      "12:50 PM",
      "01:25 PM",
      "02:20 PM",
      "03:40 PM",
      "04:25 PM",
      "04:30 PM",
      "07:00 PM",
      "07:25 PM",
      "10:30 PM"
    ],
    "avgTicketPrice": 600
  },
  {
    "name": "HDFC Millennia PVR MGF, Gurugram",
    "brand": "PVR INOX",
    "locality": "MGF Metropolitan Mall, Sector 25, Gurugram",
    "area": "Gurgaon",
    "lat": 28.48112,
    "lng": 77.08018,
    "showtimes": [
      "09:00 AM",
      "10:00 AM",
      "12:15 PM",
      "01:00 PM",
      "01:45 PM",
      "02:00 PM",
      "02:25 PM",
      "03:15 PM",
      "03:40 PM",
      "04:15 PM",
      "05:00 PM",
      "05:05 PM",
      "05:45 PM",
      "06:00 PM",
      "06:30 PM",
      "07:00 PM",
      "07:10 PM",
      "08:00 PM",
      "09:00 PM",
      "09:45 PM",
      "10:20 PM",
      "10:30 PM",
      "11:15 PM",
      "11:55 PM"
    ],
    "avgTicketPrice": 450
  },
  {
    "name": "PVR City Centre, DLF City Centre Mall, Gurugram",
    "brand": "PVR INOX",
    "locality": "DLF City Centre Mall, Sector 28, Gurugram",
    "area": "Gurgaon",
    "lat": 28.4789897,
    "lng": 77.0801106,
    "showtimes": [
      "09:35 AM",
      "09:50 AM",
      "10:40 AM",
      "12:40 PM",
      "01:00 PM",
      "01:50 PM",
      "03:45 PM",
      "04:05 PM",
      "05:00 PM",
      "06:00 PM",
      "07:10 PM",
      "08:10 PM",
      "09:05 PM",
      "10:15 PM",
      "11:20 PM"
    ],
    "avgTicketPrice": 375
  },
  {
    "name": "INOX Gurugram Ardee Mall, Ardee City, Gurugram",
    "brand": "PVR INOX",
    "locality": "Ardee Mall, Sector 52, Gurugram",
    "area": "Gurgaon",
    "lat": 28.4451,
    "lng": 77.0808,
    "showtimes": [
      "12:20 PM",
      "12:40 PM",
      "01:25 PM",
      "01:45 PM",
      "03:30 PM",
      "03:45 PM",
      "04:30 PM",
      "04:55 PM",
      "06:00 PM",
      "06:35 PM",
      "07:35 PM",
      "08:05 PM",
      "09:05 PM",
      "09:45 PM",
      "10:40 PM",
      "11:15 PM",
      "11:20 PM"
    ],
    "avgTicketPrice": 850
  },
  {
    "name": "Cinepolis Airia Mall, Sohna Road, Gurugram",
    "brand": "Cinepolis",
    "locality": "Airia Mall, Sector 68, Gurugram",
    "area": "Gurgaon",
    "lat": 28.38331,
    "lng": 77.0523,
    "showtimes": [
      "11:20 AM",
      "12:55 PM",
      "01:40 PM",
      "01:55 PM",
      "02:15 PM",
      "04:45 PM",
      "10:35 PM"
    ],
    "avgTicketPrice": 475
  },
  {
    "name": "PVR Superplex Logix, Sector 32, Noida",
    "brand": "PVR INOX",
    "locality": "Logix City Centre, Sector 32, Noida",
    "area": "Noida",
    "lat": 28.5741241,
    "lng": 77.3538227,
    "showtimes": [
      "11:15 AM",
      "11:35 AM",
      "12:00 PM",
      "12:05 PM",
      "12:15 PM",
      "12:30 PM",
      "12:55 PM",
      "02:20 PM",
      "02:40 PM",
      "03:00 PM",
      "03:55 PM",
      "04:00 PM",
      "05:25 PM",
      "05:35 PM",
      "06:05 PM",
      "06:55 PM",
      "07:00 PM",
      "07:20 PM",
      "07:50 PM",
      "08:10 PM",
      "08:30 PM",
      "08:50 PM",
      "09:30 PM",
      "09:55 PM",
      "10:50 PM",
      "10:55 PM",
      "11:15 PM"
    ],
    "avgTicketPrice": 700
  },
  {
    "name": "PVR Superplex Mall of India, Sector 18, Noida",
    "brand": "PVR INOX",
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.56714,
    "lng": 77.32062,
    "showtimes": [
      "10:15 AM",
      "11:55 AM",
      "01:20 PM",
      "02:35 PM",
      "02:40 PM",
      "03:10 PM",
      "04:25 PM",
      "05:40 PM",
      "05:45 PM",
      "07:30 PM",
      "08:30 PM",
      "08:45 PM",
      "08:50 PM",
      "09:45 PM",
      "10:35 PM",
      "11:55 PM"
    ],
    "avgTicketPrice": 600
  },
  {
    "name": "PVR Directors Cut, DLF Mall of India, Noida",
    "brand": "PVR INOX",
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.56714,
    "lng": 77.32062,
    "showtimes": [
      "09:45 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "12:30 PM",
      "12:50 PM",
      "01:50 PM",
      "02:00 PM",
      "02:15 PM",
      "03:15 PM",
      "04:55 PM",
      "06:00 PM",
      "08:45 PM"
    ],
    "avgTicketPrice": 1500
  },
  {
    "name": "Cinepolis Modi Mall, Sector 25A, Noida",
    "brand": "Cinepolis",
    "locality": "Modi Mall, Sector 25A, Noida",
    "area": "Noida",
    "lat": 28.58332,
    "lng": 77.33347,
    "showtimes": [
      "10:00 AM",
      "10:45 AM",
      "11:00 AM",
      "11:55 AM",
      "12:30 PM",
      "01:00 PM",
      "02:10 PM",
      "02:25 PM",
      "03:50 PM",
      "04:00 PM",
      "04:40 PM",
      "05:25 PM",
      "05:45 PM",
      "07:50 PM",
      "08:15 PM",
      "10:15 PM"
    ],
    "avgTicketPrice": 425
  },
  {
    "name": "Wave Cinemas, Noida",
    "brand": "Wave Cinemas",
    "locality": "Wave Mall, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.56789,
    "lng": 77.32288,
    "showtimes": [
      "10:30 AM",
      "11:00 AM",
      "11:45 AM",
      "12:55 PM",
      "01:00 PM",
      "01:15 PM",
      "01:30 PM",
      "02:00 PM",
      "02:35 PM",
      "04:00 PM",
      "05:25 PM",
      "06:45 PM",
      "07:00 PM",
      "08:15 PM",
      "09:25 PM",
      "09:45 PM",
      "09:55 PM",
      "11:05 PM"
    ],
    "avgTicketPrice": 350
  },
  {
    "name": "PVR Select City Walk, Saket, New Delhi",
    "brand": "PVR INOX",
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.52809,
    "lng": 77.21958,
    "showtimes": [
      "09:10 AM",
      "10:10 AM",
      "12:15 PM",
      "01:15 PM",
      "03:25 PM",
      "04:20 PM",
      "07:25 PM"
    ],
    "avgTicketPrice": 750
  },
  {
    "name": "Cinepolis DLF Avenue, Saket, New Delhi",
    "brand": "Cinepolis",
    "locality": "DLF Avenue, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.5281,
    "lng": 77.21566,
    "showtimes": [
      "11:45 AM",
      "12:10 PM",
      "12:55 PM",
      "01:35 PM",
      "02:15 PM",
      "02:40 PM",
      "03:25 PM",
      "04:00 PM",
      "04:40 PM",
      "04:45 PM",
      "05:45 PM",
      "06:30 PM",
      "07:05 PM",
      "07:30 PM",
      "08:05 PM",
      "08:45 PM",
      "08:50 PM",
      "09:35 PM",
      "10:10 PM",
      "10:35 PM",
      "10:40 PM",
      "11:55 PM"
    ],
    "avgTicketPrice": 450
  },
  {
    "name": "PVR Anupam Saket, New Delhi",
    "brand": "PVR INOX",
    "locality": "Anupam Complex, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.52371,
    "lng": 77.20706,
    "showtimes": [
      "10:35 AM",
      "02:05 PM",
      "04:45 PM",
      "06:55 PM",
      "07:50 PM",
      "08:15 PM",
      "10:55 PM"
    ],
    "avgTicketPrice": 350
  },
  {
    "name": "PVR IMAX with Laser - Priya, Vasant Vihar, New Delhi",
    "brand": "PVR INOX",
    "locality": "Basant Lok, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.55738,
    "lng": 77.16451,
    "showtimes": [
      "08:15 AM",
      "11:45 AM",
      "03:15 PM",
      "05:30 PM",
      "09:00 PM",
      "11:15 PM"
    ],
    "avgTicketPrice": 950
  },
  {
    "name": "INOX Insignia at Epicuria, Nehru Place, New Delhi",
    "brand": "PVR INOX",
    "locality": "Epicuria, Nehru Place, New Delhi",
    "area": "South Delhi",
    "lat": 28.55135,
    "lng": 77.25141,
    "showtimes": [
      "09:00 AM",
      "09:50 AM",
      "10:10 AM",
      "12:05 PM",
      "12:55 PM",
      "01:20 PM",
      "03:10 PM",
      "04:00 PM",
      "04:30 PM",
      "06:15 PM",
      "07:05 PM",
      "07:40 PM",
      "08:30 PM",
      "10:10 PM",
      "10:50 PM",
      "11:35 PM"
    ],
    "avgTicketPrice": 900
  }
];

export const restaurants: Restaurant[] = [
  {
    "name": "Chili's Grill & Bar (Ambience Mall)",
    "cuisines": [
      "Mexican",
      "American",
      "Continental"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.502384,
    "lng": 77.097499,
    "priceForTwo": 1700,
    "rating": 4.6,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "PizzaExpress (Ambience Mall)",
    "cuisines": [
      "Pizza",
      "Italian",
      "Salad",
      "Bakery",
      "Coffee",
      "Beverages",
      "Cafe"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.502645,
    "lng": 77.097268,
    "priceForTwo": 2000,
    "rating": 4.6,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "YouMee (Ambience Mall)",
    "cuisines": [
      "Chinese",
      "Japanese"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.503345,
    "lng": 77.097396,
    "priceForTwo": 3000,
    "rating": 4.6,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "fine_dining",
    "occasionFit": [
      "date",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Spezia Bistro",
    "cuisines": [
      "Italian",
      "Asian",
      "Indo-Chinese"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.5027,
    "lng": 77.09735,
    "priceForTwo": 2000,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Cafe Delhi Heights (Ambience Mall)",
    "cuisines": [
      "North Indian",
      "Continental",
      "Mexican"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.5028,
    "lng": 77.09745,
    "priceForTwo": 2500,
    "rating": 4.1,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Mamagoto (Ambience Mall)",
    "cuisines": [
      "Chinese",
      "Thai",
      "Indo-Chinese"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.503,
    "lng": 77.09725,
    "priceForTwo": 3000,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "fine_dining",
    "occasionFit": [
      "date",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Dhaba - Estd 1986 Delhi",
    "cuisines": [
      "North Indian"
    ],
    "locality": "Ambience Mall, DLF Phase 3, Gurugram",
    "area": "Gurgaon",
    "lat": 28.5026,
    "lng": 77.09765,
    "priceForTwo": 2400,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Farzi Cafe (Cyber Hub)",
    "cuisines": [
      "North Indian",
      "Modern Indian",
      "Mexican",
      "Fusion"
    ],
    "locality": "Cyber Hub, DLF Cyber City, Gurugram",
    "area": "Gurgaon",
    "lat": 28.495171,
    "lng": 77.088641,
    "priceForTwo": 2500,
    "rating": 4.2,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Burma Burma - Cyber Hub",
    "cuisines": [
      "Burmese",
      "Oriental"
    ],
    "locality": "Cyber Hub, DLF Cyber City, Gurugram",
    "area": "Gurgaon",
    "lat": 28.494615,
    "lng": 77.088513,
    "priceForTwo": 1800,
    "rating": 4.9,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Cyber Hub Social",
    "cuisines": [
      "North Indian",
      "Indo-Chinese",
      "American",
      "Continental"
    ],
    "locality": "Cyber Hub, DLF Cyber City, Gurugram",
    "area": "Gurgaon",
    "lat": 28.4949,
    "lng": 77.0888,
    "priceForTwo": 2000,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Yum Yum Cha (Cyber Hub)",
    "cuisines": [
      "Chinese",
      "Japanese"
    ],
    "locality": "Cyber Hub, DLF Cyber City, Gurugram",
    "area": "Gurgaon",
    "lat": 28.49495,
    "lng": 77.08865,
    "priceForTwo": 2000,
    "rating": 4.6,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Mamagoto (Cyber Hub)",
    "cuisines": [
      "Chinese",
      "Japanese",
      "Sri Lankan",
      "Thai"
    ],
    "locality": "Cyber Hub, DLF Cyber City, Gurugram",
    "area": "Gurgaon",
    "lat": 28.49485,
    "lng": 77.08872,
    "priceForTwo": 1800,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "YouMee (Airia Mall)",
    "cuisines": [
      "Chinese",
      "Japanese"
    ],
    "locality": "Airia Mall, Sector 68, Gurugram",
    "area": "Gurgaon",
    "lat": 28.38325,
    "lng": 77.05235,
    "priceForTwo": 3000,
    "rating": 4.6,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "fine_dining",
    "occasionFit": [
      "date",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Cafe Delhi Heights (Ardee Mall)",
    "cuisines": [
      "North Indian",
      "Italian",
      "American"
    ],
    "locality": "Ardee Mall, Sector 52, Gurugram",
    "area": "Gurgaon",
    "lat": 28.445,
    "lng": 77.0809,
    "priceForTwo": 2200,
    "rating": 4.1,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Burma Burma - Noida",
    "cuisines": [
      "Burmese",
      "Fusion"
    ],
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.5672,
    "lng": 77.3207,
    "priceForTwo": 1800,
    "rating": 4.9,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Chili's Grill & Bar (DLF Mall of India)",
    "cuisines": [
      "Mexican",
      "American",
      "Continental"
    ],
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.5671,
    "lng": 77.32055,
    "priceForTwo": 1600,
    "rating": 4.5,
    "takesReservations": false,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Mamagoto (DLF Mall of India)",
    "cuisines": [
      "Chinese",
      "Thai",
      "Japanese"
    ],
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.5673,
    "lng": 77.32065,
    "priceForTwo": 3500,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 100,
    "venueType": "fine_dining",
    "occasionFit": [
      "date",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Big Chill",
    "cuisines": [
      "Italian",
      "Desserts",
      "Beverages"
    ],
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.56705,
    "lng": 77.32075,
    "priceForTwo": 2400,
    "rating": 4.6,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Yum Yum Cha (DLF Mall of India)",
    "cuisines": [
      "Chinese",
      "Japanese",
      "Thai"
    ],
    "locality": "DLF Mall of India, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.56725,
    "lng": 77.3205,
    "priceForTwo": 2000,
    "rating": 4.4,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Imperfecto (Gardens Galleria)",
    "cuisines": [
      "North Indian",
      "Italian",
      "Asian"
    ],
    "locality": "Gardens Galleria, Sector 38, Noida",
    "area": "Noida",
    "lat": 28.5652,
    "lng": 77.3236,
    "priceForTwo": 3000,
    "rating": 4.0,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "fine_dining",
    "occasionFit": [
      "date",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Lord Of The Drinks",
    "cuisines": [
      "North Indian",
      "Continental",
      "Indo-Chinese",
      "Mediterranean"
    ],
    "locality": "Gardens Galleria, Sector 38, Noida",
    "area": "Noida",
    "lat": 28.56525,
    "lng": 77.32365,
    "priceForTwo": 2800,
    "rating": 4.2,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Desi Vibes",
    "cuisines": [
      "North Indian",
      "Punjabi"
    ],
    "locality": "Sector 18 Market, Noida",
    "area": "Noida",
    "lat": 28.5691,
    "lng": 77.3215,
    "priceForTwo": 1400,
    "rating": 4.3,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Local (Gardens Galleria)",
    "cuisines": [
      "North Indian",
      "Indo-Chinese",
      "Continental",
      "Asian"
    ],
    "locality": "Gardens Galleria, Sector 38, Noida",
    "area": "Noida",
    "lat": 28.56515,
    "lng": 77.32355,
    "priceForTwo": 2700,
    "rating": 4.2,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Impulse",
    "cuisines": [
      "North Indian",
      "Indo-Chinese",
      "Continental"
    ],
    "locality": "Gardens Galleria, Sector 38, Noida",
    "area": "Noida",
    "lat": 28.5653,
    "lng": 77.3237,
    "priceForTwo": 2500,
    "rating": 4.0,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Trippy Tequila",
    "cuisines": [
      "North Indian",
      "Continental",
      "Indo-Chinese",
      "Asian"
    ],
    "locality": "Gardens Galleria, Sector 38, Noida",
    "area": "Noida",
    "lat": 28.5651,
    "lng": 77.3235,
    "priceForTwo": 4000,
    "rating": 4.2,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Beer Cafe (Logix City Centre)",
    "cuisines": [
      "North Indian",
      "Indo-Chinese",
      "Continental"
    ],
    "locality": "Logix City Centre, Sector 32, Noida",
    "area": "Noida",
    "lat": 28.57405,
    "lng": 77.35385,
    "priceForTwo": 2000,
    "rating": 4.3,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Khan Chacha - Rolls, Kebabs and Biryani",
    "cuisines": [
      "North Indian",
      "Mughlai",
      "Biryani",
      "Kebab",
      "Rolls"
    ],
    "locality": "Logix City Centre, Sector 32, Noida",
    "area": "Noida",
    "lat": 28.5741,
    "lng": 77.3538,
    "priceForTwo": 500,
    "rating": 3.9,
    "takesReservations": false,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "family",
      "quick"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Yum Yum Cha (Saket)",
    "cuisines": [
      "Chinese",
      "Japanese",
      "Thai"
    ],
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.528902,
    "lng": 77.219722,
    "priceForTwo": 2000,
    "rating": 4.6,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Burma Burma - Saket",
    "cuisines": [
      "Burmese"
    ],
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.528476,
    "lng": 77.218602,
    "priceForTwo": 1800,
    "rating": 4.9,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Mamagoto (Saket)",
    "cuisines": [
      "Chinese",
      "Thai",
      "Japanese"
    ],
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.529249,
    "lng": 77.219502,
    "priceForTwo": 1500,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Chili's Grill & Bar (Saket)",
    "cuisines": [
      "Mexican",
      "American",
      "Continental"
    ],
    "locality": "DLF Avenue, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.528105,
    "lng": 77.215664,
    "priceForTwo": 2500,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Pa Pa Ya",
    "cuisines": [
      "Chinese",
      "Japanese",
      "Thai"
    ],
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.5287,
    "lng": 77.219,
    "priceForTwo": 2400,
    "rating": 4.8,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Punjab Grill",
    "cuisines": [
      "North Indian",
      "Punjabi",
      "Modern Indian"
    ],
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.5286,
    "lng": 77.2191,
    "priceForTwo": 2500,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Andrea's Eatery",
    "cuisines": [
      "Continental",
      "Asian"
    ],
    "locality": "Select Citywalk, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.52875,
    "lng": 77.2193,
    "priceForTwo": 2500,
    "rating": 4.7,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Mahabelly",
    "cuisines": [
      "South Indian",
      "Kerala"
    ],
    "locality": "DLF Avenue, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.52795,
    "lng": 77.21585,
    "priceForTwo": 1400,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Laidback Cafe",
    "cuisines": [
      "Mediterranean",
      "Thai",
      "Chinese"
    ],
    "locality": "DLF Avenue, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.52785,
    "lng": 77.2159,
    "priceForTwo": 1800,
    "rating": 4.6,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Call Chotu - All Day Diner & Bar",
    "cuisines": [
      "Modern Indian",
      "Continental",
      "Asian"
    ],
    "locality": "Southern Park, Saket, New Delhi",
    "area": "South Delhi",
    "lat": 28.5275,
    "lng": 77.216,
    "priceForTwo": 2400,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Nehru Place Social",
    "cuisines": [
      "North Indian",
      "Fusion",
      "Continental"
    ],
    "locality": "Epicuria, Nehru Place, New Delhi",
    "area": "South Delhi",
    "lat": 28.5514,
    "lng": 77.25145,
    "priceForTwo": 1500,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "FIO Cookhouse and Bar",
    "cuisines": [
      "Italian",
      "Modern Indian",
      "North Indian"
    ],
    "locality": "Epicuria, Nehru Place, New Delhi",
    "area": "South Delhi",
    "lat": 28.5513,
    "lng": 77.2515,
    "priceForTwo": 4500,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Chatter House",
    "cuisines": [
      "Italian",
      "American",
      "North Indian"
    ],
    "locality": "Epicuria, Nehru Place, New Delhi",
    "area": "South Delhi",
    "lat": 28.55145,
    "lng": 77.25135,
    "priceForTwo": 2500,
    "rating": 4.3,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Cafe Grumpee",
    "cuisines": [
      "Italian",
      "American",
      "Continental"
    ],
    "locality": "C Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.567674,
    "lng": 77.159138,
    "priceForTwo": 1500,
    "rating": 4.3,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/cafe-grumpee-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Golden Dragon",
    "cuisines": [
      "Chinese",
      "Beverages"
    ],
    "locality": "C Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.567769,
    "lng": 77.158755,
    "priceForTwo": 2200,
    "rating": 3.9,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "date",
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/the-golden-dragon-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Salad Chef",
    "cuisines": [
      "Healthy Food",
      "Salad",
      "Sandwich",
      "Fast Food",
      "Bakery",
      "Desserts",
      "Beverages"
    ],
    "locality": "C Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.567835,
    "lng": 77.158617,
    "priceForTwo": 500,
    "rating": 3.9,
    "takesReservations": false,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/salad-chef-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Bread & More",
    "cuisines": [
      "Sandwich",
      "Fast Food",
      "Bakery",
      "Pizza",
      "Beverages",
      "Cake"
    ],
    "locality": "C Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.567814,
    "lng": 77.15831,
    "priceForTwo": 1200,
    "rating": 4.1,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/bread-more-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "PCO",
    "cuisines": [
      "Italian",
      "Fast Food",
      "Continental"
    ],
    "locality": "D Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.56151,
    "lng": 77.155498,
    "priceForTwo": 3500,
    "rating": 4.8,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "fine_dining",
    "occasionFit": [
      "date",
      "family"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/pco-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "M.S & Sons",
    "cuisines": [
      "Mughlai",
      "North Indian",
      "Rolls",
      "Fast Food"
    ],
    "locality": "C Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.56771,
    "lng": 77.158748,
    "priceForTwo": 500,
    "rating": 2.3,
    "takesReservations": false,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/m-s-sons-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Bengal Sweet Palace",
    "cuisines": [
      "Chinese",
      "Street Food",
      "Fast Food",
      "Desserts",
      "Mithai"
    ],
    "locality": "A Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.565161,
    "lng": 77.163694,
    "priceForTwo": 200,
    "rating": 4.1,
    "takesReservations": false,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/bengal-sweet-palace-2-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Culinaire",
    "cuisines": [
      "Chinese",
      "Asian",
      "Thai",
      "Seafood"
    ],
    "locality": "A Block Market, Vasant Vihar, New Delhi",
    "area": "South Delhi",
    "lat": 28.561211,
    "lng": 77.167484,
    "priceForTwo": 1300,
    "rating": 3.3,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/culinaire-vasant-vihar-new-delhi",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Hira Sweets",
    "cuisines": [
      "Mithai",
      "North Indian",
      "South Indian",
      "Chinese",
      "Pizza",
      "Street Food",
      "Ice Cream",
      "Beverages"
    ],
    "locality": "Sector 29, Gurugram",
    "area": "Gurgaon",
    "lat": 28.468465,
    "lng": 77.063897,
    "priceForTwo": 500,
    "rating": 3.3,
    "takesReservations": true,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/hira-sweets-sector-29-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "AMPM Café & Bar",
    "cuisines": [
      "Continental",
      "Italian",
      "American",
      "European",
      "Oriental",
      "Beverages",
      "Desserts"
    ],
    "locality": "Galleria Market, DLF Phase 4, Gurugram",
    "area": "Gurgaon",
    "lat": 28.467636,
    "lng": 77.081696,
    "priceForTwo": 1400,
    "rating": 4.3,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/ampm-caf-bar-dlf-phase-4",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Downtown Fresh Beer Cafe - Galleria Market",
    "cuisines": [
      "North Indian",
      "Asian",
      "Italian",
      "Chinese",
      "Mediterranean",
      "Middle Eastern"
    ],
    "locality": "Galleria Market, DLF Phase 4, Gurugram",
    "area": "Gurgaon",
    "lat": 28.467392,
    "lng": 77.081577,
    "priceForTwo": 4000,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/downtown-fresh-beer-cafe-galleria-market-dlf-phase-4-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Fat Lulu's Pizza",
    "cuisines": [
      "Pizza"
    ],
    "locality": "Galleria Market, DLF Phase 4, Gurugram",
    "area": "Gurgaon",
    "lat": 28.467388,
    "lng": 77.082182,
    "priceForTwo": 1000,
    "rating": 3.9,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "casual_dining",
    "occasionFit": [
      "friends",
      "family"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/fat-lulus-pizza-dlf-phase-4-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "FES Cafe & Desserts",
    "cuisines": [
      "Beverages",
      "Cafe",
      "Cake",
      "Sandwich",
      "Desserts",
      "Coffee",
      "Ice Cream"
    ],
    "locality": "Galleria Market, DLF Phase 4, Gurugram",
    "area": "Gurgaon",
    "lat": 28.467368,
    "lng": 77.082044,
    "priceForTwo": 1200,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/fes-cafe-desserts-dlf-phase-4-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Blue Tokai Coffee Roasters",
    "cuisines": [
      "Cafe",
      "Coffee",
      "Sandwich",
      "Bakery",
      "Desserts",
      "Beverages"
    ],
    "locality": "Galleria Market, DLF Phase 4, Gurugram",
    "area": "Gurgaon",
    "lat": 28.467174,
    "lng": 77.082182,
    "priceForTwo": 800,
    "rating": 4.1,
    "takesReservations": false,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/blue-tokai-coffee-roasters-dlf-phase-4",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Amritsari Haveli",
    "cuisines": [
      "North Indian",
      "Chinese",
      "Biryani",
      "Desserts",
      "Shake",
      "Tea",
      "Beverages"
    ],
    "locality": "C Block, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.571032,
    "lng": 77.325013,
    "priceForTwo": 1600,
    "rating": 4.4,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/amritsari-haveli-sector-18-noida",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Dakshiini Cafe",
    "cuisines": [
      "South Indian",
      "Desserts",
      "Beverages"
    ],
    "locality": "Main Market, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.571078,
    "lng": 77.32436,
    "priceForTwo": 700,
    "rating": 4.2,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "qsr",
    "occasionFit": [
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/the-dakshiini-cafe-sector-18-noida",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Rooftop Heaven",
    "cuisines": [
      "North Indian",
      "Chinese",
      "Pizza",
      "Kebab",
      "Bar Food",
      "Continental",
      "Italian",
      "Desserts"
    ],
    "locality": "K Block, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.572044,
    "lng": 77.322837,
    "priceForTwo": 3000,
    "rating": 4.1,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/the-rooftop-heaven-sector-18-noida",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Adige Dosa House",
    "cuisines": [
      "South Indian",
      "Beverages",
      "Healthy Food",
      "Kerala"
    ],
    "locality": "K Block, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.571527,
    "lng": 77.323488,
    "priceForTwo": 1500,
    "rating": 4.5,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/adige-dosa-house-sector-18-noida",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Cafe 18",
    "cuisines": [
      "Pizza",
      "Momos",
      "Pasta",
      "Chinese",
      "Fast Food",
      "Sandwich",
      "Shake",
      "Beverages"
    ],
    "locality": "Savitri Market, Sector 18, Noida",
    "area": "Noida",
    "lat": 28.56992,
    "lng": 77.326453,
    "priceForTwo": 500,
    "rating": 3.0,
    "takesReservations": false,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/cafe-18-sector-18-noida",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Shree Iyengar Foods",
    "cuisines": [
      "South Indian",
      "Tamil"
    ],
    "locality": "Highstreet 52 Market, Sector 52, Gurugram",
    "area": "Gurgaon",
    "lat": 28.43609,
    "lng": 77.07231,
    "priceForTwo": 300,
    "rating": 4.2,
    "takesReservations": true,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.shreeiyengarfoods.com/",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Grover Sweets",
    "cuisines": [
      "Chinese",
      "Street Food",
      "North Indian",
      "Mithai"
    ],
    "locality": "Highstreet 52 Market, Sector 52, Gurugram",
    "area": "Gurgaon",
    "lat": 28.434284,
    "lng": 77.071632,
    "priceForTwo": 300,
    "rating": 4.0,
    "takesReservations": false,
    "mealDurationMins": 45,
    "venueType": "qsr",
    "occasionFit": [
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/grover-sweets-sector-52-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Amritsar Haveli",
    "cuisines": [
      "North Indian",
      "Biryani",
      "Rolls",
      "Chinese",
      "Desserts",
      "Beverages"
    ],
    "locality": "Koyal Vihar, Sector 52, Gurugram",
    "area": "Gurgaon",
    "lat": 28.435099,
    "lng": 77.072464,
    "priceForTwo": 1200,
    "rating": 3.9,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/amritsar-haveli-sector-52-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "Athenaa luxe club",
    "cuisines": [
      "North Indian",
      "Chinese",
      "Fast Food",
      "Biryani",
      "Pizza",
      "Momos",
      "Beverages",
      "Italian"
    ],
    "locality": "Sector 68, Sohna Road, Gurugram",
    "area": "Gurgaon",
    "lat": 28.388818,
    "lng": 77.044921,
    "priceForTwo": 1800,
    "rating": 3.8,
    "takesReservations": true,
    "mealDurationMins": 90,
    "venueType": "bar",
    "occasionFit": [
      "date",
      "friends"
    ],
    "vegFriendly": "UNKNOWN",
    "districtBooking": "CHECK",
    "sourceUrl": "https://www.zomato.com/ncr/athenaa-luxe-club-sector-68-gurgaon",
    "checkedOn": "2026-08-22"
  },
  {
    "name": "The Serene Spoon",
    "cuisines": [
      "North Indian",
      "Italian",
      "Chinese",
      "Fast Food",
      "Mughlai",
      "Beverages",
      "Desserts"
    ],
    "locality": "HSVP Market, Sector 52, Gurugram",
    "area": "Gurgaon",
    "lat": 28.434841,
    "lng": 77.071903,
    "priceForTwo": 1200,
    "rating": null,
    "takesReservations": true,
    "mealDurationMins": 70,
    "venueType": "cafe",
    "occasionFit": [
      "friends",
      "family",
      "quick"
    ],
    "vegFriendly": "Y",
    "districtBooking": "CHECK",
    "sourceUrl": "https://theserenespoon.com/",
    "checkedOn": "2026-08-22"
  }
];