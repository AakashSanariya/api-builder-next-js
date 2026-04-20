const Form = require("../models/form.model");
const Submission = require("../models/submission.model");
const validateData = require("../utils/validator");

/**
 * POST /api/:slug — Validate & store submission
 */
const handleSubmit = async (req, res) => {
  try {
    const { slug } = req.params;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }
    if (!form.published) {
      return res.status(403).json({ success: false, message: "This API endpoint is not published yet" });
    }

    // Build data object (body + uploaded file URLs)
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
        if (data[file.fieldname]) {
          data[file.fieldname] = Array.isArray(data[file.fieldname])
            ? [...data[file.fieldname], url]
            : [data[file.fieldname], url];
        } else {
          data[file.fieldname] = url;
        }
      });
    }

    // Validate against schema
    const { isValid, errors } = validateData(form.fields, data);
    if (!isValid) {
      return res.status(422).json({ success: false, message: "Validation Failed", errors });
    }

    // Persist the submission
    const submission = await Submission.create({
      formSlug: slug,
      formId: form._id,
      data,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: `Submission recorded for '${form.name}'`,
      data: submission,
    });
  } catch (err) {
    console.error("Dynamic Submit Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/:slug — List all submissions for a form
 */
const listSubmissions = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const form = await Form.findOne({ slug });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const [submissions, total] = await Promise.all([
      Submission.find({ formSlug: slug })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments({ formSlug: slug }),
    ]);

    res.json({
      success: true,
      form: { name: form.name, slug: form.slug },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: submissions,
    });
  } catch (err) {
    console.error("List Submissions Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/:slug/:id — Get a single submission by ID
 */
const getSubmission = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const submission = await Submission.findOne({ _id: id, formSlug: slug }).lean();

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    console.error("Get Submission Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * DELETE /api/:slug/:id — Delete a single submission
 */
const deleteSubmission = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const result = await Submission.findOneAndDelete({ _id: id, formSlug: slug });

    if (!result) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({ success: true, message: "Submission deleted" });
  } catch (err) {
    console.error("Delete Submission Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { handleSubmit, listSubmissions, getSubmission, deleteSubmission };
