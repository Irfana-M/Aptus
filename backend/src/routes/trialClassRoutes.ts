import { Router, type Request, type Response } from "express";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";
import { TrialClassController } from "../controllers/trialClass.controller";
import { requireAuth } from "../middlewares/authMiddleware";

import { TrialClass } from "../models/student/trialClass.model";

const trialController = container.get<TrialClassController>(TYPES.TrialClassController);
const router = Router();


router.get(
  "/:trialClassId/call-status",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      const userId = req.user!.id; 

      const trialClass = await TrialClass.findById(trialClassId)
        .populate("mentor")
        .populate("student");

      if (!trialClass) {
        return res.status(404).json({ message: "Trial class not found" });
      }

      
      const mentor = trialClass.mentor as unknown as { _id: string } | null;
      const student = trialClass.student as unknown as { _id: string };

      
      const mentorId = mentor?._id?.toString();
      const studentId = student?._id?.toString();

      if (mentorId !== userId && studentId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json({
        status: trialClass.meetLink ? "active" : "inactive",
        meetLink: trialClass.meetLink || null,
      });
    } catch (error) {
      console.error("Call status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id/complete",
  requireAuth,
  (req, res) => trialController.completeTrialClass(req, res)
);

export default router;