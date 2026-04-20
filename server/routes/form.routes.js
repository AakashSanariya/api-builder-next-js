const express = require("express");
const router = express.Router();
const formController = require("../controllers/form.controller");
const dynamicValidation = require("../middleware/validation.middleware");
const upload = require("../middleware/upload"); // Pre-existing multer config

// Management Routes
router.get("/", formController.getAllForms);
router.post("/", formController.createForm);
router.get("/:id", formController.getFormById);
router.post("/:id", formController.updateFormSchema);

// Dynamic API Core (Single Dynamic Endpoint)
router.post("/api/:slug", upload.any(), dynamicValidation, formController.handleDynamicSubmission);

module.exports = router;
