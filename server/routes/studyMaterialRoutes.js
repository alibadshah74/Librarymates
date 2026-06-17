import express from "express";
import { commentOnStudyMaterial, downloadStudyMaterial, getStudyMaterialById, getStudyMaterials, likeStudyMaterial, shareStudyMaterial } from "../controllers/studyMaterialController.js";
import { protect } from "../middlewares/auth.js";

const studyMaterialRouter = express.Router();

studyMaterialRouter.get('/', getStudyMaterials);
studyMaterialRouter.get('/:id', getStudyMaterialById);
studyMaterialRouter.post('/:id/download', downloadStudyMaterial);
studyMaterialRouter.post('/:id/like', protect, likeStudyMaterial);
studyMaterialRouter.post('/:id/comment', protect, commentOnStudyMaterial);
studyMaterialRouter.post('/:id/share', protect, shareStudyMaterial);

export default studyMaterialRouter;
