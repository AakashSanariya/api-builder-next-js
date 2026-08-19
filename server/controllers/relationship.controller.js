const mongoose = require("mongoose");
const Relationship = require("../models/relationship.model");
const RelationLink = require("../models/relationLink.model");
const Form = require("../models/form.model");

const getDynamicDataModel = (slug) => {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const modelName = `${safeSlug}_data_model`;
  const collectionName = `${safeSlug}_data`;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  const DynamicDataSchema = new mongoose.Schema(
    {
      formSlug: { type: String, required: true, index: true },
      formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      ip: { type: String },
      userAgent: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true, strict: false, collection: collectionName }
  );

  return mongoose.model(modelName, DynamicDataSchema);
};

// POST /api/relationships
exports.createRelationship = async (req, res) => {
  try {
    const { sourceFormId, targetFormId, type, sourceLabel, targetLabel, eagerLoad } = req.body;

    if (!sourceFormId || !targetFormId || !type) {
      return res.status(400).json({ success: false, message: "sourceFormId, targetFormId, and type are required" });
    }

    const validTypes = ["one-to-one", "one-to-many", "many-to-many"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid relationship type" });
    }

    const [sourceForm, targetForm] = await Promise.all([
      Form.findOne({ _id: sourceFormId, userId: req.user.userId }),
      Form.findOne({ _id: targetFormId, userId: req.user.userId }),
    ]);

    if (!sourceForm) return res.status(404).json({ success: false, message: "Source form not found" });
    if (!targetForm) return res.status(404).json({ success: false, message: "Target form not found" });

    const existing = await Relationship.findOne({
      sourceFormId,
      targetFormId,
      userId: req.user.userId,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "A relationship between these forms already exists" });
    }

    const relationship = await Relationship.create({
      sourceFormId,
      targetFormId,
      type,
      sourceLabel: sourceLabel || sourceForm.name,
      targetLabel: targetLabel || targetForm.name,
      eagerLoad: eagerLoad ?? false,
      userId: req.user.userId,
    });

    res.status(201).json({ success: true, data: relationship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/relationships
exports.getAllRelationships = async (req, res) => {
  try {
    const relationships = await Relationship.find({ userId: req.user.userId })
      .populate("sourceFormId", "name slug")
      .populate("targetFormId", "name slug")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: relationships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/relationships/:formId
exports.getFormRelationships = async (req, res) => {
  try {
    let { formId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      const form = await Form.findOne({ slug: formId, userId: req.user.userId });
      if (!form) return res.status(404).json({ success: false, message: "Form not found" });
      formId = form._id;
    }

    const relationships = await Relationship.find({
      userId: req.user.userId,
      $or: [{ sourceFormId: formId }, { targetFormId: formId }],
    })
      .populate("sourceFormId", "name slug")
      .populate("targetFormId", "name slug")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: relationships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/relationships/:id
exports.updateRelationship = async (req, res) => {
  try {
    const { type, eagerLoad, sourceLabel, targetLabel } = req.body;
    const updateData = {};
    if (type) {
      const validTypes = ["one-to-one", "one-to-many", "many-to-many"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid relationship type" });
      }
      updateData.type = type;
    }
    if (eagerLoad !== undefined) updateData.eagerLoad = eagerLoad;
    if (sourceLabel !== undefined) updateData.sourceLabel = sourceLabel;
    if (targetLabel !== undefined) updateData.targetLabel = targetLabel;

    const relationship = await Relationship.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true }
    );

    if (!relationship) {
      return res.status(404).json({ success: false, message: "Relationship not found" });
    }

    res.json({ success: true, data: relationship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/relations/link
exports.linkRecords = async (req, res) => {
  try {
    const { sourceFormId, sourceRecordId, targetFormId, targetRecordId, relationshipId } = req.body;

    if (!sourceFormId || !sourceRecordId || !targetFormId || !targetRecordId || !relationshipId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const relationship = await Relationship.findOne({ _id: relationshipId, userId: req.user.userId });
    if (!relationship) return res.status(404).json({ success: false, message: "Relationship not found" });

    const isSource = String(relationship.sourceFormId) === String(sourceFormId);
    if (!isSource && String(relationship.targetFormId) !== String(sourceFormId)) {
      return res.status(400).json({ success: false, message: "Form IDs do not match the relationship" });
    }

    const sourceFormIdObj = new mongoose.Types.ObjectId(String(sourceFormId));
    const targetFormIdObj = new mongoose.Types.ObjectId(String(targetFormId));
    const [sourceForm, targetForm] = await Promise.all([
      Form.findOne({ _id: sourceFormIdObj }),
      Form.findOne({ _id: targetFormIdObj }),
    ]);
    if (!sourceForm) return res.status(404).json({ success: false, message: "Source form not found" });
    if (!targetForm) return res.status(404).json({ success: false, message: "Target form not found" });

    const SourceModel = getDynamicDataModel(sourceForm.slug);
    const TargetModel = getDynamicDataModel(targetForm.slug);
    const [sourceRecord, targetRecord] = await Promise.all([
      SourceModel.findById(sourceRecordId),
      TargetModel.findById(targetRecordId),
    ]);
    if (!sourceRecord) {
      return res.status(400).json({ success: false, message: "Source record does not belong to the source form" });
    }
    if (!targetRecord) {
      return res.status(400).json({ success: false, message: "Target record does not belong to the target form" });
    }

    const existing = await RelationLink.findOne({
      sourceFormId,
      sourceRecordId,
      targetFormId,
      targetRecordId,
      relationshipId,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "These records are already linked" });
    }

    if (relationship.type === "one-to-one") {
      const existingOne = await RelationLink.findOne({
        $or: [
          { sourceFormId, sourceRecordId, relationshipId },
          { targetFormId, targetRecordId, relationshipId },
        ],
      });
      if (existingOne) {
        return res.status(400).json({ success: false, message: "One-to-one relationship limit reached — unlink the existing pair first" });
      }
    }

    const link = await RelationLink.create({
      sourceFormId,
      sourceRecordId,
      targetFormId,
      targetRecordId,
      relationshipId,
      userId: req.user.userId,
    });

    res.status(201).json({ success: true, data: link });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/relations/unlink
exports.unlinkRecords = async (req, res) => {
  try {
    const { relationshipId, sourceRecordId, targetRecordId } = req.body;

    if (!relationshipId || !sourceRecordId || !targetRecordId) {
      return res.status(400).json({ success: false, message: "relationshipId, sourceRecordId, and targetRecordId are required" });
    }

    const link = await RelationLink.findOneAndDelete({
      relationshipId,
      sourceRecordId,
      targetRecordId,
    });

    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    res.json({ success: true, message: "Records unlinked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/relations/:relationshipId/:recordId
exports.getRecordLinks = async (req, res) => {
  try {
    const { relationshipId, recordId } = req.params;

    const relationship = await Relationship.findOne({ _id: relationshipId, userId: req.user.userId })
      .populate("sourceFormId", "name slug")
      .populate("targetFormId", "name slug");
    if (!relationship) return res.status(404).json({ success: false, message: "Relationship not found" });

    const links = await RelationLink.find({
      relationshipId,
      $or: [
        { sourceRecordId: recordId },
        { targetRecordId: recordId },
      ],
    });

    const linkedRecords = [];
    for (const link of links) {
      const isSource = String(link.sourceRecordId) === String(recordId);
      const linkedFormId = isSource ? link.targetFormId : link.sourceFormId;
      const linkedRecordId = isSource ? link.targetRecordId : link.sourceRecordId;
      const targetSlug = isSource
        ? (relationship.targetFormId && typeof relationship.targetFormId === 'object' ? relationship.targetFormId.slug : null)
        : (relationship.sourceFormId && typeof relationship.sourceFormId === 'object' ? relationship.sourceFormId.slug : null);

      if (targetSlug) {
        try {
          const DynamicModel = getDynamicDataModel(targetSlug);
          const doc = await DynamicModel.findById(linkedRecordId).lean();
          if (doc) {
            linkedRecords.push({
              linkId: link._id,
              recordId: linkedRecordId,
              formId: linkedFormId,
              data: doc.data || doc,
              direction: isSource ? "target" : "source",
              createdAt: doc.createdAt,
            });
          }
        } catch (e) {
          // skip if model not found
        }
      }
    }

    res.json({
      success: true,
      data: linkedRecords,
      relationship,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/relationships/:id
exports.deleteRelationship = async (req, res) => {
  try {
    const relationship = await Relationship.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!relationship) {
      return res.status(404).json({ success: false, message: "Relationship not found" });
    }

    await RelationLink.deleteMany({ relationshipId: relationship._id });

    res.json({
      success: true,
      message: "Relationship and all associated links have been removed",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
