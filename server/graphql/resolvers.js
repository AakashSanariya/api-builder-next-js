const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const User = require("../models/user.model");
const Form = require("../models/form.model");
const validateData = require("../utils/validator");
const { JSONScalar } = require("./scalars");

// Upload scalar is injected dynamically by server.js at startup

const JWT_SECRET = process.env.JWT_SECRET || "api-builder-secret-key-change-in-production";

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
  sections.forEach((section) => {
    const sectionData = {};
    section.fields.forEach((field) => {
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

const validatePassword = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
};

const requireAuth = (context) => {
  if (!context.userId) {
    throw new Error("Access denied. No token provided.");
  }
};

const resolvers = {
  JSON: JSONScalar,

  Query: {
    me: async (_, __, context) => {
      requireAuth(context);
      const user = await User.findById(context.userId);
      if (!user) throw new Error("User not found");
      return { firstName: user.firstName, lastName: user.lastName, email: user.email };
    },

    forms: async (_, __, context) => {
      requireAuth(context);
      return Form.find({ userId: context.userId }).sort({ createdAt: -1 }).lean();
    },

    form: async (_, { id }, context) => {
      requireAuth(context);
      let form;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        form = await Form.findOne({ _id: id, userId: context.userId }).lean();
      }
      if (!form) {
        form = await Form.findOne({ slug: id, userId: context.userId }).lean();
      }
      if (!form) throw new Error("Form not found");
      return form;
    },

    submissions: async (_, { slug, page = 1, limit = 20 }, context) => {
      requireAuth(context);
      const form = await Form.findOne({ slug });
      if (!form) throw new Error("Form not found");

      const DynamicData = getDynamicDataModel(slug);
      const filter = { formSlug: slug, userId: new mongoose.Types.ObjectId(context.userId) };
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        DynamicData.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        DynamicData.countDocuments(filter),
      ]);

      return {
        records,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      };
    },

    submission: async (_, { slug, recordId }, context) => {
      requireAuth(context);
      const form = await Form.findOne({ slug });
      if (!form) throw new Error("Form not found");

      const DynamicData = getDynamicDataModel(slug);
      const record = await DynamicData.findOne({
        _id: recordId,
        userId: new mongoose.Types.ObjectId(context.userId),
      }).lean();

      if (!record) throw new Error("Submitted data not found");
      return record;
    },
  },

  Mutation: {
    signup: async (_, { firstName, lastName, email, password }) => {
      if (!firstName || !lastName || !email || !password) {
        throw new Error("All fields are required");
      }

      const passwordError = validatePassword(password);
      if (passwordError) throw new Error(passwordError);

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        throw new Error("An account with this email already exists");
      }

      const user = await User.create({ firstName, lastName, email, password });

      return {
        success: true,
        message: "Account created successfully",
        data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
      };
    },

    login: async (_, { email, password }) => {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return {
        success: true,
        message: "Login successful",
        token,
        data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
      };
    },

    createForm: async (_, { name }, context) => {
      requireAuth(context);
      const slug = name.toLowerCase().replace(/\s+/g, "-");

      const existing = await Form.findOne({ slug });
      if (existing) throw new Error("Form name already taken");

      const newForm = new Form({
        name,
        slug,
        fields: [],
        published: false,
        userId: context.userId,
      });

      await newForm.save();
      return newForm.toObject();
    },

    updateFormSchema: async (_, { id, sections, published }, context) => {
      requireAuth(context);
      const updateData = { published: published ?? false };
      if (sections) updateData.sections = sections;

      const form = await Form.findOneAndUpdate(
        { _id: id, userId: context.userId },
        updateData,
        { new: true }
      );

      if (!form) throw new Error("Form not found");
      return form.toObject();
    },

    deleteForm: async (_, { id }, context) => {
      requireAuth(context);
      const form = await Form.findOne({ _id: id, userId: context.userId });

      if (!form) throw new Error("Form not found");

      const safeSlug = form.slug.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const collectionName = `${safeSlug}_data`;
      const modelName = `${safeSlug}_data`;

      const db = mongoose.connection.db;
      if (db) {
        try {
          const collections = await db.listCollections({ name: collectionName }).toArray();
          if (collections.length > 0) {
            await db.dropCollection(collectionName);
          }
        } catch (dropErr) {
          console.warn(`Could not drop collection ${collectionName}:`, dropErr.message);
        }
      }

      if (mongoose.models[modelName]) {
        mongoose.deleteModel(modelName);
      }

      await Form.findOneAndDelete({ _id: id, userId: context.userId });

      return {
        success: true,
        message: `System Entity '${form.name}' neutralized. All modular blocks and associated traffic collections have been purged.`,
      };
    },

    createSubmission: async (_, { slug, data, files }, context) => {
      requireAuth(context);
      const form = await Form.findOne({ slug });

      if (!form) throw new Error("Form not found");
      if (!form.published) throw new Error("This API endpoint is not published yet");

      const allFields =
        form.sections && form.sections.length > 0
          ? form.sections.flatMap((s) => s.fields || [])
          : form.fields || [];

      const inputData = data || {};

      // Normalize data
      allFields.forEach((field) => {
        const { name, multiple, type } = field;
        let value = inputData[name];

        if ((multiple || type === "checkbox") && value !== undefined) {
          if (!Array.isArray(value)) {
            inputData[name] = [value];
            value = inputData[name];
          }
        }
      });

      // Handle file uploads
      if (files && files.length > 0) {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const upload of files) {
          const { createReadStream, filename, fieldName } = await upload;
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.extname(filename);
          const savedName = uniqueSuffix + ext;
          const filePath = path.join(uploadDir, savedName);

          await new Promise((resolve, reject) => {
            createReadStream()
              .pipe(fs.createWriteStream(filePath))
              .on("finish", resolve)
              .on("error", reject);
          });

          const url = `http://localhost:5000/uploads/${savedName}`;
          if (inputData[fieldName]) {
            if (!Array.isArray(inputData[fieldName])) {
              inputData[fieldName] = [inputData[fieldName]];
            }
            inputData[fieldName].push(url);
          } else {
            inputData[fieldName] = url;
          }
        }
      }

      // Validate data
      const { isValid, errors } = validateData(allFields, inputData);
      if (!isValid) {
        throw new Error(`Validation Failed: ${JSON.stringify(errors)}`);
      }

      const DynamicData = getDynamicDataModel(slug);
      const structuredData = groupDataBySection(form.sections, inputData);

      const savedRecord = await DynamicData.create({
        formSlug: form.slug,
        formId: form._id,
        data: structuredData,
        ip: context.req?.ip,
        userAgent: context.req?.headers?.["user-agent"],
        userId: context.userId,
      });

      return {
        success: true,
        message: `Successfully processed submission for '${form.name}'`,
        data: savedRecord.toObject(),
        timestamp: new Date().toISOString(),
      };
    },

    updateSubmission: async (_, { slug, recordId, data, files }, context) => {
      requireAuth(context);
      const form = await Form.findOne({ slug });

      if (!form) throw new Error("Form not found");

      const allFields =
        form.sections && form.sections.length > 0
          ? form.sections.flatMap((s) => s.fields || [])
          : form.fields || [];

      const inputData = data || {};

      // Normalize data
      allFields.forEach((field) => {
        const { name, multiple, type } = field;
        let value = inputData[name];

        if ((multiple || type === "checkbox") && value !== undefined) {
          if (!Array.isArray(value)) {
            inputData[name] = [value];
            value = inputData[name];
          }
        }
      });

      // Handle file uploads
      if (files && files.length > 0) {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const upload of files) {
          const { createReadStream, filename, fieldName } = await upload;
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.extname(filename);
          const savedName = uniqueSuffix + ext;
          const filePath = path.join(uploadDir, savedName);

          await new Promise((resolve, reject) => {
            createReadStream()
              .pipe(fs.createWriteStream(filePath))
              .on("finish", resolve)
              .on("error", reject);
          });

          const url = `http://localhost:5000/uploads/${savedName}`;
          if (inputData[fieldName]) {
            if (!Array.isArray(inputData[fieldName])) {
              inputData[fieldName] = [inputData[fieldName]];
            }
            inputData[fieldName].push(url);
          } else {
            inputData[fieldName] = url;
          }
        }
      }

      // Validate data
      const { isValid, errors } = validateData(allFields, inputData);
      if (!isValid) {
        throw new Error(`Validation Failed: ${JSON.stringify(errors)}`);
      }

      const DynamicData = getDynamicDataModel(slug);
      const structuredData = groupDataBySection(form.sections, inputData);

      const updatedRecord = await DynamicData.findOneAndUpdate(
        {
          _id: recordId,
          formSlug: form.slug,
          formId: form._id,
          userId: context.userId,
        },
        {
          data: structuredData,
          ip: context.req?.ip,
          userAgent: context.req?.headers?.["user-agent"],
        },
        { new: true }
      );

      if (!updatedRecord) throw new Error("Submitted data not found");

      return {
        success: true,
        message: `Successfully updated submission for '${form.name}'`,
        data: updatedRecord.toObject(),
        timestamp: new Date().toISOString(),
      };
    },

    deleteSubmission: async (_, { slug, recordId }, context) => {
      requireAuth(context);
      const form = await Form.findOne({ slug });

      if (!form) throw new Error("Form not found");

      const DynamicData = getDynamicDataModel(slug);
      const deletedRecord = await DynamicData.findOneAndDelete({
        _id: recordId,
        formSlug: slug,
        userId: context.userId,
      });

      if (!deletedRecord) throw new Error("Submitted data not found");

      return {
        success: true,
        message: `Successfully deleted submission for '${form.name}'`,
      };
    },
  },
};

module.exports = resolvers;
