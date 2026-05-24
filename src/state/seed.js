const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

const palette = [
  "#FF7E5F", "#FF3D8A", "#FF5E78", "#FFB089", "#E1306C",
  "#1E96A8", "#0E7C66", "#F5A05B", "#FF8E7D", "#9B5DE5",
  "#FFC75F", "#7FB069", "#F15BB5", "#00BBF9", "#FE6D73",
];

const people = [
  "Yukti", "Pranit", "Ansh", "Niti", "Veer",
  "Mohit", "Aditi", "Maq", "Umer", "Adina",
  "Wasma", "Maheen", "Sachin", "Sahil", "Mohit 2",
].map((name, i) => ({
  id: id("p"),
  name,
  emoji: ["✨", "🌴", "🍹", "🕶️", "🦩", "🌊", "🔆", "🎶", "🌅", "🍉", "💃", "🕺", "🌺", "🥥", "⚡"][i],
  color: palette[i % palette.length],
  role: i === 0 ? "Trip captain" : "",
}));

const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));

export const seedTrip = {
  meta: {
    title: "Miami '26",
    subtitle: "the crew takes south beach",
    startDate: "2026-05-29",
    endDate: "2026-06-01",
    city: "Miami, FL",
  },
  people,
  flights: people.map((p) => ({
    id: id("f"),
    personId: p.id,
    arrivalAirline: "",
    arrivalNumber: "",
    arrivalFrom: "",
    arrivalDate: "2026-05-29",
    arrivalTime: "",
    departureAirline: "",
    departureNumber: "",
    departureTo: "",
    departureDate: "2026-06-01",
    departureTime: "",
    confirmation: "",
  })),
  stay: {
    name: "Moxy Miami South Beach",
    address: "915 Washington Ave, Miami Beach, FL 33139",
    checkIn: "2026-05-29",
    checkOut: "2026-06-01",
    confirmation: "",
    notes: "Rooftop pool, walking distance to Ocean Dr.",
    rooms: [
      { id: id("r"), name: "Room 1", occupants: [] },
      { id: id("r"), name: "Room 2", occupants: [] },
      { id: id("r"), name: "Room 3", occupants: [] },
      { id: id("r"), name: "Room 4", occupants: [] },
    ],
  },
  cars: [
    { id: id("c"), label: "Car 1", make: "", model: "", company: "", pickup: "", dropoff: "", driverId: "", riders: [], confirmation: "" },
    { id: id("c"), label: "Car 2", make: "", model: "", company: "", pickup: "", dropoff: "", driverId: "", riders: [], confirmation: "" },
    { id: id("c"), label: "Car 3", make: "", model: "", company: "", pickup: "", dropoff: "", driverId: "", riders: [], confirmation: "" },
  ],
  itinerary: [
    {
      id: id("d"),
      date: "2026-05-29",
      title: "Touchdown · Day 1",
      vibe: "Arrivals + golden hour",
      events: [
        { id: id("e"), time: "Afternoon", title: "Check-in at Moxy", location: "Moxy South Beach", notes: "" },
        { id: id("e"), time: "Evening", title: "Sunset on the beach", location: "Lummus Park", notes: "Bring speaker" },
        { id: id("e"), time: "Night", title: "Welcome dinner", location: "TBD", notes: "Vote in polls" },
      ],
    },
    {
      id: id("d"),
      date: "2026-05-30",
      title: "Beach + Boat · Day 2",
      vibe: "Sun, sea, sangria",
      events: [
        { id: id("e"), time: "Morning", title: "Brunch", location: "TBD", notes: "" },
        { id: id("e"), time: "Afternoon", title: "Boat / jetski day", location: "Biscayne Bay", notes: "Sunscreen!" },
        { id: id("e"), time: "Night", title: "Club night — Story or LIV", location: "TBD", notes: "Theme: all white" },
      ],
    },
    {
      id: id("d"),
      date: "2026-05-31",
      title: "Wynwood + Wild · Day 3",
      vibe: "Art, food, late nights",
      events: [
        { id: id("e"), time: "Morning", title: "Wynwood Walls", location: "Wynwood", notes: "" },
        { id: id("e"), time: "Afternoon", title: "Cuban lunch + cafecito", location: "Little Havana", notes: "" },
        { id: id("e"), time: "Night", title: "Rooftop + dancing", location: "TBD", notes: "" },
      ],
    },
    {
      id: id("d"),
      date: "2026-06-01",
      title: "Wrap · Day 4",
      vibe: "Slow morning, departures",
      events: [
        { id: id("e"), time: "Morning", title: "Brunch + last beach walk", location: "TBD", notes: "" },
        { id: id("e"), time: "Afternoon", title: "Check-out + airport runs", location: "Moxy → MIA", notes: "Stagger by flight time" },
      ],
    },
  ],
  packing: {
    categories: [
      {
        id: id("k"),
        title: "Essentials",
        emoji: "🧳",
        items: [
          { id: id("i"), label: "Passport / ID", done: false },
          { id: id("i"), label: "Phone + charger", done: false },
          { id: id("i"), label: "Cash + cards", done: false },
          { id: id("i"), label: "Meds + skincare", done: false },
        ],
      },
      {
        id: id("k"),
        title: "Beach",
        emoji: "🏖️",
        items: [
          { id: id("i"), label: "Swimsuits (x3)", done: false },
          { id: id("i"), label: "Sunscreen SPF 50+", done: false },
          { id: id("i"), label: "Sunglasses", done: false },
          { id: id("i"), label: "Beach tote", done: false },
          { id: id("i"), label: "Slides / flip flops", done: false },
        ],
      },
      {
        id: id("k"),
        title: "Night out",
        emoji: "🪩",
        items: [
          { id: id("i"), label: "All white fit (Day 2)", done: false },
          { id: id("i"), label: "Heels / dress shoes", done: false },
          { id: id("i"), label: "Mini bag", done: false },
          { id: id("i"), label: "Statement jewelry", done: false },
        ],
      },
      {
        id: id("k"),
        title: "Extras",
        emoji: "✨",
        items: [
          { id: id("i"), label: "Polaroid / camera", done: false },
          { id: id("i"), label: "Portable speaker", done: false },
          { id: id("i"), label: "Reusable water bottle", done: false },
          { id: id("i"), label: "Advil 🙏", done: false },
        ],
      },
    ],
  },
  expenses: [],
  places: [
    {
      id: id("pl"),
      name: "Moxy Miami South Beach",
      address: "915 Washington Ave, Miami Beach, FL",
      lat: 25.78062,
      lng: -80.13145,
      category: "stay",
      notes: "Home base · rooftop pool",
    },
    {
      id: id("pl"),
      name: "Lummus Park / South Beach",
      address: "Ocean Dr, Miami Beach, FL",
      lat: 25.7822,
      lng: -80.13,
      category: "beach",
      notes: "Golden hour sunset spot",
    },
    {
      id: id("pl"),
      name: "Wynwood Walls",
      address: "2516 NW 2nd Ave, Miami, FL",
      lat: 25.80108,
      lng: -80.19918,
      category: "activity",
      notes: "Day 3 — street art",
    },
    {
      id: id("pl"),
      name: "Little Havana / Calle Ocho",
      address: "SW 8th St, Miami, FL",
      lat: 25.7651,
      lng: -80.2266,
      category: "food",
      notes: "Cuban lunch + cafecito",
    },
    {
      id: id("pl"),
      name: "LIV Nightclub",
      address: "4441 Collins Ave, Miami Beach, FL",
      lat: 25.81738,
      lng: -80.12184,
      category: "club",
      notes: "Saturday night option",
    },
    {
      id: id("pl"),
      name: "Joe's Stone Crab",
      address: "11 Washington Ave, Miami Beach, FL",
      lat: 25.76773,
      lng: -80.13473,
      category: "food",
      notes: "Old-school Miami dinner",
    },
  ],
  polls: [
    {
      id: id("po"),
      question: "Saturday night — which club?",
      options: [
        { id: id("op"), label: "LIV", voters: [] },
        { id: id("op"), label: "Story", voters: [] },
        { id: id("op"), label: "E11EVEN", voters: [] },
        { id: id("op"), label: "rooftop bar instead", voters: [] },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: id("po"),
      question: "Day 2 dress code?",
      options: [
        { id: id("op"), label: "All white 🤍", voters: [] },
        { id: id("op"), label: "Neon / 80s 💖", voters: [] },
        { id: id("op"), label: "Beach formal 🕶️", voters: [] },
        { id: id("op"), label: "No theme, just vibes", voters: [] },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: id("po"),
      question: "Boat or jetski for Day 2?",
      options: [
        { id: id("op"), label: "Boat charter", voters: [] },
        { id: id("op"), label: "Jetski rental", voters: [] },
        { id: id("op"), label: "Both 😎", voters: [] },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
};

export { id, peopleById };
