'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle, Circle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startLearningLoading, setStartLearningLoading] = useState<boolean>(false);

  useEffect(() => {
    loadCourseDashboard();
    // eslint-disable-next-line
  }, [resolvedParams.id]);

  const loadCourseDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCourseDashboard(resolvedParams.id);
      if (response.success) {
        setCourseData(response.data);
      } else {
        setError(response.message || "Failed to load course");
      }
    } catch (err) {
      setError("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  const startLearning = async () => {
    if (!courseData || !courseData.course?._id) return;
    setStartLearningLoading(true);
    try {
      // Route to static learning page immediately
      console.log('Routing to static learning page:', `/courses/${courseData.course._id}/learn`);
      router.push(`/courses/${courseData.course._id}/learn`);
    } catch (err) {
      console.error('StartLearning error:', err);
    } finally {
      setStartLearningLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-lg">Loading...</div>;
  if (error || !courseData) return <div className="text-red-500 text-center py-16">{error || "No data"}</div>;

  const { course } = courseData as any;
  const concepts = course?.concepts || [];
  const progressMap: Record<string, string> = {};
  if ((courseData as any).sequentialConcepts) {
    (courseData as any).sequentialConcepts.forEach((c: any) => {
      progressMap[c._id] = c.status;
    });
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {course?.title}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            {course?.description}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="flex justify-center mb-8">
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 px-8 py-4"
          onClick={startLearning}
          disabled={startLearningLoading}
        >
          <Play className="w-5 h-5 mr-2" />
          {startLearningLoading ? "Loading..." : "Start Learning"}
        </Button>
      </div>
      <div className="flex flex-col items-center mb-6">
        <h6 className="text-lg font-bold text-purple-700 mb-1 tracking-wide uppercase">Course Learning Path</h6>
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-6 py-3 text-center text-gray-800 text-base font-medium shadow-sm max-w-2xl">
          This is the learning path for this course. Each node represents a concept you will learn, in order.
        </div>
      </div>
      <div className="overflow-x-auto py-6">
        {concepts.length > 0 ? (
          <div className="flex gap-12 items-center min-h-[120px]" style={{ minWidth: Math.max(600, concepts.length * 180) }}>
            {concepts.map((concept: any, idx: number) => {
              const isLast = idx === concepts.length - 1;
              const status = progressMap[concept.conceptId || concept._id] || "not_started";
              return (
                <div key={concept.conceptId || concept._id} className="flex items-center" style={{ minWidth: 160, maxWidth: 220 }}>
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full flex items-center justify-center w-16 h-16 text-xl font-bold shadow-lg border-4 border-white ${status === "completed" ? "bg-green-500 text-white" : status === "in_progress" ? "bg-yellow-400 text-white" : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"}`}>
                      {status === "completed" ? <CheckCircle className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                    </div>
                    <div className="text-base font-semibold text-blue-700 text-center mt-2 px-2 break-words" style={{ maxWidth: 180 }}>
                      {concept.title}
                    </div>
                  </div>
                  {!isLast && (
                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="mx-2">
                      <defs>
                        <marker id="arrowhead-h" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                          <polygon points="0 0, 8 4, 0 8" fill="#7c3aed" />
                        </marker>
                      </defs>
                      <line x1="4" y1="12" x2="56" y2="12" stroke="#7c3aed" strokeWidth="4" markerEnd="url(#arrowhead-h)" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">No concepts found for this course.</div>
        )}
      </div>
    </div>
  );
} 