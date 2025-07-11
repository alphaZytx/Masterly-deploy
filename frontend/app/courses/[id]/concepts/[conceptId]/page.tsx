"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import ConceptSidebar from "./ConceptSidebar";
import ConceptContent from "./ConceptContent";
import MarkAsRead from "./MarkAsRead";
import Quiz, { QuizQuestion } from "@/components/Quiz";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ConceptLearningPageProps {
  params: { id: string; conceptId: string };
}

export default function ConceptLearningPage({ params }: ConceptLearningPageProps) {
  const router = useRouter();
  const [conceptData, setConceptData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contentRead, setContentRead] = useState<boolean>(false);
  const [videoRead, setVideoRead] = useState<boolean>(false);
  const [quizUnlocked, setQuizUnlocked] = useState<boolean>(false);
  const [quizKey, setQuizKey] = useState<number>(0); // for resetting quiz

  useEffect(() => {
    loadConceptData();
    // eslint-disable-next-line
  }, [params.conceptId]);

  const loadConceptData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getConceptLearningPage(params.id, params.conceptId);
      if (response.success) {
        setConceptData(response.data);
        setContentRead(response.data.progress?.descriptionRead || false);
        setVideoRead(response.data.progress?.videoWatched || false);
        setQuizUnlocked(
          (response.data.progress?.descriptionRead && response.data.progress?.videoWatched) || false
        );
      } else {
        setError(response.message || "Failed to load concept");
      }
    } catch (err) {
      setError("Failed to load concept data");
    } finally {
      setLoading(false);
    }
  };

  // Update quizUnlocked whenever contentRead or videoRead changes
  useEffect(() => {
    setQuizUnlocked(contentRead && videoRead);
  }, [contentRead, videoRead]);

  const handleBothRead = () => {
    // No need to setQuizUnlocked here, handled by useEffect
  };

  const handleQuizSubmit = async (score: number, passed: boolean) => {
    if (passed) {
      // Fetch latest concept data to get updated navigation
      const response = await apiClient.getConceptLearningPage(params.id, params.conceptId);
      if (response.success && response.data?.navigation?.nextConcept) {
        router.push(`/courses/${params.id}/concepts/${response.data.navigation.nextConcept}`);
      } else {
        // Optionally show completion message or redirect elsewhere
        loadConceptData();
      }
    } else {
      setContentRead(false);
      setVideoRead(false);
      setQuizUnlocked(false);
      setQuizKey((k) => k + 1); // reset quiz component
    }
  };

  if (loading) return <div className="text-center py-16 text-lg">Loading...</div>;
  if (error || !conceptData) return <div className="text-red-500 text-center py-16">{error || "No data"}</div>;

  const { concept, progress, navigation } = conceptData;
  const quizQuestions: QuizQuestion[] = (concept?.quiz || []).map((q: any, idx: number) => ({
    id: idx,
    question: q.questionText,
    options: q.options,
    correct: q.correctAnswerIndex,
  }));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <ConceptSidebar
        title={concept?.title}
        description={concept?.description}
        masteryScore={progress?.masteryScore}
        status={progress?.status}
      />
      <ConceptContent concept={concept} />
      <MarkAsRead
        contentRead={contentRead}
        setContentRead={setContentRead}
        videoRead={videoRead}
        setVideoRead={setVideoRead}
        onBothRead={handleBothRead}
        conceptId={params.conceptId}
        courseId={params.id}
      />
      {quizQuestions.length > 0 && (
        <Quiz
          key={quizKey}
          title="Concept Quiz"
          questions={quizQuestions}
          testType="concept_quiz"
          passingScore={70}
          onSubmit={handleQuizSubmit}
          allowRetake={true}
          // The Start Quiz button is disabled until both content and video are marked as read
          startDisabled={!(contentRead && videoRead)}
        />
      )}
      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {navigation?.prevConcept && (
          <Button variant="outline" onClick={() => router.push(`/courses/${params.id}/concepts/${navigation.prevConcept}`)}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
        )}
        {navigation?.nextConcept && (
          <Button onClick={() => router.push(`/courses/${params.id}/concepts/${navigation.nextConcept}`)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}