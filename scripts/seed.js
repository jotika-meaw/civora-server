require("dotenv").config();
const { connectDB } = require("../src/config/db");
const { Event } = require("../src/models/Event");

const seed = [
  {
    title: "Neighborhood Cleanup Drive",
    description:
      "Join neighbors to clean parks, streets and drains. Gloves, bags and refreshments provided. Great for first-time volunteers.",
    category: "Cleanup",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    location: "Chattogram",
    eventDate: new Date("2026-12-05T09:00:00Z"),
    creatorId: "seed",
    creatorEmail: "hello@civora.local",
  },
  {
    title: "Winter Warmth Campaign",
    description:
      "Distribute blankets and warm clothes to families in need across the city. Help with collection, sorting and distribution.",
    category: "Donation",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
    location: "Dhaka",
    eventDate: new Date("2026-12-12T10:00:00Z"),
    creatorId: "seed",
    creatorEmail: "hello@civora.local",
  },
  {
    title: "Green City Initiative",
    description:
      "Plant 500 saplings along the avenue and learn urban gardening basics from local experts.",
    category: "Plantation",
    image:
      "https://images.unsplash.com/photo-1509099836633-18ba1795216d?w=800&q=80",
    location: "Khulshi, Chattogram",
    eventDate: new Date("2026-12-19T08:00:00Z"),
    creatorId: "seed",
    creatorEmail: "hello@civora.local",
  },
  {
    title: "Community Food Drive",
    description:
      "Pack and distribute food parcels to 300 families. Volunteers needed for packing, logistics and delivery.",
    category: "Food",
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
    location: "Agrabad, Chattogram",
    eventDate: new Date("2026-12-26T09:30:00Z"),
    creatorId: "seed",
    creatorEmail: "hello@civora.local",
  },
];

(async () => {
  await connectDB(process.env.MONGODB_URI);
  const count = await Event.countDocuments();
  if (count > 0) {
    console.log(`Events collection already has ${count} documents, skipping seed.`);
    process.exit(0);
  }
  const docs = await Event.insertMany(seed);
  console.log(`Seeded ${docs.length} events.`);
  process.exit(0);
})().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
