import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, FileText, Loader2, Lightbulb, DollarSign, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProjectAnalysis {
  efficiency_score: number;
  recommendations: string[];
  cost_optimization: string;
  installation_tips: string[];
}

interface ProjectAnalysisProps {
  projectId: number;
  projectName: string;
}

export function ProjectAnalysis({ projectId, projectName }: ProjectAnalysisProps) {
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", `/api/projects/${projectId}/analyze`) as unknown as ProjectAnalysis;
      setAnalysis(response);
      toast({
        title: "Análise concluída",
        description: "Análise inteligente do projeto gerada com sucesso!",
      });
    } catch (error) {
      console.error("Erro na análise:", error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o projeto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await apiRequest("POST", `/api/projects/${projectId}/report`) as unknown as { report: string };
      setReport(response.report);
      toast({
        title: "Relatório gerado",
        description: "Relatório técnico criado com sucesso!",
      });
    } catch (error) {
      console.error("Erro no relatório:", error);
      toast({
        title: "Erro no relatório",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="flex items-center gap-2"
          data-testid="button-analyze-project"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isAnalyzing ? "Analisando..." : "Analisar Projeto"}
        </Button>
        
        <Button 
          onClick={handleGenerateReport} 
          disabled={isGeneratingReport}
          variant="outline"
          className="flex items-center gap-2"
          data-testid="button-generate-report"
        >
          {isGeneratingReport ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isGeneratingReport ? "Gerando..." : "Gerar Relatório"}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <Card data-testid="card-analysis-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Efficiency Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Score de Eficiência</span>
                <Badge className={`${getScoreColor(analysis.efficiency_score)} text-white`}>
                  {analysis.efficiency_score}/100
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreColor(analysis.efficiency_score)}`}
                  style={{ width: `${analysis.efficiency_score}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Recommendations */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4" />
                Recomendações Técnicas
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations && analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Cost Optimization */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4" />
                Otimização de Custos
              </h4>
              <p className="text-sm text-gray-600">{analysis.cost_optimization}</p>
            </div>

            <Separator />

            {/* Installation Tips */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4" />
                Dicas de Instalação
              </h4>
              <ul className="space-y-2">
                {analysis.installation_tips && analysis.installation_tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report */}
      {report && (
        <Card data-testid="card-project-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório Técnico - {projectName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">{report}</pre>
            </div>
            <Button 
              className="mt-4" 
              onClick={() => {
                const blob = new Blob([report], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `relatorio-${projectName.replace(/\s+/g, '-')}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              data-testid="button-download-report"
            >
              Baixar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}