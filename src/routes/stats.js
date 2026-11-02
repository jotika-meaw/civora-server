const express = require("express");
const { Event } = require("../models/Event");
const { Participant } = require("../models/Participant");
const { NewsletterSubscriber } = require("../models/NewsletterSubscriber");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// GET /api/stats/community — public impact numbers for homepage
router.get(
  "/community",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const [totalEvents, totalParticipations, upcomingCount, subscriberCount] =
      await Promise.all([
        Event.countDocuments(),
        Participant.countDocuments(),
        Event.countDocuments({ eventDate: { $gte: now } }),
        NewsletterSubscriber.countDocuments(),
      ]);
    res.json({
      totalEvents,
      totalParticipations,
      upcomingCount,
      subscriberCount,
    });
  })
);

// GET /api/stats/me — personal volunteering history (JWT)
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [organized, joined, upcomingJoined] = await Promise.all([
      Event.countDocuments({ creatorId: req.user.id }),
      Participant.countDocuments({ userId: req.user.id }),
      Participant.aggregate([
        { $match: { userId: req.user.id } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $match: { "event.eventDate": { $gte: new Date() } } },
        { $count: "count" },
      ]),
    ]);
    const participations = await Participant.find({ userId: req.user.id })
      .sort({ joinedAt: -1 })
      .limit(5)
      .lean();
    const eventIds = participations.map((p) => p.eventId);
    const recentEvents =
      eventIds.length > 0
        ? await Event.find({ _id: { $in: eventIds } }).lean()
        : [];

    res.json({
      organized,
      joined,
      upcomingJoined: upcomingJoined?.[0]?.count || 0,
      recentEvents,
    });
  })
);

module.exports = router;
