import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Download, Edit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProjectAnalysis } from "@/components/project-analysis";
import { EditProjectForm } from "@/components/edit-project-modal";
import type { ProjectWithItems, ChecklistItem } from "@shared/schema";

export default function ProjectDetails() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  
  const projectId = params?.id ? parseInt(params.id) : null;

  const { data: project, isLoading } = useQuery<ProjectWithItems>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: number; isCompleted: boolean }) => {
      return await apiRequest("PATCH", `/api/checklist-items/${itemId}`, {
        isCompleted: isCompleted ? 1 : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: number; status: string }) => {
      return await apiRequest("PATCH", `/api/projects/${projectId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Status atualizado",
        description: "O status do projeto foi alterado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    },
  });

  if (!projectId) {
    return <div>Projeto não encontrado</div>;
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solar-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando projeto...</p>
      </div>
    </div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Projeto não encontrado</p>
      </div>
    </div>;
  }

  const getRoofTypeLabel = (roofType: string) => {
    const labels = {
      ceramico: "Telhado Cerâmico",
      metalico: "Telhado Metálico", 
      fibrocimento: "Telhado Fibrocimento",
      solo: "Instalação no Solo"
    };
    return labels[roofType as keyof typeof labels] || roofType;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planejamento: "Planejamento",
      em_andamento: "Em Andamento",
      concluido: "Concluído"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "concluido": return "default";
      case "em_andamento": return "secondary";
      case "planejamento": return "outline";
      default: return "outline";
    }
  };

  const groupedItems = project.checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categoryLabels = {
    seguranca: "Segurança",
    materiais_eletricos: "Materiais Elétricos",
    estrutura: "Estrutura"
  };

  const categoryIcons = {
    seguranca: "🛡️",
    materiais_eletricos: "⚡",
    estrutura: "🔧"
  };

  const completedItems = project.checklistItems.filter(item => item.isCompleted).length;
  const totalItems = project.checklistItems.length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleCheckboxChange = (itemId: number, isCompleted: boolean) => {
    updateChecklistItemMutation.mutate({ itemId, isCompleted });
    
    // Auto-update project status based on completion
    setTimeout(() => {
      const updatedCompletedItems = project.checklistItems.filter(item => 
        item.id === itemId ? isCompleted : item.isCompleted
      ).length;
      const totalItems = project.checklistItems.length;
      const newProgress = totalItems > 0 ? Math.round((updatedCompletedItems / totalItems) * 100) : 0;
      
      let newStatus = project.status;
      
      if (newProgress === 100 && project.status !== "concluido") {
        newStatus = "concluido";
      } else if (newProgress > 0 && newProgress < 100 && project.status === "planejamento") {
        newStatus = "em_andamento";
      }
      
      if (newStatus !== project.status) {
        updateStatusMutation.mutate({ projectId: project.id, status: newStatus });
      }
    }, 500);
  };

  const handleExportPDF = () => {
    // Create PDF content
    const pdfContent = `
RELATÓRIO DE PROJETO SOLAR - ${project?.name}
=====================================

INFORMAÇÕES DO PROJETO:
- Nome: ${project?.name}
- Potência do Inversor: ${project?.inverterPower} kW
- Quantidade de Painéis: ${project?.solarPanelsCount} unidades
- Tipo de Instalação: ${getRoofTypeLabel(project?.roofType || '')}
- Status: ${getStatusLabel(project?.status || '')}

CHECKLIST DE MATERIAIS:
${Object.entries(groupedItems).map(([category, items]) => `
${categoryLabels[category as keyof typeof categoryLabels]}:
${items.map(item => `  ${item.isCompleted ? '✓' : '○'} ${item.title} - ${item.description}`).join('\n')}
`).join('\n')}

PROGRESSO:
${completedItems} de ${totalItems} itens concluídos (${progress}%)

Data de geração: ${new Date().toLocaleDateString('pt-BR')}
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projeto-${project?.name?.replace(/\s+/g, '-')}-checklist.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "PDF Exportado",
      description: "Checklist exportado com sucesso!",
    });
  };

  const handleProjectUpdated = () => {
    setShowEditForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    toast({
      title: "Projeto atualizado",
      description: "As alterações foram salvas com sucesso!",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg" data-testid="text-project-name">
                    {project.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">Checklist de instalação gerado automaticamente</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  data-testid="button-export-pdf"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowEditForm(true)}
                  data-testid="button-edit-project"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Potência do Inversor</p>
                <p className="text-lg font-semibold text-gray-900" data-testid="text-inverter-power">
                  {project.inverterPower} kW
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quantidade de Painéis</p>
                <p className="text-lg font-semibold text-gray-900" data-testid="text-panels-count">
                  {project.solarPanelsCount} unidades
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Instalação</p>
                <p className="text-lg font-semibold text-gray-900" data-testid="text-roof-type">
                  {getRoofTypeLabel(project.roofType)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusBadgeVariant(project.status)} data-testid="badge-status">
                    {getStatusLabel(project.status)}
                  </Badge>
                  <select 
                    value={project.status}
                    onChange={(e) => updateStatusMutation.mutate({ 
                      projectId: project.id, 
                      status: e.target.value 
                    })}
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1"
                    data-testid="select-status"
                  >
                    <option value="planejamento">Planejamento</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="mb-8">
              <ProjectAnalysis projectId={project.id} projectName={project.name} />
            </div>

            {/* Checklist by Category */}
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons]}</div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </h4>
                    <span className="text-sm text-gray-500">({items.length} itens)</span>
                  </div>
                  
                  <div className="space-y-3 ml-10">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <Checkbox
                          checked={!!item.isCompleted}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(item.id, checked as boolean)
                          }
                          className="mt-1"
                          data-testid={`checkbox-item-${item.id}`}
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900" data-testid={`title-item-${item.id}`}>
                            {item.title}
                          </h5>
                          <p className="text-sm text-gray-600" data-testid={`description-item-${item.id}`}>
                            {item.description}
                          </p>
                        </div>
                        {item.isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Summary */}
            <div className="mt-8 p-4 bg-gradient-to-r from-solar-blue/10 to-solar-green/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso do Projeto</span>
                <span className="text-sm font-semibold text-gray-900" data-testid="text-progress-percentage">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-solar-blue to-solar-green h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2" data-testid="text-progress-text">
                {completedItems} de {totalItems} itens concluídos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Project Form Modal */}
        {showEditForm && (
          <EditProjectForm
            project={project}
            onClose={() => setShowEditForm(false)}
            onProjectUpdated={handleProjectUpdated}
          />
        )}
      </div>
    </div>
  );
}
