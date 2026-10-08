import type {
  Activity,
  ActivityCategory,
  ActivityStatus,
  Community,
  ParticipationStatus,
  SlotStatus,
  User,
} from '@/types/activity';
import type { BroadcastActivityId } from '@/types/broadcast';

/**
 * Single source of placeholder content until the API exists. Activities point
 * at users by id, so counts, avatars and "free nearby" lists stay consistent
 * across Home, the map, Activity Detail and I'm Free.
 */

export const CATEGORY_EMOJI: Record<BroadcastActivityId, string | undefined> = {
  running: '🏃',
  coffee: '☕',
  food: '🍜',
  football: '⚽',
  badminton: '🏸',
  gaming: '🎮',
  movie: '🎬',
  walking: '🚶',
  photography: '📸',
  coworking: '💻',
  language: '🗣️',
  other: undefined,
};

const USER_LIST: User[] = [
  {
    id: 'minh',
    name: 'Minh Trần',
    age: 29,
    avatar: require('@/assets/images/home/avatar-minh.jpg'),
    distanceKm: 1.1,
    freeInMinutes: null,
    note: 'Pace ~5:45 min/km',
    trust: 98,
    activitiesCount: 12,
    interests: ['running', 'coffee', 'football'],
  },
  {
    id: 'lan',
    name: 'Lan Anh',
    age: 26,
    avatar: require('@/assets/images/home/avatar-lan.jpg'),
    distanceKm: 0.7,
    freeInMinutes: null,
    note: 'Product designer',
    trust: 95,
    activitiesCount: 7,
    interests: ['coffee', 'coworking', 'language', 'food'],
  },
  {
    id: 'linh',
    name: 'Linh Đan',
    age: 25,
    avatar: require('@/assets/images/home/avatar-runner-2.jpg'),
    distanceKm: 1.6,
    freeInMinutes: null,
    note: 'Pace ~6:10 min/km',
    trust: 93,
    activitiesCount: 9,
    interests: ['running', 'badminton', 'football'],
  },
  {
    id: 'huy',
    name: 'Quang Huy',
    age: 31,
    avatar: require('@/assets/images/home/avatar-runner-3.jpg'),
    distanceKm: 2.4,
    freeInMinutes: null,
    note: 'Midfielder, 5v5',
    trust: 90,
    activitiesCount: 4,
    interests: ['running', 'football'],
  },
  {
    id: 'tuan',
    name: 'Tuấn Lê',
    age: 28,
    avatar: require('@/assets/images/home/avatar-cowork-2.jpg'),
    distanceKm: 0.9,
    freeInMinutes: null,
    note: 'Remote developer',
    trust: 92,
    activitiesCount: 6,
    interests: ['coffee', 'coworking', 'football'],
  },
  {
    id: 'an',
    name: 'Bảo An',
    age: 30,
    avatar: require('@/assets/images/home/avatar-minh-friends.jpg'),
    distanceKm: 2.2,
    freeInMinutes: null,
    note: 'Goalkeeper',
    trust: 97,
    activitiesCount: 21,
    interests: ['football', 'badminton'],
  },
  // Friends with long names, so the story strip shows how they wrap.
  {
    id: 'phuong-linh',
    name: 'Nguyễn Hoàng Phương Linh',
    age: 24,
    avatar: require('@/assets/images/signup/avatar-3.jpg'),
    distanceKm: 3.1,
    freeInMinutes: null,
    note: 'Weekend hiker',
    trust: 93,
    activitiesCount: 8,
    interests: ['walking', 'photography', 'coffee'],
  },
  {
    id: 'bao-ngoc',
    name: 'Trần Thị Bảo Ngọc',
    age: 26,
    avatar: require('@/assets/images/home/avatar-lan-anh.jpg'),
    distanceKm: 2.6,
    freeInMinutes: null,
    note: 'Loves a slow brunch',
    trust: 95,
    activitiesCount: 12,
    interests: ['food', 'coffee', 'language'],
  },
  {
    id: 'hai-long',
    name: 'Hải Long',
    age: 27,
    avatar: require('@/assets/images/home/avatar-runner-1.jpg'),
    distanceKm: 0.7,
    freeInMinutes: 0,
    note: 'Pace ~5:35 min/km',
    trust: 96,
    activitiesCount: 8,
    interests: ['running', 'coffee', 'football', 'walking'],
    freeWish: {
      category: 'running',
      text: 'Up for a 5 km run around West Lake',
    },
    coordinate: [105.8318, 21.0498],
    locationPublic: true,
  },
  {
    id: 'thao-vy',
    name: 'Thảo Vy',
    age: 24,
    avatar: require('@/assets/images/home/avatar-cowork-1.jpg'),
    distanceKm: 1.4,
    freeInMinutes: 20,
    note: 'Easy pace 6:00',
    trust: 100,
    activitiesCount: 15,
    interests: ['photography', 'walking', 'running', 'coffee'],
    freeWish: {
      category: 'photography',
      text: 'Looking for a golden hour photo buddy',
    },
    coordinate: [105.8392, 21.0462],
    locationPublic: true,
  },
  {
    id: 'mai',
    name: 'Ngọc Mai',
    age: 27,
    avatar: require('@/assets/images/home/avatar-lan-anh.jpg'),
    distanceKm: 3.8,
    freeInMinutes: 10,
    note: 'Street food hunter',
    trust: 94,
    activitiesCount: 11,
    interests: ['food', 'coffee', 'badminton', 'walking'],
    freeWish: { category: 'coffee', text: 'Coffee and a chat after work?' },
    // Free, but keeps their location private: listed, never on the map.
    coordinate: [105.8455, 21.0412],
    locationPublic: false,
  },
  {
    id: 'gia-han',
    name: 'Gia Hân',
    age: 25,
    avatar: require('@/assets/images/signup/avatar-1.jpg'),
    distanceKm: 1.0,
    freeInMinutes: 0,
    note: 'Pace ~6:00 min/km',
    trust: 97,
    activitiesCount: 10,
    interests: ['running', 'badminton', 'walking'],
    freeWish: { category: 'badminton', text: 'Need a doubles partner tonight' },
    coordinate: [105.8268, 21.0602],
    locationPublic: true,
  },
  {
    id: 'duc-anh',
    name: 'Đức Anh',
    age: 29,
    avatar: require('@/assets/images/signup/avatar-2.jpg'),
    distanceKm: 1.8,
    freeInMinutes: 15,
    note: 'Freelance designer',
    trust: 95,
    activitiesCount: 6,
    interests: ['coworking', 'coffee', 'language'],
    freeWish: {
      category: 'coworking',
      text: 'Co-working at a quiet café this afternoon',
    },
    coordinate: [105.8215, 21.0545],
    locationPublic: true,
  },
];

export const USERS: Record<string, User> = Object.fromEntries(
  USER_LIST.map(user => [user.id, user]),
);

/** People already on the signed-in user's friend list. */
const FRIEND_IDS = new Set([
  'minh',
  'lan',
  'thao-vy',
  'gia-han',
  'phuong-linh',
  'bao-ngoc',
]);

export const isFriend = (userId: string) => FRIEND_IDS.has(userId);

/**
 * One activity per state the detail screen handles, plus past ones for the
 * chat list and history. Which ones the user has joined or checked in to is
 * seeded in the activity slice.
 */
export const ACTIVITIES: Activity[] = [
  // Upcoming, not joined yet.
  {
    id: 'sunset-lake-run',
    category: 'running',
    title: 'Sunset Lakeside Run & Stretch',
    markerTitle: 'Lakeside Jog',
    tag: 'Run • 5 km',
    description:
      'Pacing 6:00/km easy conversational jog around Tran Quoc Pagoda track.',
    longDescription:
      'An easy loop around West Lake to catch the sunset, then iced tea on the sidewalk to meet new friends. Good vibes, no pressure on pace.',
    coordinate: [105.833, 21.0515],
    distanceKm: 1.2,
    meetingPoint: 'Thanh Nien Rd',
    routeLabel: 'Breezy lakeside route',
    routeName: 'West Lake – Thanh Nien Loop',
    startsInMinutes: 130,
    durationMinutes: 60,
    createdMinutesAgo: 50,
    instantMatch: true,
    hostId: 'minh',
    members: [
      { userId: 'minh', status: 'Booked the meeting spot', ready: true },
      { userId: 'linh', status: 'Coming after work', ready: true },
      { userId: 'huy', status: 'New member', ready: false },
    ],
    capacity: 6,
    extraTile: { kind: 'pace', value: '5:30 - 6:00', hint: 'Easy, relaxed' },
    cover: require('@/assets/images/discover/sunset-run.jpg'),
  },
  // Upcoming, joined.
  {
    id: 'quang-an-doubles',
    category: 'badminton',
    title: 'Doubles at Quang An Court',
    markerTitle: 'Badminton Doubles',
    tag: 'Badminton • Doubles',
    description: 'One more for doubles, shuttles provided.',
    longDescription:
      'Two courts booked for an hour. Intermediate level, we rotate partners every game.',
    coordinate: [105.8285, 21.0655],
    distanceKm: 1.9,
    meetingPoint: 'Quang An Court',
    routeLabel: 'Covered courts',
    routeName: 'Quang An Sports Center',
    startsInMinutes: 60,
    durationMinutes: 60,
    createdMinutesAgo: 25,
    instantMatch: false,
    hostId: 'linh',
    members: [
      { userId: 'linh', status: 'Court booked', ready: true },
      { userId: 'mai', status: 'Bringing shuttles', ready: false },
    ],
    capacity: 4,
    extraTile: { kind: 'vibe', value: 'Intermediate', hint: 'Rotate partners' },
  },
  // Ongoing, not joined: details only.
  {
    id: 'highlands-cowork',
    category: 'coffee',
    title: 'Coffee & Casual Co-work',
    markerTitle: 'Highlands Chill',
    tag: 'Coffee & Work',
    description:
      'Highlands Coffee Boat terrace, plenty of outdoor seating and quiet shade.',
    longDescription:
      'Bring your laptop and get some focused work done together. Plenty of outdoor seating, good Wi-Fi and a coffee break every hour.',
    coordinate: [105.8335, 21.0585],
    distanceKm: 0.7,
    meetingPoint: 'Highlands Boat',
    routeLabel: 'Shady terrace by the lake',
    routeName: 'Highlands Coffee Boat',
    startsInMinutes: -30,
    durationMinutes: 240,
    createdMinutesAgo: 95,
    instantMatch: true,
    hostId: 'lan',
    members: [
      { userId: 'lan', status: 'At the table by the window', ready: true },
      { userId: 'tuan', status: 'Working on slides', ready: true },
    ],
    extraTile: { kind: 'vibe', value: 'Quiet work', hint: 'Chat on breaks' },
  },
  // Ongoing, joined and checked in: live map. One member is still on the way.
  {
    id: 'buoi-park-kickabout',
    category: 'football',
    title: 'Casual Kickabout',
    markerTitle: 'Kickabout',
    tag: 'Football • Casual',
    description: 'Already playing, relaxed kickabout with no score.',
    longDescription:
      'No teams, no score, just passing and fun until the light goes.',
    coordinate: [105.8169, 21.0569],
    distanceKm: 2.2,
    meetingPoint: 'Buoi Park',
    routeLabel: 'Open grass field',
    routeName: 'Buoi Park Field',
    startsInMinutes: -15,
    durationMinutes: 75,
    createdMinutesAgo: 40,
    instantMatch: true,
    hostId: 'tuan',
    members: [
      { userId: 'tuan', status: 'On the field', ready: true },
      { userId: 'an', status: 'Warming up', ready: true },
      { userId: 'huy', status: 'On the way', ready: false },
    ],
    capacity: 8,
    extraTile: { kind: 'vibe', value: 'Relaxed', hint: 'No score' },
  },
  // Completed, joined: history and a read-only group chat.
  {
    id: 'hoan-kiem-sunrise',
    category: 'running',
    title: 'Sunrise Run at Hoan Kiem',
    markerTitle: 'Sunrise Run',
    tag: 'Run • 4 km',
    description: 'Two easy laps of Hoan Kiem lake before the city wakes up.',
    longDescription:
      'Two laps at a chatty pace, then banh mi and coffee on Dinh Tien Hoang.',
    coordinate: [105.8523, 21.0287],
    distanceKm: 3.4,
    meetingPoint: 'Huc Bridge',
    routeLabel: 'Lakeside loop',
    routeName: 'Hoan Kiem Lake Loop',
    startsInMinutes: -1560,
    durationMinutes: 60,
    createdMinutesAgo: 1800,
    instantMatch: false,
    hostId: 'minh',
    members: [
      { userId: 'minh', status: 'Led the pace', ready: true },
      { userId: 'linh', status: 'Finished strong', ready: true },
      { userId: 'gia-han', status: 'First run with the group', ready: true },
    ],
    capacity: 8,
    extraTile: { kind: 'pace', value: '6:30', hint: 'Chatty pace' },
  }, // More finished activities, so Chats and history have something to show.
  {
    id: 'tay-ho-coffee-chat',
    category: 'coffee',
    title: 'Slow Morning Coffee in Tay Ho',
    markerTitle: 'Tay Ho Coffee',
    tag: 'Coffee • Chat',
    description: 'Egg coffee and a slow chat by the lake.',
    longDescription:
      'A slow morning with egg coffee and good conversation on a quiet terrace facing West Lake.',
    coordinate: [105.8262, 21.0631],
    distanceKm: 1.5,
    meetingPoint: 'Xuan Dieu St',
    routeLabel: 'Lake view terrace',
    routeName: 'Tay Ho Terrace Cafe',
    startsInMinutes: -300,
    durationMinutes: 90,
    createdMinutesAgo: 420,
    instantMatch: false,
    hostId: 'lan',
    members: [
      { userId: 'lan', status: 'Saved the corner table', ready: true },
      { userId: 'thao-vy', status: 'Tried the coconut coffee', ready: true },
      { userId: 'duc-anh', status: 'First time in Tay Ho', ready: true },
    ],
    capacity: 6,
    extraTile: { kind: 'vibe', value: 'Slow chat', hint: 'No laptops' },
  },
  {
    id: 'old-quarter-pho-crawl',
    category: 'food',
    title: 'Old Quarter Pho Crawl',
    markerTitle: 'Pho Crawl',
    tag: 'Food • 3 stops',
    description: 'Three pho stalls in two hours, rate them all.',
    longDescription:
      'Bat Dan, Hang Trong and Ly Quoc Su: three bowls, one scoreboard and plenty of iced tea in between.',
    coordinate: [105.8466, 21.0336],
    distanceKm: 2.8,
    meetingPoint: 'Bat Dan St',
    routeLabel: 'Walking food tour',
    routeName: 'Old Quarter Streets',
    startsInMinutes: -2900,
    durationMinutes: 120,
    createdMinutesAgo: 3200,
    instantMatch: false,
    hostId: 'hai-long',
    members: [
      { userId: 'hai-long', status: 'Kept the scoreboard', ready: true },
      { userId: 'an', status: 'Voted for Bat Dan', ready: true },
      { userId: 'mai', status: 'Too full for the last bowl', ready: true },
    ],
    capacity: 5,
    extraTile: { kind: 'vibe', value: 'Foodie', hint: 'Bring an appetite' },
  },
  {
    id: 'my-dinh-badminton',
    category: 'badminton',
    title: 'Evening Doubles at My Dinh',
    markerTitle: 'My Dinh Doubles',
    tag: 'Badminton • Doubles',
    description: 'Two hours of doubles with rotating partners.',
    longDescription:
      'Indoor courts with good lighting. We played eight games and swapped partners each time.',
    coordinate: [105.7688, 21.0203],
    distanceKm: 6.4,
    meetingPoint: 'My Dinh Arena',
    routeLabel: 'Indoor courts',
    routeName: 'My Dinh Sports Hall',
    startsInMinutes: -4300,
    durationMinutes: 90,
    createdMinutesAgo: 4600,
    instantMatch: false,
    hostId: 'mai',
    members: [
      { userId: 'mai', status: 'Booked court 3', ready: true },
      { userId: 'huy', status: 'Brought new shuttles', ready: true },
      { userId: 'tuan', status: 'Won the last game', ready: true },
    ],
    capacity: 4,
    extraTile: { kind: 'vibe', value: 'Intermediate', hint: 'Rotate partners' },
  },
  {
    id: 'old-quarter-photo-walk',
    category: 'photography',
    title: 'Golden Hour Photo Walk',
    markerTitle: 'Photo Walk',
    tag: 'Photo • Street',
    description: 'Street photography from the train street to the bridge.',
    longDescription:
      'A slow walk through the Old Quarter at golden hour, swapping tips and trying each other’s lenses.',
    coordinate: [105.8452, 21.0302],
    distanceKm: 2.5,
    meetingPoint: 'Phung Hung Murals',
    routeLabel: 'Street & architecture',
    routeName: 'Old Quarter to Long Bien',
    startsInMinutes: -5800,
    durationMinutes: 120,
    createdMinutesAgo: 6100,
    instantMatch: false,
    hostId: 'thao-vy',
    members: [
      { userId: 'thao-vy', status: 'Led the route', ready: true },
      { userId: 'gia-han', status: 'Shot on film', ready: true },
      { userId: 'lan', status: 'Found the best rooftop', ready: true },
    ],
    capacity: 8,
    extraTile: { kind: 'vibe', value: 'Golden hour', hint: 'Any camera' },
  },
  {
    id: 'board-game-night',
    category: 'gaming',
    title: 'Board Game Night',
    markerTitle: 'Board Games',
    tag: 'Games • Indoor',
    description: 'Catan, Codenames and too many snacks.',
    longDescription:
      'A cozy evening of board games at a cafe in Dong Da, from quick party games to a long Catan match.',
    coordinate: [105.8256, 21.0182],
    distanceKm: 3.1,
    meetingPoint: 'Meeple Cafe',
    routeLabel: 'Cozy cafe upstairs',
    routeName: 'Meeple Board Game Cafe',
    startsInMinutes: -7300,
    durationMinutes: 180,
    createdMinutesAgo: 7700,
    instantMatch: false,
    hostId: 'duc-anh',
    members: [
      { userId: 'duc-anh', status: 'Explained the rules', ready: true },
      { userId: 'an', status: 'Won at Catan', ready: true },
      { userId: 'linh', status: 'Codenames champion', ready: true },
      { userId: 'huy', status: 'Brought the snacks', ready: true },
    ],
    capacity: 6,
    extraTile: { kind: 'vibe', value: 'Casual', hint: 'Beginners welcome' },
  },
  {
    id: 'english-coffee-exchange',
    category: 'language',
    title: 'English & Vietnamese Exchange',
    markerTitle: 'Language Exchange',
    tag: 'Language • Coffee',
    description: 'Half English, half Vietnamese, all coffee.',
    longDescription:
      'Practice both languages in small groups, switching every 20 minutes over coffee.',
    coordinate: [105.8412, 21.0245],
    distanceKm: 2.1,
    meetingPoint: 'Cong Caphe Trieu Viet Vuong',
    routeLabel: 'Quiet upstairs room',
    routeName: 'Cong Caphe',
    startsInMinutes: -10100,
    durationMinutes: 90,
    createdMinutesAgo: 10400,
    instantMatch: false,
    hostId: 'gia-han',
    members: [
      { userId: 'gia-han', status: 'Brought topic cards', ready: true },
      { userId: 'lan', status: 'Practised her Vietnamese', ready: true },
      { userId: 'duc-anh', status: 'Helped with slang', ready: true },
    ],
    capacity: 8,
    extraTile: { kind: 'vibe', value: 'Friendly', hint: 'All levels' },
  },
  {
    id: 'west-lake-evening-walk',
    category: 'walking',
    title: 'Evening Walk around West Lake',
    markerTitle: 'Lake Walk',
    tag: 'Walk • 6 km',
    description: 'A relaxed loop around West Lake after work.',
    longDescription:
      'Six kilometres at an easy pace, with a stop for che at the halfway point.',
    coordinate: [105.8189, 21.0583],
    distanceKm: 1.8,
    meetingPoint: 'Lac Long Quan Gate',
    routeLabel: 'Lakeside path',
    routeName: 'West Lake Loop',
    startsInMinutes: -11500,
    durationMinutes: 60,
    createdMinutesAgo: 11800,
    instantMatch: false,
    hostId: 'an',
    members: [
      { userId: 'an', status: 'Set the pace', ready: true },
      { userId: 'minh', status: 'Knew the che stall', ready: true },
      { userId: 'thao-vy', status: 'Took the sunset photos', ready: true },
    ],
    capacity: 10,
    extraTile: { kind: 'pace', value: 'Easy', hint: 'About 12 min/km' },
  },
  {
    id: 'indie-movie-night',
    category: 'movie',
    title: 'Indie Movie Night',
    markerTitle: 'Movie Night',
    tag: 'Movie • Indie',
    description: 'Vietnamese indie film, then a chat over tea.',
    longDescription:
      'A screening at a small cinema club followed by a long talk about the ending over lotus tea.',
    coordinate: [105.8521, 21.0218],
    distanceKm: 3.0,
    meetingPoint: 'Hanoi Cinematheque',
    routeLabel: 'Small screening room',
    routeName: 'Hanoi Cinematheque',
    startsInMinutes: -14400,
    durationMinutes: 150,
    createdMinutesAgo: 14700,
    instantMatch: false,
    hostId: 'linh',
    members: [
      { userId: 'linh', status: 'Picked the film', ready: true },
      { userId: 'mai', status: 'Cried at the ending', ready: true },
      { userId: 'hai-long', status: 'Started the debate', ready: true },
    ],
    capacity: 8,
    extraTile: { kind: 'vibe', value: 'Thoughtful', hint: 'Chat after' },
  },
];

export const COMMUNITIES: Community[] = [
  {
    id: 'sunset-runners',
    name: 'Hanoi Sunset Runners',
    category: 'running',
    icon: 'walk',
    tone: 'primary',
    membersCount: 1200,
    schedule: 'Daily runs at 18:00',
  },
  {
    id: 'coffee-connect',
    name: 'Hanoi Coffee & Chill Connect',
    category: 'coffee',
    icon: 'cafe',
    tone: 'neutral',
    membersCount: 850,
    schedule: 'Saturday morning meetups',
  },
  {
    id: 'badminton-newbies',
    name: 'Badminton Newbies Hanoi',
    category: 'badminton',
    icon: 'tennisball',
    tone: 'success',
    membersCount: 620,
    schedule: 'Weekend friendly games',
  },
  {
    id: 'street-food',
    name: 'Old Quarter Street Food Club',
    category: 'food',
    icon: 'restaurant',
    tone: 'primary',
    membersCount: 430,
    schedule: 'Food walks every Friday',
  },
  {
    id: 'hanoi-lens',
    name: 'Hanoi Lens Walkers',
    category: 'photography',
    icon: 'camera',
    tone: 'neutral',
    membersCount: 1500,
    schedule: 'Photo walks every Sunday',
  },
  {
    id: 'pickup-football',
    name: 'Cau Giay Pickup Football',
    category: 'football',
    icon: 'football',
    tone: 'success',
    membersCount: 980,
    schedule: 'Pickup games Tue & Thu nights',
  },
  {
    id: 'board-game-night',
    name: 'Board Game Night Hanoi',
    category: 'gaming',
    icon: 'game-controller',
    tone: 'primary',
    membersCount: 760,
    schedule: 'Game nights on Wednesdays',
  },
  {
    id: 'west-lake-walkers',
    name: 'West Lake Evening Walkers',
    category: 'walking',
    icon: 'footsteps',
    tone: 'success',
    membersCount: 540,
    schedule: 'Evening loops around West Lake',
  },
  {
    id: 'cafe-coworkers',
    name: 'Cafe Coworkers Hanoi',
    category: 'coworking',
    icon: 'laptop',
    tone: 'neutral',
    membersCount: 510,
    schedule: 'Focus sessions on weekdays',
  },
  {
    id: 'smash-club',
    name: 'Smash Club Doubles',
    category: 'badminton',
    icon: 'tennisball',
    tone: 'primary',
    membersCount: 450,
    schedule: 'Intermediate doubles on weekdays',
  },
  {
    id: 'indie-movie',
    name: 'Indie Movie Circle',
    category: 'movie',
    icon: 'film',
    tone: 'neutral',
    membersCount: 390,
    schedule: 'Indie screenings twice a month',
  },
  {
    id: 'language-exchange',
    name: 'Hanoi Language Exchange',
    category: 'language',
    icon: 'chatbubbles',
    tone: 'success',
    membersCount: 1100,
    schedule: 'English-Vietnamese swaps on Thursdays',
  },
  {
    id: 'early-birds',
    name: 'Early Birds Running Crew',
    category: 'running',
    icon: 'sunny',
    tone: 'success',
    membersCount: 310,
    schedule: 'Sunrise runs at 5:30',
  },
];

export const getActivity = (id: string) =>
  ACTIVITIES.find(activity => activity.id === id);

export const getUser = (id: string) => USERS[id];

export function activityStatus(activity: Activity): ActivityStatus {
  if (activity.startsInMinutes > 0) {
    return 'upcoming';
  }
  return activity.startsInMinutes + activity.durationMinutes > 0
    ? 'ongoing'
    : 'completed';
}

export const participationStatus = (
  activity: Activity,
  joinedIds: readonly string[],
): ParticipationStatus =>
  joinedIds.includes(activity.id) ? 'joined' : 'not_joined';

export const isJoined = (activity: Activity, joinedIds: readonly string[]) =>
  participationStatus(activity, joinedIds) === 'joined';

export const spotsLeft = (activity: Activity) =>
  activity.capacity === undefined
    ? null
    : Math.max(activity.capacity - activity.members.length, 0);

export const slotStatus = (activity: Activity): SlotStatus =>
  spotsLeft(activity) === 0 ? 'full' : 'available';

/** Shown on Home and Discover: not over yet, with room left. */
export const isBrowsable = (activity: Activity) =>
  activityStatus(activity) !== 'completed' &&
  slotStatus(activity) === 'available';

const timesOverlap = (a: Activity, b: Activity) =>
  a.startsInMinutes < b.startsInMinutes + b.durationMinutes &&
  b.startsInMinutes < a.startsInMinutes + a.durationMinutes;

/** Another not-yet-finished activity the user joined that clashes in time. */
export const findTimeConflict = (
  activity: Activity,
  joinedIds: readonly string[],
) =>
  ACTIVITIES.find(
    other =>
      other.id !== activity.id &&
      activityStatus(other) !== 'completed' &&
      participationStatus(other, joinedIds) === 'joined' &&
      timesOverlap(activity, other),
  );

/** Completed activities the user took part in, most recent first. */
export const activityHistory = (joinedIds: readonly string[]) =>
  ACTIVITIES.filter(
    activity =>
      activityStatus(activity) === 'completed' &&
      participationStatus(activity, joinedIds) === 'joined',
  ).sort((a, b) => b.startsInMinutes - a.startsInMinutes);

/** Friends can only be invited before it starts. */
export const canInviteTo = (activity: Activity) =>
  activityStatus(activity) === 'upcoming';

/** Free people who like this kind of activity and aren't in it yet. */
export const freeUsersFor = (activity: Activity) => {
  const memberIds = new Set(activity.members.map(member => member.userId));
  return USER_LIST.filter(
    user =>
      user.freeInMinutes !== null &&
      !memberIds.has(user.id) &&
      user.interests.includes(activity.category),
  ).sort(
    (a, b) =>
      (a.freeInMinutes ?? 0) - (b.freeInMinutes ?? 0) ||
      a.distanceKm - b.distanceKm,
  );
};

/** Everyone free within the radius; matching interests come first. */
export const freeUsersWithin = (
  radiusKm: number,
  category?: ActivityCategory,
) =>
  USER_LIST.filter(
    user => user.freeInMinutes !== null && user.distanceKm <= radiusKm,
  ).sort(
    (a, b) =>
      Number(!!category && b.interests.includes(category)) -
        Number(!!category && a.interests.includes(category)) ||
      a.distanceKm - b.distanceKm,
  );
