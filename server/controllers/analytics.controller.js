const mongoose = require("mongoose");
const Form = require("../models/form.model");
const getDynamicDataModel = require("../utils/dynamicData.model");

const ALLOWED_RANGES = new Set([7, 30, 90]);

// GET /api/analytics/overview?range=7|30|90
// Aggregates submission stats across every dynamic collection owned by the user.
exports.getOverview = async (req, res) => {
  try {
    const rangeDays = ALLOWED_RANGES.has(parseInt(req.query.range, 10))
      ? parseInt(req.query.range, 10)
      : 30;

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (rangeDays - 1));

    const last7Start = new Date();
    last7Start.setHours(0, 0, 0, 0);
    last7Start.setDate(last7Start.getDate() - 6);

    const prev7Start = new Date(last7Start);
    prev7Start.setDate(prev7Start.getDate() - 7);
    const prev7End = new Date(last7Start);

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const forms = await Form.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();

    const timelineMap = new Map(); // 'YYYY-MM-DD' -> count
    let totalSubmissions = 0;
    let publishedForms = 0;
    let last7Days = 0;
    let previous7Days = 0;
    const perForm = [];

    for (const form of forms) {
      if (form.published) publishedForms += 1;

      const Model = getDynamicDataModel(form.slug);
      const baseFilter = { userId };

      const [total, inRange, inLast7, inPrev7, lastSubmission, daily] = await Promise.all([
        Model.countDocuments(baseFilter),
        Model.countDocuments({ ...baseFilter, createdAt: { $gte: since } }),
        Model.countDocuments({ ...baseFilter, createdAt: { $gte: last7Start } }),
        Model.countDocuments({
          ...baseFilter,
          createdAt: { $gte: prev7Start, $lt: prev7End },
        }),
        Model.findOne(baseFilter).sort({ createdAt: -1 }).select("createdAt").lean(),
        Model.aggregate([
          { $match: { ...baseFilter, createdAt: { $gte: since } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      daily.forEach((bucket) => {
        timelineMap.set(bucket._id, (timelineMap.get(bucket._id) || 0) + bucket.count);
      });

      totalSubmissions += total;
      last7Days += inLast7;
      previous7Days += inPrev7;

      perForm.push({
        formId: String(form._id),
        name: form.name,
        slug: form.slug,
        published: !!form.published,
        total,
        inRange,
        lastSubmissionAt: lastSubmission?.createdAt || null,
      });
    }

    // Fill zero days so the chart renders a continuous series
    const timeline = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      timeline.push({
        date: key,
        label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: timelineMap.get(key) || 0,
      });
    }

    perForm.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: {
        range: rangeDays,
        totals: {
          forms: forms.length,
          publishedForms,
          submissions: totalSubmissions,
          last7Days,
          previous7Days,
        },
        timeline,
        perForm,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
