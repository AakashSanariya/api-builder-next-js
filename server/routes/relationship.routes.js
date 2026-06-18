const express = require("express");
const router = express.Router();
const relationshipController = require("../controllers/relationship.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

router.post("/api/relationships", relationshipController.createRelationship);
router.get("/api/relationships", relationshipController.getAllRelationships);
router.get("/api/relationships/:formId", relationshipController.getFormRelationships);
router.put("/api/relationships/:id", relationshipController.updateRelationship);
router.delete("/api/relationships/:id", relationshipController.deleteRelationship);

// RelationLink endpoints
router.post("/api/relations/link", relationshipController.linkRecords);
router.post("/api/relations/unlink", relationshipController.unlinkRecords);
router.get("/api/relations/:relationshipId/:recordId", relationshipController.getRecordLinks);

module.exports = router;
