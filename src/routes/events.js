const express = require("express");
const { Event } = require("../models/Event");
const { Participant } = require("../models/Participant");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  createEventSchema,
  updateEventSchema,
} = require("../utils/validation");

const router = express.Router();

function toEventJSON(event, participantCount = 0, isJoined = false) {
  const obj = event.toObject ? event.toObject() : event;
  return { ...obj, participantCount, isJoined };
}

// GET /api/events?search=&category=&location=&sort=asc|desc&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      search = "",
      category = "",
      location = "",
      sort = "asc",
      page = "1",
      limit = "12",
    } = req.query;

    const filter = {};
    // Only show upcoming events by default
    filter.eventDate = { $gte: new Date() };
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
    const sortDir = sort === "desc" ? -1 : 1;

    const [items, total] = await Promise.all([
      Event.find(filter)
        .sort({ eventDate: sortDir, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Event.countDocuments(filter),
    ]);

    const ids = items.map((e) => e._id);
    const counts = await Participant.aggregate([
      { $match: { eventId: { $in: ids } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json({
      items: items.map((e) =>
        toEventJSON(e, countMap.get(String(e._id)) || 0)
      ),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  })
);

// GET /api/events/recent?limit=6 — upcoming soonest first, for homepage
router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const limitNum = Math.min(
      24,
      Math.max(1, parseInt(req.query.limit, 10) || 6)
    );
    const items = await Event.find({ eventDate: { $gte: new Date() } })
      .sort({ eventDate: 1 })
      .limit(limitNum);

    const ids = items.map((e) => e._id);
    const counts = await Participant.aggregate([
      { $match: { eventId: { $in: ids } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json({
      items: items.map((e) =>
        toEventJSON(e, countMap.get(String(e._id)) || 0)
      ),
    });
  })
);

// GET /api/events/:id
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const participantCount = await Participant.countDocuments({
      eventId: event._id,
    });
    let isJoined = false;
    if (req.user?.id) {
      const existing = await Participant.findOne({
        eventId: event._id,
        userId: req.user.id,
      }).lean();
      isJoined = Boolean(existing);
    }
    res.json(toEventJSON(event, participantCount, isJoined));
  })
);

// POST /api/events — JWT
router.post(
  "/",
  requireAuth,
  validate(createEventSchema),
  asyncHandler(async (req, res) => {
    const event = await Event.create({
      ...req.body,
      eventDate: new Date(req.body.eventDate),
      creatorId: req.user.id,
      creatorEmail: req.user.email || "",
    });
    res.status(201).json(toEventJSON(event, 0, false));
  })
);

// PATCH /api/events/:id — JWT + Owner
router.patch(
  "/:id",
  requireAuth,
  validate(updateEventSchema),
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.creatorId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the organizer can edit this event" });
    }
    const patch = { ...req.body };
    if (patch.eventDate) {
      const d = new Date(patch.eventDate);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        return res
          .status(400)
          .json({ message: "eventDate must be a future date" });
      }
      patch.eventDate = d;
    }
    Object.assign(event, patch);
    await event.save();
    const participantCount = await Participant.countDocuments({
      eventId: event._id,
    });
    res.json(toEventJSON(event, participantCount, false));
  })
);

// DELETE /api/events/:id — JWT + Owner
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.creatorId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the organizer can delete this event" });
    }
    await Participant.deleteMany({ eventId: event._id });
    await event.deleteOne();
    res.json({ message: "Event deleted" });
  })
);

// POST /api/events/:id/join — JWT
router.post(
  "/:id/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.eventDate.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Cannot join a past event" });
    }
    try {
      await Participant.create({
        eventId: event._id,
        userId: req.user.id,
        userEmail: req.user.email || "",
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res
          .status(409)
          .json({ message: "You have already joined this event" });
      }
      throw err;
    }
    const participantCount = await Participant.countDocuments({
      eventId: event._id,
    });
    res.status(201).json({ message: "Joined event", participantCount });
  })
);

module.exports = router;
