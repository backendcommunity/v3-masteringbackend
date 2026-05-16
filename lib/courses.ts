import { api } from "./api";
import { CoursesQuery } from "./data";

export const fetchCourses = async (queries?: CoursesQuery): Promise<any> => {
  const { data } = await api.get("/courses", {
    params: queries,
  });

  return data;
};

export const fetchUserCourses = async (
  queries?: CoursesQuery
): Promise<any> => {
  const { data } = await api.get("/users/courses", {
    params: queries,
  });

  return data;
};

export const fetchCourse = async (courseId: string, params?: any) => {
  const { data } = await api.get(
    "/courses/" + courseId + "?isRoadmap=" + params?.isRoadmap
  );

  return data;
};

export const loadVideoNotes = async (courseId: string, videoId: string) => {
  const { data } = await api.get(
    `/courses/${courseId}/videos/${videoId}/notes`
  );
  return data;
};

export const fetchCourseQuizzes = async (courseId: string) => {
  const { data } = await api.get(`/courses/${courseId}/quizzes`);
  return data;
};

export const fetchUserCourse = async (courseId: string) => {
  const { data } = await api.get("/users/courses/" + courseId);

  return data;
};

export const handleCourseEnrollment = async (courseId: string) => {
  const { data } = await api.post("/courses/" + courseId);
  return data;
};

export const fetchVideoCaption = async (vimeoId: number | string): Promise<string | null> => {
  const { data } = await api.get(`/courses/videos/${vimeoId}/captions`);
  return data?.data ?? null;
};

export interface LeaderboardRank {
  rank: number | null;
  total: number;
  percentile: number | null;
}

export const fetchLeaderboardRank = async (courseId: string): Promise<LeaderboardRank | null> => {
  const { data } = await api.get(`/courses/${courseId}/leaderboard-rank`);
  return data?.data ?? null;
};

export const markVideoComplete = async (
  courseId: string,
  chapterId: string,
  videoId: string,
  payload: { isChapterCompleted: boolean }
) => {
  const { data } = await api.post(`/courses/${courseId}/videos/${videoId}`, {
    contentType: "VIDEO",
    type: "course",
    courseId,
    contentId: videoId,
    chapterId,
    payload,
  });
  return data;
};
