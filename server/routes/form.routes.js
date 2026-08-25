const express = require("express");
const router = express.Router();
const formController = require("../controllers/form.controller");
const dynamicValidation = require("../middleware/validation.middleware");
const upload = require("../middleware/upload");
const authenticate = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Dynamic API Core
router.post("/api/:slug", upload.any(), dynamicValidation, formController.handleDynamicSubmission);
router.get("/api/:slug/data", formController.listDynamicSubmissions);
router.post("/api/:slug/data/bulk-delete", formController.bulkDeleteSubmissions);
router.get("/api/:slug/data/export", formController.exportSubmissions);
router.get("/api/:slug/data/:recordId", formController.getDynamicSubmission);
router.put("/api/:slug/data/:recordId", upload.any(), dynamicValidation, formController.updateDynamicSubmission);
router.delete("/api/:slug/data/:recordId", formController.deleteDynamicSubmission);

// Management Routes
router.get("/", formController.getAllForms);
router.post("/", formController.createForm);
router.get("/:id", formController.getFormById);
router.post("/:id", formController.updateFormSchema);
router.delete("/:id", formController.deleteForm);

module.exports = router;
