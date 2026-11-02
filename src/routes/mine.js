const express = require("express");
const { Event } = require("../models/Event");
const { Participant } = require("../models/Participant");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// GET /api/my-events — events created by the logged-in user
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await Event.find({ creatorId: req.user.id }).sort({
      eventDate: 1,
    });
    const ids = items.map((e) => e._id);
    const counts = ids.length
      ? await Participant.aggregate([
          { $match: { eventId: { $in: ids } } },
          { $group: { _id: "$eventId", count: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json({
      items: items.map((e) => ({
        ...(e.toObject ? e.toObject() : e),
        participantCount: countMap.get(String(e._id)) || 0,
      })),
    });
  })
);

// GET /api/my-joined-events — joined events sorted by eventDate
router.get(
  "/joined",
  requireAuth,
  asyncHandler(async (req, res) => {
    const participations = await Participant.find({
      userId: req.user.id,
    }).lean();
    const eventIds = participations.map((p) => p.eventId);
    if (!eventIds.length) return res.json({ items: [] });

    const events = await Event.find({ _id: { $in: eventIds } }).lean();
    const joinedMap = new Map(
      participations.map((p) => [String(p.eventId), p.joinedAt])
    );
    const counts = await Participant.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const items = events
      .map((e) => ({
        ...e,
        joinedAt: joinedMap.get(String(e._id)),
        participantCount: countMap.get(String(e._id)) || 0,
      }))
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    res.json({ items });
  })
);

module.exports = router;
