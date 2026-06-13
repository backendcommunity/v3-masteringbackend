import { pdf } from "@react-pdf/renderer";
import {
  InterviewReportDocument,
  InterviewReportData,
} from "@/components/pdf/interview-report-pdf";
import { createElement } from "react";

function getGradeFromScore(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

interface SessionReport {
  id: string;
  sessionId: string;
  overallScore: number;
  result: "PASS" | "FAIL" | "BORDERLINE";
  grade?: string;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  topicBreakdown?: Array<{
    topic: string;
    score: number;
    feedback?: string;
  }>;
  questionAnalysis?: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    score: number;
    feedback: string;
  }>;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  recommendations?:
    | Array<{
        title: string;
        description: string;
        resources: string[];
      }>
    | string[];
  summary?: string;
  interview?: {
    position?: string;
    company?: string;
    difficulty?: string;
    duration?: number;
    title?: string;
    scheduledDate?: string;
  };
}

export function transformReportToData(
  report: SessionReport,
): InterviewReportData {
  const grade = report.grade || getGradeFromScore(report.overallScore || 0);
  const overallScore = report.overallScore || 0;

  const data: InterviewReportData = {
    interviewTitle:
      report.interview?.title || report.interview?.position || "Mock Interview",
    interviewDate: report.interview?.scheduledDate
      ? new Date(report.interview.scheduledDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
    position: report.interview?.position || undefined,
    company: report.interview?.company || undefined,
    difficulty: report.interview?.difficulty || undefined,
    grade,
    overallScore,
    result: report.result || "BORDERLINE",
    technicalScore: report.technicalScore || overallScore,
    communicationScore:
      report.communicationScore || Math.max(overallScore - 5, 0),
    problemSolvingScore:
      report.problemSolvingScore || Math.max(overallScore - 3, 0),
    topicBreakdown: report.topicBreakdown || undefined,
    summary: report.summary || undefined,
    strengths: Array.isArray(report.strengths) ? report.strengths : [],
    weaknesses: Array.isArray(report.weaknesses)
      ? report.weaknesses
      : Array.isArray(report.improvements)
        ? report.improvements
        : [],
    questionAnalysis: Array.isArray(report.questionAnalysis)
      ? report.questionAnalysis
      : [],
    recommendations: Array.isArray(report.recommendations)
      ? report.recommendations
      : [],
  };

  return data;
}

export async function generateInterviewPDF(
  report: SessionReport,
): Promise<Blob> {
  const data = transformReportToData(report);

  // Create the document element
  const doc: any = createElement(InterviewReportDocument, { data });

  // Generate the PDF blob
  const blob = await pdf(doc).toBlob();

  return blob;
}

export async function downloadInterviewPDF(
  report: SessionReport,
  filename?: string,
): Promise<void> {
  try {
    const blob = await generateInterviewPDF(report);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Generate filename
    const defaultFilename = `interview-report-${
      report.interview?.position?.toLowerCase().replace(/\s+/g, "-") ||
      "mock-interview"
    }-${new Date().toISOString().split("T")[0]}.pdf`;

    link.href = url;
    link.download = filename || defaultFilename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw new Error("Failed to generate PDF report. Please try again.");
  }
}

export default downloadInterviewPDF;
