import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";

interface ConceptSidebarProps {
  title: string;
  description: string;
  masteryScore: number;
  status: string;
}

export default function ConceptSidebar({ title, description, masteryScore, status }: ConceptSidebarProps) {
  return (
    <aside className="mb-8">
      <div className="text-2xl font-bold flex items-center gap-2">{title}</div>
      <div className="text-lg text-gray-700 mb-4">{description}</div>
      <div className="flex items-center gap-4 mb-2">
        <Progress value={masteryScore} className="h-2 w-40" />
        <span className="text-sm text-gray-600">{masteryScore}% Mastery</span>
        {status === "completed" && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>
    </aside>
  );
} 