"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { useAppStore } from "@/lib/store";
import analytics from "@/lib/analytics";

import type { OnboardingRecommendation } from "@/lib/data";
import { routes } from "@/lib/routes";

interface OnboardingResultProps {
  recommendation: OnboardingRecommendation;
  learningGoal?: string | null;
  redirect?: string;
}

export function OnboardingResult({
  recommendation,
  learningGoal,
  redirect,
}: OnboardingResultProps) {
  const router = useRouter();
  const store = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(true);

  const {
    course,
    project,
    roadmap,
    stats,
    motivationalMessage,
    interviewRecommendation,
  } = recommendation;

  // Hide success message after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle course start (learning)
  const handleStartLesson = async () => {
    setIsLoading(true);
    try {
      // Track course start
      analytics.track("learning_path_started", {
        type: "course",
        courseId: course?.id,
        courseName: course?.title,
        learningGoal,
      });

      if (course) {
        // Auto-enroll in recommended course
        await store.handleCourseEnrollment(course.id);

        // Navigate directly to first chapter/video
        if (course.firstChapterSlug) {
          router.push(
            routes.courseWatch(
              course.slug,
              course.firstChapterSlug,
              course.firstVideoSlug ?? "",
            ),
          );
        } else {
          // Fallback: go to course detail
          router.push(routes.courseDetail(course.slug));
        }
      } else {
        // No course recommended — go to courses page
        router.push(routes.courses);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle project start (building)
  const handleStartProjects = async () => {
    setIsLoading(true);
    try {
      // Track project start
      analytics.track("learning_path_started", {
        type: "project",
        projectId: project?.id,
        projectName: project?.title,
        learningGoal,
      });

      if (project) {
        // Navigate to project detail
        router.push(routes.projectDetail(project.slug));
      } else {
        // No project recommended — go to projects page
        router.push(routes.projects);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle interview start (navigate with ID as query parameter)
  const handleStartInterviews = async () => {
    setIsLoading(true);
    try {
      // Track interview start
      analytics.track("learning_path_started", {
        type: "interview",
        hasInterviewPath: interviewRecommendation?.hasInterviewPath,
        learningGoal,
      });

      if (
        interviewRecommendation?.hasInterviewPath &&
        interviewRecommendation.phases.length > 0
      ) {
        const [phase] = interviewRecommendation.phases;
        const [step] = phase.steps;

        if (step?.resource?.id) {
          // Navigate to mock interviews page with ID query parameter
          // The dialog will open automatically on that page
          router.push(`${routes.mockInterviews}?id=${step.resource.id}`);
        } else {
          // Fallback: go to mock interviews page
          router.push(routes.mockInterviews);
        }
      } else {
        // No interview recommended — go to mock interviews page
        router.push(routes.mockInterviews);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle dashboard navigation (skip)
  const handleGoToDashboard = () => {
    analytics.track("onboarding_skipped", { learningGoal });
    router.push(redirect || routes.dashboard);
  };

  // Dynamic button text and action based on learning goal
  const getButtonConfig = () => {
    switch (learningGoal?.toLowerCase()) {
      case "projects":
        return {
          text: "Start Building",
          action: handleStartProjects,
        };
      case "interviews":
        return {
          text: "Start Interviewing",
          action: handleStartInterviews,
        };
      default:
        return {
          text: "Start Learning",
          action: handleStartLesson,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  useEffect(() => {
    analytics.track("onboarding_recommendation_viewed", {
      hasCourse: !!course,
      hasProject: !!project,
      hasRoadmap: !!roadmap,
      hasInterviewPath: interviewRecommendation?.hasInterviewPath,
      learningGoal,
    });
  }, [course, project, roadmap, interviewRecommendation, learningGoal]);

  useEffect(() => {
    analytics.track("onboarding_completed", {
      learningGoal,
      hasRecommendedCourse: !!course,
      hasRecommendedProject: !!project,
      hasRecommendedRoadmap: !!roadmap,
      hasInterviewPath: interviewRecommendation?.hasInterviewPath,
      estimatedWeeks: stats.weeksToGoal,
    });
  }, [
    learningGoal,
    course,
    project,
    roadmap,
    stats.weeksToGoal,
    interviewRecommendation,
  ]);

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Success Message */}
      {showSuccess && (
        <div
          style={{
            padding: 16,
            marginBottom: 24,
            backgroundColor: "#065F46",
            borderRadius: 8,
            border: "1px solid #047857",
            animation: "slideDown 0.3s ease",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#ECFDF5",
              marginBottom: 4,
            }}
          >
            Awesome! 🎉
          </div>
          <div style={{ fontSize: 13, color: "#D1FAE5" }}>
            Your personalized learning path is ready. Let's get started!
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#FFFFFF",
            marginBottom: 12,
            letterSpacing: "-0.5px",
          }}
        >
          Your learning path is ready
        </h1>
        <p style={{ fontSize: 15, color: "#D1D5DB", lineHeight: 1.6 }}>
          {motivationalMessage}
        </p>
      </div>

      {/* Quick Stats - Minimal Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: 16,
            backgroundColor: "#1F2937",
            borderRadius: 8,
            border: "1px solid #374151",
          }}
        >
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
            Timeline
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: 4,
            }}
          >
            {stats.weeksToGoal}w
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>to complete</div>
        </div>

        <div
          style={{
            padding: 16,
            backgroundColor: "#1F2937",
            borderRadius: 8,
            border: "1px solid #374151",
          }}
        >
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
            Content
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: 4,
            }}
          >
            {stats.lessonsPlanned}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>lessons</div>
        </div>

        <div
          style={{
            padding: 16,
            backgroundColor: "#1F2937",
            borderRadius: 8,
            border: "1px solid #374151",
          }}
        >
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
            Practice
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: 4,
            }}
          >
            {stats.projectsToComplete}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>projects</div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#9CA3AF",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Your Recommendations
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {course && (
            <div
              style={{
                padding: 16,
                backgroundColor: "#1F2937",
                borderRadius: 8,
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}
                  >
                    Start with
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#FFFFFF",
                    }}
                  >
                    {course.title}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#D1D5DB",
                  display: "flex",
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <span>{course.level}</span>
                <span>•</span>
                <span>{Math.round(course.totalDuration / 60)}h</span>
                <span>•</span>
                <span>{course.totalStudents.toLocaleString()} learners</span>
              </div>
            </div>
          )}

          {project && (
            <div
              style={{
                padding: 16,
                backgroundColor: "#1F2937",
                borderRadius: 8,
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}
                  >
                    Build with
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#FFFFFF",
                    }}
                  >
                    {project.title}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#D1D5DB",
                  display: "flex",
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <span>{project.level}</span>
                <span>•</span>
                <span>~{Math.round(project.duration / 60)}h</span>
              </div>
            </div>
          )}

          {roadmap && (
            <div
              style={{
                padding: 16,
                backgroundColor: "#1F2937",
                borderRadius: 8,
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}
                  >
                    Follow
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#FFFFFF",
                    }}
                  >
                    {roadmap.title}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#D1D5DB",
                  marginTop: 10,
                }}
              >
                {roadmap.firstTopics.slice(0, 3).join(" • ")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interview Preparation */}
      {interviewRecommendation?.hasInterviewPath &&
        Array.isArray(interviewRecommendation?.phases) &&
        interviewRecommendation.phases.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#9CA3AF",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Interview Practice
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(interviewRecommendation.phases || []).map((phase) =>
                (phase.steps || []).map((step) =>
                  step?.resource ? (
                    <div
                      key={step.resource.id}
                      style={{
                        padding: 16,
                        backgroundColor: "#1F2937",
                        borderRadius: 8,
                        border: "1px solid #374151",
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#9CA3AF",
                            marginBottom: 4,
                          }}
                        >
                          Practice Interview
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#FFFFFF",
                          }}
                        >
                          {step.resource.title || "Interview Practice"}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#D1D5DB",
                        }}
                      >
                        {step.description || "Practice interview session"}
                      </div>
                      {step.resource.difficulty && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#9CA3AF",
                            marginTop: 10,
                          }}
                        >
                          Difficulty: {step.resource.difficulty}
                        </div>
                      )}
                    </div>
                  ) : null,
                ),
              )}
            </div>
          </div>
        )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={buttonConfig.action}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            color: "#FFFFFF",
            background: isLoading ? "#0FA3C4" : "hsl(var(--primary))",
            border: "none",
            borderRadius: 8,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "#0FA3C4";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "hsl(var(--primary))";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {isLoading ? "Loading..." : buttonConfig.text}
        </button>

        <button
          onClick={handleGoToDashboard}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 500,
            color: "#D1D5DB",
            background: "transparent",
            border: "1px solid #374151",
            borderRadius: 8,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: isLoading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "#4B5563";
              e.currentTarget.style.color = "#F3F4F6";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "#374151";
              e.currentTarget.style.color = "#D1D5DB";
            }
          }}
        >
          Go to Dashboard
        </button>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
