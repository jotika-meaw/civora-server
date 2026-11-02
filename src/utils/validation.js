const { z } = require("zod");
const { CATEGORIES } = require("../models/Event");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const createEventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  category: z.enum(CATEGORIES),
  image: z.string().url("Image must be a valid URL"),
  location: z.string().min(2).max(160),
  eventDate: z.string().refine(
    (v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
    },
    { message: "eventDate must be a future date" }
  ),
});

const updateEventSchema = createEventSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "Provide at least one field to update" }
);

const newsletterSchema = z.object({
  email: z.string().email(),
});

const updateMeSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    image: z.string().url().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field to update",
  });

module.exports = {
  objectId,
  createEventSchema,
  updateEventSchema,
  newsletterSchema,
  updateMeSchema,
};
