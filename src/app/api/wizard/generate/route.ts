/**
 * POST /api/wizard/generate
 * 
 * Proxies the generateExamFromBlueprint server action
 * so the wizard page can call it via fetch().
 */

import { NextRequest, NextResponse } from "next/server";
import { generateExamFromBlueprint } from "@/lib/actions/generateExam";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectId, examType, difficulty } = body;

    if (!subjectId || !examType || typeof difficulty !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing required fields: subjectId, examType, difficulty" },
        { status: 400 }
      );
    }

    const result = await generateExamFromBlueprint({
      subjectId,
      examType,
      difficulty,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Wizard generate API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
