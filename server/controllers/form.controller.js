const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Form = require("../models/form.model");
const Relationship = require("../models/relationship.model");
const RelationLink = require("../models/relationLink.model");
const getDynamicDataModel = require("../utils/dynamicData.model");

const uploadsDir = path.join(__dirname, "../uploads");

const removeOrphanUploads = (oldData, fieldnames, newData) => {
  if (!fieldnames || fieldnames.size === 0) return;
  const oldFiles = new Set();
  const collectFromFields = (obj) => {
    if (Array.isArray(obj)) {
      obj.forEach(collectFromFields);
      return;
    }
    if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (fieldnames.has(key)) {
          const walk = (v) => {
            if (typeof v === "string") {
              const match = v.match(/\/uploads\/([^/?#]+)$/);
              if (match) oldFiles.add(match[1]);
            } else if (Array.isArray(v)) {
              v.forEach(walk);
            } else if (v && typeof v === "object") {
              Object.values(v).forEach(walk);
            }
          };
          walk(value);
        } else {
          collectFromFields(value);
        }
      }
    }
  };
  collectFromFields(oldData);

  const newFiles = new Set();
  const collectAll = (obj) => {
    if (typeof obj === "string") {
      const match = obj.match(/\/uploads\/([^/?#]+)$/);
      if (match) newFiles.add(match[1]);
    } else if (Array.isArray(obj)) {
      obj.forEach(collectAll);
    } else if (obj && typeof obj === "object") {
      Object.values(obj).forEach(collectAll);
    }
  };
  collectAll(newData);

  oldFiles.forEach((filename) => {
    if (newFiles.has(filename)) return;
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) { /* ignore */ }
    }
  });
};

const slugifyRel = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");
};

const resolveRelations = async (records, form, userId) => {
  if (!records || records.length === 0) return records;
  if (!form) return records;

  const relationships = await Relationship.find({
    userId,
    $or: [{ sourceFormId: form._id }, { targetFormId: form._id }],
    eagerLoad: true,
  });

  if (relationships.length === 0) return records;

  const recordIds = records.map((r) => r._id);

  const recordsArray = Array.isArray(records) ? records : [records];

  for (const rel of relationships) {
    const isSource = rel.sourceFormId.toString() === form._id.toString();
    const targetForm = await Form.findById(isSource ? rel.targetFormId : rel.sourceFormId);
    if (!targetForm) continue;

    const targetModel = getDynamicDataModel(targetForm.slug);
    const label = isSource ? rel.targetLabel : rel.sourceLabel;
    const targetFormId = isSource ? rel.targetFormId : rel.sourceFormId;
    const relKey = `section_${slugifyRel(label)}_rel`;

    if (isSource) {
      const links = await RelationLink.find({
        sourceFormId: form._id,
        sourceRecordId: { $in: recordIds },
        relationshipId: rel._id,
        userId,
      });

      for (const record of recordsArray) {
        const recordLinks = links.filter(
          (l) => l.sourceRecordId.toString() === record._id.toString()
        );
        if (recordLinks.length === 0) continue;

        const targetIds = recordLinks.map((l) => l.targetRecordId);
        const relatedDocs = await targetModel
          .find({ _id: { $in: targetIds }, userId })
          .lean();

        if (rel.type === "one-to-one") {
          record.data[relKey] = relatedDocs[0] || null;
        } else {
          record.data[relKey] = relatedDocs;
        }
      }
    } else {
      const links = await RelationLink.find({
        targetFormId: form._id,
        targetRecordId: { $in: recordIds },
        relationshipId: rel._id,
        userId,
      });

      for (const record of recordsArray) {
        const recordLinks = links.filter(
          (l) => l.targetRecordId.toString() === record._id.toString()
        );
        if (recordLinks.length === 0) continue;

        const sourceIds = recordLinks.map((l) => l.sourceRecordId);
        const relatedDocs = await targetModel
          .find({ _id: { $in: sourceIds }, userId })
          .lean();

        if (rel.type === "one-to-one") {
          record.data[relKey] = relatedDocs[0] || null;
        } else {
          record.data[relKey] = relatedDocs;
        }
      }
    }
  }

  return records;
};

const processInlineRelations = async (relations, parentForm, parentRecordId, userId) => {
  if (!relations || typeof relations !== "object") return;

  for (const [relKey, relData] of Object.entries(relations)) {
    const relationship = await Relationship.findOne({
      userId,
      $or: [
        { sourceFormId: parentForm._id, targetLabel: relKey },
        { targetFormId: parentForm._id, sourceLabel: relKey },
      ],
    });

    if (!relationship) continue;

    const isSource = relationship.sourceFormId.toString() === parentForm._id.toString();
    const targetFormId = isSource ? relationship.targetFormId : relationship.sourceFormId;
    const targetForm = await Form.findById(targetFormId);
    if (!targetForm) continue;

    const targetModel = getDynamicDataModel(targetForm.slug);
    const items = Array.isArray(relData) ? relData : [relData];

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      const targetRecord = await targetModel.create({
        formSlug: targetForm.slug,
        formId: targetForm._id,
        data: item,
        userId,
      });

      if (isSource) {
        await RelationLink.create({
          sourceFormId: parentForm._id,
          sourceRecordId: parentRecordId,
          targetFormId: targetForm._id,
          targetRecordId: targetRecord._id,
          relationshipId: relationship._id,
          userId,
        });
      } else {
        await RelationLink.create({
          sourceFormId: targetForm._id,
          sourceRecordId: targetRecord._id,
          targetFormId: parentForm._id,
          targetRecordId: parentRecordId,
          relationshipId: relationship._id,
          userId,
        });
      }
    }
  }
};

// GET /forms
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: forms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /forms/:id (or slug)
exports.getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    let form;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      form = await Form.findOne({ _id: id, userId: req.user.userId });
    }

    if (!form) {
      form = await Form.findOne({ slug: id, userId: req.user.userId });
    }

    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /forms
exports.createForm = async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const existing = await Form.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: "Form name already taken" });

    const newForm = new Form({
      name,
      slug,
      fields: [],
      published: false,
      userId: req.user.userId,
    });

    await newForm.save();
    res.status(201).json({ success: true, data: newForm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /forms/:id (Update Schema)
exports.updateFormSchema = async (req, res) => {
  try {
    const { fields, sections, published } = req.body;
    const updateData = { published: published ?? false };

    if (sections) updateData.sections = sections;
    if (fields) updateData.fields = fields;

    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true }
    );

    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");
};

const groupDataBySection = (sections, validatedData) => {
  if (!sections || sections.length === 0) return validatedData;

  const grouped = {};
  sections.forEach(section => {
    const sectionData = {};
    section.fields.forEach(field => {
      if (validatedData[field.name] !== undefined) {
        sectionData[field.name] = validatedData[field.name];
      }
    });

    const sectionSlug = section.title ? slugify(section.title) : section.id;
    const dbKey = `section_${sectionSlug}`;

    grouped[dbKey] = sectionData;
  });
  return grouped;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TEXT_FILTER_TYPES = new Set(["input", "textarea"]);
const SORTABLE_META_FIELDS = new Set(["createdAt", "updatedAt"]);

// Map every schema field name -> its real path inside data ({ section_x: { field } })
// Falls back to flat data.<name> for legacy forms stored without sections.
const getFieldPathMap = (form) => {
  const map = {};
  const sections = Array.isArray(form.sections) ? form.sections : [];

  if (sections.length > 0) {
    sections.forEach((section) => {
      const sectionSlug = section.title ? slugify(section.title) : section.id;
      const dbKey = `section_${sectionSlug}`;
      (section.fields || []).forEach((field) => {
        map[field.name] = {
          path: `data.${dbKey}.${field.name}`,
          type: field.type,
          multiple: !!field.multiple,
        };
      });
    });
  } else {
    (Array.isArray(form.fields) ? form.fields : []).forEach((field) => {
      map[field.name] = {
        path: `data.${field.name}`,
        type: field.type,
        multiple: !!field.multiple,
      };
    });
  }
  return map;
};

// Builds the Mongo query for listing/exporting records from whitelisted,
// schema-resolved query params. Shared by list + CSV export endpoints.
const buildListFilter = (form, req) => {
  const filter = { formSlug: form.slug, userId: req.user.userId };
  const fieldMap = getFieldPathMap(form);
  const q = req.query;

  // Global search: case-insensitive "contains" across every field path (+ _id)
  if (typeof q.search === "string" && q.search.trim() !== "") {
    const rx = new RegExp(escapeRegex(q.search.trim()), "i");
    const or = Object.values(fieldMap).map((meta) => ({ [meta.path]: rx }));
    if (/^[0-9a-fA-F]{24}$/.test(q.search.trim())) {
      or.push({ _id: new mongoose.Types.ObjectId(q.search.trim()) });
    }
    filter.$or = or;
  }

  const conditions = [];

  // Per-field exact/contains filters: f_<fieldName>=value
  Object.entries(fieldMap).forEach(([name, meta]) => {
    const raw = q[`f_${name}`];
    if (typeof raw !== "string" || raw.trim() === "") return;
    const value = raw.trim();
    if (TEXT_FILTER_TYPES.has(meta.type)) {
      conditions.push({ [meta.path]: new RegExp(escapeRegex(value), "i") });
    } else {
      // Exact match also hits array fields (matches if ANY element equals value)
      conditions.push({ [meta.path]: value });
    }
  });

  // Numeric range filters: numMin_<fieldName> / numMax_<fieldName>
  Object.entries(fieldMap).forEach(([name, meta]) => {
    const minRaw = q[`numMin_${name}`];
    const maxRaw = q[`numMax_${name}`];
    if (minRaw === undefined && maxRaw === undefined) return;
    const min = parseFloat(minRaw);
    const max = parseFloat(maxRaw);
    const range = {};
    if (!Number.isNaN(min)) range.$gte = min;
    if (!Number.isNaN(max)) range.$lte = max;
    if (Object.keys(range).length > 0) conditions.push({ [meta.path]: range });
  });

  // Created-date range: createdFrom / createdTo (date-only strings become inclusive days)
  const createdRange = {};
  if (q.createdFrom) {
    const from = new Date(q.createdFrom);
    if (!Number.isNaN(from.getTime())) createdRange.$gte = from;
  }
  if (q.createdTo) {
    const to = new Date(q.createdTo);
    if (!Number.isNaN(to.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.createdTo.trim())) {
        to.setHours(23, 59, 59, 999);
      }
      createdRange.$lte = to;
    }
  }
  if (Object.keys(createdRange).length > 0) conditions.push({ createdAt: createdRange });

  if (conditions.length > 0) filter.$and = conditions;
  return filter;
};

const buildListSort = (form, req) => {
  const sortField = typeof req.query.sortField === "string" ? req.query.sortField : "createdAt";
  const order = req.query.sortOrder === "asc" ? 1 : -1;

  let path = "createdAt";
  if (SORTABLE_META_FIELDS.has(sortField)) {
    path = sortField;
  } else {
    const meta = getFieldPathMap(form)[sortField];
    if (meta) path = meta.path;
  }
  return { [path]: order };
};

// POST /api/forms/:slug (Dynamic API Core)
exports.handleDynamicSubmission = async (req, res) => {
  try {
    const { dynamicForm, validatedData } = req;
    const DynamicData = getDynamicDataModel(dynamicForm.slug);

    const relations = validatedData._relations;
    delete validatedData._relations;

    const structuredData = groupDataBySection(dynamicForm.sections, validatedData);

    const savedRecord = await DynamicData.create({
      formSlug: dynamicForm.slug,
      formId: dynamicForm._id,
      data: structuredData,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: req.user.userId,
    });

    await processInlineRelations(relations, dynamicForm, savedRecord._id, req.user.userId);

    res.json({
      success: true,
      message: `Successfully processed submission for '${dynamicForm.name}'`,
      data: savedRecord,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/:slug/data (List submitted records scoped to user)
// Supports: page, limit, search, sortField, sortOrder,
//           f_<field>, numMin_<field>, numMax_<field>, createdFrom, createdTo
exports.listDynamicSubmissions = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const filter = buildListFilter(form, req);
    const sort = buildListSort(form, req);

    const [rows, total] = await Promise.all([
      DynamicData.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      DynamicData.countDocuments(filter),
    ]);

    const data = await resolveRelations(rows, form, req.user.userId);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/:slug/data/:recordId (Fetch one submitted record scoped to user)
exports.getDynamicSubmission = async (req, res) => {
  try {
    const { slug, recordId } = req.params;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const record = await DynamicData.findOne({ _id: recordId, userId: req.user.userId }).lean();

    if (!record) {
      return res.status(404).json({ success: false, message: "Submitted data not found" });
    }

    const resolved = await resolveRelations([record], form, req.user.userId);
    const data = resolved[0];

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/:slug/data/:recordId (Update prefilled submitted record)
exports.updateDynamicSubmission = async (req, res) => {
  try {
    const { slug, recordId } = req.params;
    const { dynamicForm, validatedData } = req;
    const DynamicData = getDynamicDataModel(slug);

    const relations = validatedData._relations;
    delete validatedData._relations;

    const structuredData = groupDataBySection(dynamicForm.sections, validatedData);

    const existingRecord = await DynamicData.findOne({
      _id: recordId,
      formSlug: dynamicForm.slug,
      formId: dynamicForm._id,
      userId: req.user.userId,
    });

    if (!existingRecord) {
      return res.status(404).json({ success: false, message: "Submitted data not found" });
    }

    removeOrphanUploads(existingRecord.data, new Set((req.files || []).map((f) => f.fieldname)), structuredData);

    const updatedRecord = await DynamicData.findOneAndUpdate(
      { _id: recordId, formSlug: dynamicForm.slug, formId: dynamicForm._id, userId: req.user.userId },
      {
        data: structuredData,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { new: true }
    );

    if (relations) {
      await RelationLink.deleteMany({
        $or: [
          { sourceRecordId: recordId, userId: req.user.userId },
          { targetRecordId: recordId, userId: req.user.userId },
        ],
      });
      await processInlineRelations(relations, dynamicForm, updatedRecord._id, req.user.userId);
    }

    res.json({
      success: true,
      message: `Successfully updated submission for '${dynamicForm.name}'`,
      data: updatedRecord,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/:slug/data/:recordId (Delete a submitted record)
exports.deleteDynamicSubmission = async (req, res) => {
  try {
    const { slug, recordId } = req.params;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const deletedRecord = await DynamicData.findOneAndDelete({
      _id: recordId,
      formSlug: slug,
      userId: req.user.userId,
    });

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: "Submitted data not found" });
    }

    await RelationLink.deleteMany({
      $or: [
        { sourceRecordId: recordId, userId: req.user.userId },
        { targetRecordId: recordId, userId: req.user.userId },
      ],
    });

    res.json({
      success: true,
      message: `Successfully deleted submission for '${form.name}'`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/:slug/data/bulk-delete { ids: string[] } (Delete many records, scoped to user)
exports.bulkDeleteSubmissions = async (req, res) => {
  try {
    const { slug } = req.params;
    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Provide a non-empty 'ids' array" });
    }
    if (ids.length > 500) {
      return res.status(400).json({ success: false, message: "Maximum 500 records can be deleted per request" });
    }

    const objectIds = [];
    for (const id of ids) {
      if (typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ success: false, message: `Invalid record id: ${id}` });
      }
      objectIds.push(new mongoose.Types.ObjectId(id));
    }

    const form = await Form.findOne({ slug });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const result = await DynamicData.deleteMany({
      _id: { $in: objectIds },
      formSlug: slug,
      userId: req.user.userId,
    });

    // Cascade relation links, mirroring single-record delete
    await RelationLink.deleteMany({
      $or: [
        { sourceRecordId: { $in: objectIds }, userId: req.user.userId },
        { targetRecordId: { $in: objectIds }, userId: req.user.userId },
      ],
    });

    res.json({
      success: true,
      message: `${result.deletedCount} record(s) deleted`,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET /api/:slug/data/export?format=csv&ids=a,b&<same filter params as list>
// Exports records as CSV. `ids` narrows to specific records; otherwise the
// current search/filter/sort params are honored. Relation keys are excluded.
exports.exportSubmissions = async (req, res) => {
  try {
    const { slug } = req.params;
    const MAX_EXPORT_ROWS = 10000;

    const form = await Form.findOne({ slug });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const filter = buildListFilter(form, req);

    // Optional explicit record selection (comma-separated ids query param)
    if (typeof req.query.ids === "string" && req.query.ids.trim() !== "") {
      const rawIds = req.query.ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_EXPORT_ROWS);
      const objectIds = [];
      for (const id of rawIds) {
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
          return res.status(400).json({ success: false, message: `Invalid record id: ${id}` });
        }
        objectIds.push(new mongoose.Types.ObjectId(id));
      }
      if (objectIds.length > 0) {
        filter._id = { $in: objectIds };
      }
    }

    const sort = buildListSort(form, req);
    const rows = await DynamicData.find(filter).sort(sort).limit(MAX_EXPORT_ROWS).lean();

    // Column layout mirrors getFieldPathMap but keeps labels for headers
    const sections = Array.isArray(form.sections) ? form.sections : [];
    const exportColumns = [];
    if (sections.length > 0) {
      sections.forEach((section) => {
        (section.fields || []).forEach((field) => {
          if (field.type === "button") return;
          exportColumns.push({
            key: field.name,
            label: field.label || field.name,
            sectionKey: `section_${section.title ? slugify(section.title) : section.id}`,
          });
        });
      });
    } else {
      (Array.isArray(form.fields) ? form.fields : []).forEach((field) => {
        if (field.type === "button") return;
        exportColumns.push({ key: field.name, label: field.label || field.name });
      });
    }

    const csvEscape = (val) => {
      const str = String(val);
      return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const cellValue = (v) => {
      if (v === undefined || v === null) return "";
      if (Array.isArray(v)) {
        const allScalar = v.every(
          (item) => item === null || ["string", "number", "boolean"].includes(typeof item)
        );
        return allScalar ? v.join(", ") : JSON.stringify(v);
      }
      if (typeof v === "object") return JSON.stringify(v);
      if (typeof v === "boolean") return v ? "true" : "false";
      return String(v);
    };

    const headerCells = ["Record ID", ...exportColumns.map((c) => c.label), "Created At", "Updated At"];
    const lines = [headerCells.map(csvEscape).join(",")];

    rows.forEach((row) => {
      const cells = [
        String(row._id),
        ...exportColumns.map((col) => {
          let value;
          if (col.sectionKey) {
            const sectionData = row.data?.[col.sectionKey];
            if (sectionData && typeof sectionData === "object" && col.key in sectionData) {
              value = sectionData[col.key];
            }
          }
          if (value === undefined) value = row.data?.[col.key]; // legacy flat fallback
          return csvEscape(cellValue(value));
        }),
        row.createdAt ? new Date(row.createdAt).toISOString() : "",
        row.updatedAt ? new Date(row.updatedAt).toISOString() : "",
      ];
      lines.push(cells.join(","));
    });

    // UTF-8 BOM keeps Excel happy with non-ASCII characters
    const csv = "\uFEFF" + lines.join("\r\n");
    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}-submissions-${stamp}.csv"`);
    res.setHeader("X-Row-Count", String(rows.length));
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /forms/:id (Delete entire Form Schema + all its dynamic data)
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findOne({ _id: id, userId: req.user.userId });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const safeSlug = form.slug.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const collectionName = `${safeSlug}_data`;
    const modelName = `${safeSlug}_data`;
    const db = mongoose.connection.db;
    if (db) {
      try {
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          await db.dropCollection(collectionName);
          console.log(`Successfully dropped collection: ${collectionName}`);
        }
      } catch (dropErr) {
        console.warn(`Could not drop collection ${collectionName}:`, dropErr.message);
      }
    }

    if (mongoose.models[modelName]) {
      mongoose.deleteModel(modelName);
    }

    await RelationLink.deleteMany({
      $or: [
        { sourceFormId: form._id, userId: req.user.userId },
        { targetFormId: form._id, userId: req.user.userId },
      ],
    });

    await Relationship.deleteMany({
      $or: [
        { sourceFormId: form._id, userId: req.user.userId },
        { targetFormId: form._id, userId: req.user.userId },
      ],
    });

    await Form.findOneAndDelete({ _id: id, userId: req.user.userId });

    res.json({
      success: true,
      message: `System Entity '${form.name}' neutralized. All modular blocks and associated traffic collections have been purged.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
