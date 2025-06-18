"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;
  const db = await getDb();
  const feedbacks = await db.collection("feedback");
  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    if (feedbackId) {
      const result = await feedbacks.findOneAndUpdate(
        { _id: new ObjectId(feedbackId) },
        { $set: feedback },
        { returnDocument: "after" }
      );
      if (!result?.value) throw new Error("Feedback not found to update");
      return { success: true, feedbackId };
    } else {
      const insertResult = await feedbacks.insertOne(feedback);
      return {
        success: true,
        feedbackId: insertResult.insertedId.toHexString(),
      };
    }
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const db = await getDb();
  const interview = await db
    .collection("interviews")
    .findOne({ _id: new ObjectId(id) });
  return interview as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;
  const db = await getDb();
  const feedbacks = db.collection<Feedback & { _id: ObjectId }>("feedback");

  const doc = await feedbacks.findOne({
    interviewId,
    userId,
  });

  if (!doc) return null;

  return {
    id: doc._id.toHexString(),
    interviewId: doc.interviewId,
    totalScore: doc.totalScore,
    categoryScores: doc.categoryScores,
    strengths: doc.strengths,
    areasForImprovement: doc.areasForImprovement,
    finalAssessment: doc.finalAssessment,
    createdAt: doc.createdAt,
  } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;
  const db = await getDb();

  const interviews = await db
    .collection("interviews")
    .find({ finalized: true, userId: { $ne: userId } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return interviews.map(doc => {
  const { _id, ...rest } = doc;
  return {
    id: _id.toHexString(),
    ...rest
  } as Interview;
}) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const db = await getDb();
  const interviewsCollection = db.collection("interviews");

  const interviews = await interviewsCollection
    .find({ userId }) // assuming userId is stored as a string in the collection
    .sort({ createdAt: -1 }) // latest interviews first
    .toArray();

  // Convert MongoDB _id to id as string
  return interviews.map((doc) => ({
    id: doc._id.toHexString(),
    role: doc.role,
    level: doc.level,
    questions: doc.questions,
    techstack: doc.techstack,
    createdAt: doc.createdAt,
    userId: doc.userId,
    type: doc.type,
    finalized: doc.finalized,
  })) as Interview[];
}
