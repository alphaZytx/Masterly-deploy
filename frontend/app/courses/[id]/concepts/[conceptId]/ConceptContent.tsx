import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Video, FileText } from "lucide-react";

interface ConceptContentProps {
  concept: any;
}

export default function ConceptContent({ concept }: ConceptContentProps) {
  return (
    <div>
      {/* Video Block */}
      {concept?.contentBlocks?.some((b: any) => b.type === "video") && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" /> Video Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <iframe
                src={concept.contentBlocks.find((b: any) => b.type === "video")?.data}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      )}
      {/* Article Block */}
      {concept?.articleContent && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Article Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {concept.articleContent.intro && <div className="mb-4">{concept.articleContent.intro}</div>}
              {concept.articleContent.levels?.map((level: any, i: number) => (
                <div key={i} className="mb-4">
                  {level.level && <div className="font-semibold mb-2">{level.level}</div>}
                  {level.sections?.map((section: any, j: number) => (
                    <div key={j} className="mb-2">
                      {section.heading && <div className="font-medium">{section.heading}</div>}
                      {section.content && <div>{section.content}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 