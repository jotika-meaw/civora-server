const express = require("express");
const { User } = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { updateMeSchema } = require("../utils/validation");

const router = express.Router();

// GET /api/users/me — JWT
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      $or: [{ _id: req.user.id }, { id: req.user.id }, { email: req.user.email }],
    }).lean();

    res.json({
      id: req.user.id,
      email: req.user.email,
      name: user?.name || req.user.name || "",
      image: user?.image || req.user.image || null,
    });
  })
);

// PATCH /api/users/me — JWT
router.patch(
  "/me",
  requireAuth,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    const updated = await User.findOneAndUpdate(
      {
        $or: [{ _id: req.user.id }, { id: req.user.id }, { email: req.user.email }],
      },
      { $set: req.body },
      { new: true }
    ).lean();

    res.json({
      id: req.user.id,
      email: req.user.email,
      name: updated?.name ?? req.body.name ?? req.user.name ?? "",
      image: updated?.image ?? req.body.image ?? req.user.image ?? null,
    });
  })
);

module.exports = router;
