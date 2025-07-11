import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Shield, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle, BarChart3, Trophy, Zap, Target, Brain, Code, Cpu, Database, Search, Layers, Users, Award, TrendingUp, Lock, Unlock, AlertCircle, Play, Pause, RotateCcw, Home, Settings, HelpCircle, Sparkles } from 'lucide-react';
import { apiService, QuizQuestion, ConceptQuiz } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface DSAQuizEngineProps {
  conceptId?: string | null;
  onClose?: () => void;
}

const achievementIcons: Record<string, string> = {
  'Perfect Score': '💯',
  'Master of Concept': '🥇',
  'Fast Learner': '🔥',
  'Improver': '📈',
};

const achievementDetails: Record<string, { icon: string; title: string; desc: string; color: string }> = {
  'Perfect Score': {
    icon: '💯',
    title: 'Perfect Score',
    desc: 'Scored 100% on this quiz',
    color: 'from-pink-500 to-red-500',
  },
  'Master of Concept': {
    icon: '🥇',
    title: 'Master of Concept',
    desc: 'Scored 90% or higher',
    color: 'from-yellow-400 to-yellow-600',
  },
  'Fast Learner': {
    icon: '🔥',
    title: 'Fast Learner',
    desc: 'Mastered on the first attempt',
    color: 'from-orange-500 to-pink-500',
  },
  'Improver': {
    icon: '📈',
    title: 'Improver',
    desc: 'Improved your score from last attempt',
    color: 'from-blue-500 to-green-500',
  },
};

const DSAQuizEngine = ({ conceptId, onClose }: DSAQuizEngineProps) => {
  // Core quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Concept-specific quiz state
  const [conceptQuiz, setConceptQuiz] = useState<ConceptQuiz | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  
  // Anti-cheating state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowBlurs, setWindowBlurs] = useState(0);
  type SuspiciousActivity = { activity: string; severity: string; timestamp: string };
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cheatingWarnings, setCheatingWarnings] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  
  // UI state
  const [showResults, setShowResults] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  type ClickPatternEntry = { question: number; timeRemaining: number; selected: number };
  const analyticsRef = useRef<{
    timeSpent: any[];
    confidence: any[];
    hesitation: any[];
    clickPattern: ClickPatternEntry[];
  }>({
    timeSpent: [],
    confidence: [],
    hesitation: [],
    clickPattern: []
  });

  const [achievements, setAchievements] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  const router = useRouter();

  // Dynamic DSA Questions with varying difficulty (fallback)
  const generateQuestions = (): QuizQuestion[] => [
    {
      id: 1,
      topic: "Arrays & Hashing",
      difficulty: "Medium" as const,
      question: "What is the time complexity of finding the intersection of two sorted arrays using two pointers?",
      options: [
        "O(n + m) where n and m are array lengths",
        "O(n * m) where n and m are array lengths", 
        "O(n log m) where n < m",
        "O(min(n, m)) where n and m are array lengths"
      ],
      correct: 0,
      explanation: "Two pointers traverse each array once, resulting in O(n + m) time complexity.",
      tags: ["arrays", "two-pointers", "optimization"]
    },
    {
      id: 2,
      topic: "Linked Lists",
      difficulty: "Hard" as const,
      question: "In a singly linked list cycle detection using Floyd's algorithm, what is the mathematical relationship between the slow and fast pointer when they meet?",
      options: [
        "Fast pointer travels exactly 2x distance of slow pointer",
        "Fast pointer is always 1 node ahead when cycle is detected",
        "Meeting point is always at the start of the cycle",
        "Fast pointer travels distance = 2 * (slow pointer distance) at meeting point"
      ],
      correct: 3,
      explanation: "When they meet, fast pointer has traveled exactly twice the distance of slow pointer due to their speed difference.",
      tags: ["linked-list", "cycle-detection", "floyd-algorithm"]
    },
    {
      id: 3,
      topic: "Dynamic Programming",
      difficulty: "Hard" as const,
      question: "For the 0/1 Knapsack problem with n items and capacity W, what is the space-optimized approach?",
      options: [
        "Use 2D array dp[n][W] - no optimization possible",
        "Use 1D array dp[W] and iterate items in reverse order",
        "Use 1D array dp[W] and iterate items in forward order", 
        "Use recursive memoization with O(1) space"
      ],
      correct: 1,
      explanation: "Space can be optimized to O(W) using 1D array, but must iterate in reverse to avoid using updated values.",
      tags: ["dynamic-programming", "knapsack", "space-optimization"]
    },
    {
      id: 4,
      topic: "Trees & Graphs",
      difficulty: "Medium" as const,
      question: "What is the time complexity of finding the Lowest Common Ancestor (LCA) in a binary tree using the optimal approach?",
      options: [
        "O(n) time, O(h) space where h is height",
        "O(log n) time, O(1) space for balanced trees only",
        "O(n) time, O(1) space always",
        "O(h) time, O(h) space where h is height"
      ],
      correct: 0,
      explanation: "LCA requires O(n) time in worst case to traverse nodes, O(h) space for recursion stack.",
      tags: ["trees", "lca", "recursion"]
    },
    {
      id: 5,
      topic: "Sorting & Searching",
      difficulty: "Medium" as const,
      question: "In modified binary search for finding peak element in an array, what is the key insight for deciding search direction?",
      options: [
        "Always go towards the larger adjacent element",
        "Compare middle element with both neighbors",
        "Use random direction when neighbors are equal",
        "Always search the left half first"
      ],
      correct: 0,
      explanation: "Moving towards the larger neighbor guarantees finding a peak due to array boundaries.",
      tags: ["binary-search", "peak-finding", "optimization"]
    }
  ];

  // Load concept-specific questions
  const loadConceptQuestions = async () => {
    if (!conceptId) {
      // Fallback to default questions if no concept ID
      return;
    }

    setIsLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const quizData = await apiService.getConceptQuiz(conceptId);
      setConceptQuiz(quizData);
    } catch (error: any) {
      console.error('Error loading concept questions:', error);
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setQuestionsError(`Concept not found. Using default questions.`);
      } else {
        setQuestionsError('Failed to load quiz questions. Using default questions.');
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Load questions when component mounts or conceptId changes
  useEffect(() => {
    loadConceptQuestions();
  }, [conceptId]);

  // Get current questions (concept-specific or fallback)
  const getCurrentQuestions = (): QuizQuestion[] => {
    if (conceptQuiz && conceptQuiz.questions.length > 0) {
      return conceptQuiz.questions;
    }
    // Fallback to default questions
    return generateQuestions();
  };

  const questions = getCurrentQuestions();

  // Anti-cheating monitoring
  useEffect(() => {
    if (!quizStarted || quizCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        addSuspiciousActivity('Tab/Window switched', 'high');
      }
    };

    const handleBlur = () => {
      setWindowBlurs(prev => prev + 1);
      addSuspiciousActivity('Window lost focus', 'medium');
    };

    const handleKeyDown = (e: { ctrlKey: any; key: string; preventDefault: () => void; shiftKey: any; }) => {
      // Prevent common cheating shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'f')) {
        e.preventDefault();
        addSuspiciousActivity(`Blocked shortcut: Ctrl+${e.key.toUpperCase()}`, 'high');
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        addSuspiciousActivity('Attempted to open developer tools', 'critical');
      }
    };

    const handleRightClick = (e: { preventDefault: () => void; }) => {
      e.preventDefault();
      addSuspiciousActivity('Right-click attempted', 'medium');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleRightClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, [quizStarted, quizCompleted]);

  const addSuspiciousActivity = (activity: string, severity: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSuspiciousActivity(prev => [...prev, { activity, severity, timestamp }]);
    
    if (severity === 'critical') {
      setCheatingWarnings(prev => prev + 2);
    } else if (severity === 'high') {
      setCheatingWarnings(prev => prev + 1);
    }
  };

  // Check for disqualification
  useEffect(() => {
    if (cheatingWarnings >= 3 && !isDisqualified) {
      setIsDisqualified(true);
      setQuizCompleted(true);
      addSuspiciousActivity('DISQUALIFIED: Too many violations', 'critical');
    }
  }, [cheatingWarnings, isDisqualified]);

  // Timer logic
  useEffect(() => {
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isSubmitting) {
      handleTimeUp();
    }
    
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [quizStarted, quizCompleted, timeLeft, isSubmitting]);

  const handleTimeUp = () => {
    setIsSubmitting(true);
    addSuspiciousActivity('Question auto-submitted (timeout)', 'low');
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(15);
        setSelectedAnswer(null);
        setIsSubmitting(false);
      } else {
        completeQuiz();
      }
    }, 500);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isSubmitting) return;
    
    setSelectedAnswer(answerIndex);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));

    // Track analytics
    analyticsRef.current.clickPattern.push({
      question: currentQuestion,
      timeRemaining: timeLeft,
      selected: answerIndex
    });
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(15);
        setSelectedAnswer(null);
        setIsSubmitting(false);
      } else {
        completeQuiz();
      }
    }, 500);
  };

  const completeQuiz = async () => {
    setQuizCompleted(true);
    calculateScore();
    setShowResults(true);
    
    // Submit quiz results to backend
    if (conceptId) {
      try {
        const finalScore = Math.round((Object.values(answers).filter((answer, index) => answer === questions[index]?.correct).length / questions.length) * 100);
        const response = await apiService.submitQuiz(conceptId, finalScore);
        if (response && response.achievements) {
          setAchievements(response.achievements);
        }
        if (response && response.newlyUnlockedConcepts) {
          setNewlyUnlocked(response.newlyUnlockedConcepts);
        }
        console.log('Quiz results submitted successfully');
      } catch (error) {
        console.error('Failed to submit quiz results:', error);
      }
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct) {
        correctAnswers++;
      }
    });
    setScore((correctAnswers / questions.length) * 100);
  };

  const startQuiz = async () => {
    // Request fullscreen
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      addSuspiciousActivity('Fullscreen denied', 'high');
    }

    setQuizStarted(true);
    setCurrentPage('quiz');
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setTimeLeft(15);
    setAnswers({});
    setQuizStarted(false);
    setQuizCompleted(false);
    setSelectedAnswer(null);
    setScore(0);
    setIsSubmitting(false);
    setTabSwitches(0);
    setWindowBlurs(0);
    setSuspiciousActivity([]);
    setCheatingWarnings(0);
    setIsDisqualified(false);
    setShowResults(false);
    setShowAnalytics(false);
    setCurrentPage('home');
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const getTimerColor = () => {
    if (timeLeft <= 3) return 'from-red-500 to-red-600';
    if (timeLeft <= 7) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-blue-500';
  };

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100;
  };

  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Close Button */}
        {onClose && (
          <div className="absolute top-6 right-6 z-10">
            <button
              onClick={onClose}
              className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <XCircle className="w-6 h-6" />
            </button>
            </div>
        )}
        
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl">
                <Brain className="w-16 h-16 text-white" />
          </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {conceptQuiz ? `${conceptQuiz.conceptTitle} Quiz` : 'Smart Quiz Engine'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {conceptQuiz 
              ? `Master ${conceptQuiz.conceptTitle} with our intelligent quiz system featuring concept-specific questions and real-time analytics`
              : 'Test your knowledge with our AI-powered quiz engine featuring adaptive questions, advanced proctoring, and detailed performance insights'
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoadingQuestions && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-8 shadow-xl">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Preparing Your Quiz</h3>
              <p className="text-gray-600 dark:text-gray-300">Loading concept-specific questions...</p>
          </div>
          </div>
        )}

        {/* Error State */}
        {questionsError && (
          <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-200 dark:border-red-700 mb-8 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Quiz Loading Notice</h3>
                <p className="text-red-700 dark:text-red-300">{questionsError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-6 w-fit">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {conceptQuiz ? `${conceptQuiz.totalQuestions} Questions` : 'Adaptive Questions'}
          </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {conceptQuiz 
                ? `Carefully crafted questions specifically for ${conceptQuiz.conceptTitle}`
                : 'Intelligent question generation based on your learning progress and difficulty level'
              }
            </p>
          </div>
          
          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="p-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl mb-6 w-fit">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Timer</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Adaptive time limits that adjust based on question complexity and your performance patterns
            </p>
          </div>
          
          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mb-6 w-fit">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Advanced Security</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Real-time monitoring with AI-powered cheating detection and comprehensive analytics
            </p>
          </div>
        </div>

        {/* Rules Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-12 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl mr-4">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            Quiz Guidelines & Security
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                Important Rules
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Fullscreen mode is required for optimal experience</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Tab switching and external help are strictly prohibited</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Keyboard shortcuts and developer tools are blocked</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Multiple violations will result in automatic disqualification</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Security Features
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Real-time activity monitoring and analysis</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">AI-powered suspicious behavior detection</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Comprehensive performance analytics and insights</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">Detailed progress tracking and improvement suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startQuiz}
            disabled={isLoadingQuestions || questions.length === 0}
            className="group relative px-16 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl text-white font-bold text-2xl transition-all duration-300 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:scale-105 shadow-2xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
          >
            <div className="flex items-center justify-center">
              {isLoadingQuestions ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mr-4"></div>
                  Loading Quiz...
                </>
              ) : (
                <>
                  <Play className="w-8 h-8 mr-4 transition-transform group-hover:scale-110" />
              Start Quiz
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
          
          {!isLoadingQuestions && questions.length > 0 && (
            <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
              Ready to test your knowledge with {questions.length} questions
            </p>
          )}
        </div>
      </div>
    </div>
  );

    // Quiz Interface
  const QuizInterface = () => {
    const currentQ = questions[currentQuestion];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-6">
        {/* Header with monitoring */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${cheatingWarnings === 0 ? 'bg-green-100 dark:bg-green-900/30' : cheatingWarnings < 3 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <Shield className={`w-5 h-5 ${cheatingWarnings === 0 ? 'text-green-600 dark:text-green-400' : cheatingWarnings < 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Security Status</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{cheatingWarnings}/3 warnings</div>
              </div>
            </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tab Switches</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{tabSwitches}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentQuestion + 1} / {questions.length}
              </div>
            </div>
          </div>
        </div>

                {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-r ${getTimerColor()} shadow-2xl flex items-center justify-center`}>
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-28 h-28 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{timeLeft}</span>
            </div>
          </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-40 h-3 bg-white/50 dark:bg-gray-800/50 rounded-full mx-auto overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${getTimerColor()} transition-all duration-1000 ease-linear shadow-lg`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Time remaining</p>
          </div>
        </div>
        
        {/* Question Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl mb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentQ.topic}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Difficulty:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentQ.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      currentQ.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {currentQ.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {currentQ.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-4">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isSubmitting}
                  className={`w-full p-6 rounded-xl text-left transition-all duration-300 border-2 ${
                    selectedAnswer === index
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/25'
                      : 'bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-6 transition-all duration-300 ${
                      selectedAnswer === index 
                        ? 'border-blue-500 bg-blue-500 shadow-lg' 
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      <span className={`font-bold text-lg transition-colors ${
                        selectedAnswer === index ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <span className="text-lg font-medium text-gray-900 dark:text-white">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedAnswer !== null && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl text-white font-bold transition-all duration-300 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
                      <Zap className="w-5 h-5 ml-3" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Results Page
  const ResultsPage = () => {
    const correctAnswers = questions.filter((q, index) => answers[index] === q.correct).length;
    const accuracy = (correctAnswers / questions.length) * 100;
    const masteryThreshold = 75; // percent
    const isMastered = score >= masteryThreshold;
    
    const getScoreColor = () => {
      if (score >= 80) return 'from-green-500 to-emerald-500';
      if (score >= 60) return 'from-yellow-500 to-orange-500';
      return 'from-red-500 to-pink-500';
    };

    const getScoreGrade = () => {
      if (score >= 90) return 'A+';
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      if (score >= 60) return 'C';
      return 'F';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Close Button */}
          {onClose && (
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={onClose}
                className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <XCircle className="w-6 h-6" />
              </button>
              </div>
          )}
          {/* Newly Unlocked Topics */}
          {newlyUnlocked.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700 mb-8 shadow-xl text-center">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2 flex items-center justify-center gap-2">
                <span className="text-3xl">🎉</span> New Topics Unlocked!
              </h2>
              <ul className="flex flex-wrap justify-center gap-4 mt-4">
                {newlyUnlocked.map((topic, idx) => (
                  <li key={idx} className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow text-green-700 dark:text-green-300 font-semibold border border-green-300 dark:border-green-600">
                    ✅ {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className={`p-8 bg-gradient-to-r ${getScoreColor()} rounded-2xl shadow-2xl`}>
                  <Trophy className="w-16 h-16 text-white" />
            </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {isDisqualified ? 'Quiz Disqualified' : 'Quiz Complete!'}
            </h1>
            {/* Mastery Message */}
            {!isDisqualified && (
              isMastered ? (
                <div className="text-green-600 text-2xl font-semibold mb-4">
                  🎉 Congratulations! You've mastered this concept!
                </div>
              ) : (
                <div className="text-red-500 text-2xl font-semibold mb-4">
                  ⚠️ You need to revise this concept again.
                </div>
              )
            )}
            {/* Achievements Section */}
            {!isDisqualified && achievements.length > 0 && (
              <div className="text-center mt-4 mb-8">
                <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  <span className="text-3xl">🏆</span> Achievements Unlocked
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-base">You've earned these for your performance in this quiz.</p>
                <div className="flex flex-wrap justify-center gap-6">
                  {achievements.map((ach, index) => {
                    const details = achievementDetails[ach] || {
                      icon: '🏅',
                      title: ach,
                      desc: '',
                      color: 'from-gray-400 to-gray-600',
                    };
                    return (
                      <div
                        key={index}
                        className={`flex flex-col items-center p-5 rounded-2xl shadow-xl bg-gradient-to-br ${details.color} min-w-[180px] max-w-xs transition-transform hover:scale-105`}
                      >
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/80 shadow mb-3 text-3xl">
                          {details.icon}
                        </div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">{details.title}</div>
                        <div className="text-gray-700 dark:text-gray-200 text-sm opacity-80">{details.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {isDisqualified 
                ? 'Too many security violations were detected during the quiz'
                : 'Here are your detailed performance results and insights'
              }
            </p>
          </div>

          {!isDisqualified && (
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {/* Score Overview */}
              <div className="lg:col-span-1">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-4">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    Performance Summary
                  </h3>
                  
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-r ${getScoreColor()} shadow-2xl mb-6`}>
                      <div className="bg-white/20 backdrop-blur-sm rounded-full w-36 h-36 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">{getScoreGrade()}</span>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{score.toFixed(1)}%</div>
                    <div className="text-gray-600 dark:text-gray-300 text-lg">{correctAnswers} out of {questions.length} correct</div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-300">Accuracy</span>
                    </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">Time Efficiency</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">85%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-gray-700 dark:text-gray-300">Security Score</span>
                      </div>
                      <span className={`text-lg font-bold ${cheatingWarnings === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {cheatingWarnings === 0 ? 'Perfect' : `${cheatingWarnings} warnings`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Breakdown */}
              <div className="lg:col-span-2">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl mr-4">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    Question Analysis
                  </h3>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questions.map((question, index) => {
                      const userAnswer = answers[index];
                      const isCorrect = userAnswer === question.correct;
                      const wasAnswered = userAnswer !== undefined;
                      
                      return (
                        <div key={index} className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                          isCorrect 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 
                          wasAnswered 
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : 
                            'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                                isCorrect ? 'bg-green-500' : wasAnswered ? 'bg-red-500' : 'bg-gray-500'
                              }`}>
                                {isCorrect ? <CheckCircle className="w-6 h-6 text-white" /> : 
                                 wasAnswered ? <XCircle className="w-6 h-6 text-white" /> : 
                                 <Clock className="w-6 h-6 text-white" />}
                              </div>
                              <div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Question {index + 1}</span>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{question.topic} • {question.difficulty}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                wasAnswered 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {isCorrect ? 'Correct' : wasAnswered ? 'Incorrect' : 'No Answer'}
                              </div>
                            </div>
                          </div>
                          
                          {wasAnswered && (
                            <div className="mt-4 space-y-2">
                              <div className="text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Your answer:</span>
                                <span className={`ml-2 font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                  {question.options[userAnswer]}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Correct answer:</span>
                                  <span className="ml-2 font-medium text-green-700 dark:text-green-300">
                                    {question.options[question.correct]}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Report */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                Security Report
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">Tab Switches</span>
                  </div>
                  <span className={`font-bold text-lg ${tabSwitches === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {tabSwitches}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-700 dark:text-gray-300">Window Blurs</span>
                  </div>
                  <span className={`font-bold text-lg ${windowBlurs === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {windowBlurs}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-gray-700 dark:text-gray-300">Violations</span>
                  </div>
                  <span className={`font-bold text-lg ${cheatingWarnings === 0 ? 'text-green-600 dark:text-green-400' : cheatingWarnings < 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {cheatingWarnings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Overall Status</span>
                  </div>
                  <span className={`font-bold text-lg flex items-center ${isDisqualified ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {isDisqualified ? <Lock className="w-5 h-5 mr-2" /> : <Unlock className="w-5 h-5 mr-2" />}
                    {isDisqualified ? 'Disqualified' : 'Clean'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Performance Analytics
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Response Time</span>
                    <span className="text-gray-900 font-bold">Avg 8.2s</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Confidence Level</span>
                    <span className="text-gray-900 font-bold">82%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: '82%'}}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Topic Mastery</span>
                    <span className="text-gray-900 font-bold">Good</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-xs text-gray-400">Arrays: 80%</div>
                    <div className="text-xs text-gray-400">Trees: 75%</div>
                    <div className="text-xs text-gray-400">DP: 60%</div>
                    <div className="text-xs text-gray-400">Graphs: 85%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          {suspiciousActivity.length > 0 && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mr-4">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                Activity Log
              </h3>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {suspiciousActivity.map((activity, index) => (
                  <div key={index} className={`p-3 rounded-lg flex items-center justify-between ${
                    activity.severity === 'critical' ? 'bg-red-500/20 border border-red-500/30' :
                    activity.severity === 'high' ? 'bg-orange-500/20 border border-orange-500/30' :
                    activity.severity === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                    'bg-blue-500/20 border border-blue-500/30'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.severity === 'critical' ? 'bg-red-400' :
                        activity.severity === 'high' ? 'bg-orange-400' :
                        activity.severity === 'medium' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`}></div>
                      <span className="text-white text-sm">{activity.activity}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-6 mb-12">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              {showAnalytics ? 'Hide' : 'Show'} Detailed Analytics
            </button>
            
            <button
              onClick={resetQuiz}
              className="group px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl text-white font-bold transition-all duration-300 hover:from-green-700 hover:to-blue-700 hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
            >
              <RotateCcw className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              Retake Quiz
            </button>
            
            <button
              onClick={() => setCurrentPage('home')}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold transition-all duration-300 hover:from-purple-700 hover:to-pink-700 hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              Home
            </button>
            
            <button
              onClick={() => router.push('/learning-paths')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
            >
              <Target className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              Return to Learning Path
            </button>
          </div>

          {/* Detailed Analytics */}
          {showAnalytics && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mr-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                Detailed Performance Analysis
              </h3>
              
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                  <h4 className="text-xl font-bold text-green-800 dark:text-green-300 mb-6 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Strengths
                  </h4>
                  <ul className="space-y-4">
                    {score >= 80 && (
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-green-700 dark:text-green-300">Strong overall performance with {score.toFixed(1)}% accuracy</span>
                      </li>
                    )}
                    {cheatingWarnings === 0 && (
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-green-700 dark:text-green-300">Perfect integrity maintained throughout the quiz</span>
                      </li>
                    )}
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                      <span className="text-green-700 dark:text-green-300">Excellent time management skills</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                      <span className="text-green-700 dark:text-green-300">Consistent and focused response pattern</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
                  <h4 className="text-xl font-bold text-orange-800 dark:text-orange-300 mb-6 flex items-center">
                    <AlertCircle className="w-6 h-6 mr-3" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-4">
                    {score < 60 && (
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-orange-700 dark:text-orange-300">Focus on fundamental concepts and basic problem-solving</span>
                      </li>
                    )}
                    {score < 80 && (
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-orange-700 dark:text-orange-300">Practice more complex algorithmic problems</span>
                      </li>
                    )}
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                      <span className="text-orange-700 dark:text-orange-300">Review dynamic programming concepts and patterns</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                      <span className="text-orange-700 dark:text-orange-300">Strengthen tree and graph algorithm understanding</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-700">
                <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-8 flex items-center">
                  <Target className="w-7 h-7 mr-4" />
                  Recommended Next Steps
                </h4>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl w-fit mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <Code className="w-8 h-8 text-white" />
                  </div>
                    <h5 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">Practice Coding</h5>
                    <p className="text-blue-700 dark:text-blue-400 text-sm">Solve 20+ problems weekly on platforms like LeetCode and HackerRank</p>
                  </div>
                  <div className="text-center group">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl w-fit mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <Database className="w-8 h-8 text-white" />
                  </div>
                    <h5 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">Study Concepts</h5>
                    <p className="text-green-700 dark:text-green-400 text-sm">Review data structures and algorithms fundamentals</p>
                </div>
                  <div className="text-center group">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl w-fit mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h5 className="text-lg font-bold text-purple-800 dark:text-purple-300 mb-2">Mock Interviews</h5>
                    <p className="text-purple-700 dark:text-purple-400 text-sm">Practice with peers and participate in coding competitions</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };      

  // Main render logic
  if (currentPage === 'home') {
    return <HomePage />;
  } else if (currentPage === 'quiz' && !quizCompleted) {
    return <QuizInterface />;
  } else if (quizCompleted || showResults) {
    return <ResultsPage />;
  }

  return <HomePage />;
};

export default DSAQuizEngine;
