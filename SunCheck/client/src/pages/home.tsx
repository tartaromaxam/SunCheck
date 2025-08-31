import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewProjectForm } from "@/components/new-project-form";
import { ProjectsList } from "@/components/projects-list";
import { StatsCards } from "@/components/stats-cards";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

export default function Home() {
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const handleProjectCreated = () => {
    setShowNewProjectForm(false);
    refetch();
  };

  const { toast } = useToast();

  const handleExportAllProjects = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO GERAL DE PROJETOS SOLARES', 20, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 45);
      
      // Statistics
      const completedProjects = projects.filter(p => p.status === 'concluido').length;
      const inProgressProjects = projects.filter(p => p.status === 'em_andamento').length;
      const planningProjects = projects.filter(p => p.status === 'planejamento').length;
      const totalPower = projects.reduce((sum, p) => sum + parseFloat(p.inverterPower), 0);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTATÍSTICAS GERAIS', 20, 65);
      
      const statsData = [
        ['Total de Projetos', projects.length.toString()],
        ['Projetos Concluídos', completedProjects.toString()],
        ['Projetos em Andamento', inProgressProjects.toString()],
        ['Projetos em Planejamento', planningProjects.toString()],
        ['Potência Total Instalada', `${totalPower.toFixed(2)} kW`]
      ];
      
      autoTable(doc, {
        startY: 75,
        head: [['Métrica', 'Valor']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 }
      });
      
      let yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Projects list
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LISTA DE PROJETOS', 20, yPosition);
      yPosition += 10;
      
      const getRoofTypeLabel = (roofType: string) => {
        const labels = {
          ceramico: "Cerâmico",
          metalico: "Metálico", 
          fibrocimento: "Fibrocimento",
          solo: "Solo"
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
      
      const projectsData = projects.map(project => [
        project.name,
        `${project.inverterPower} kW`,
        `${project.solarPanelsCount} painéis`,
        getRoofTypeLabel(project.roofType),
        getStatusLabel(project.status),
        project.address || 'Não informado'
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Projeto', 'Inversor', 'Painéis', 'Instalação', 'Status', 'Endereço']],
        body: projectsData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 50 }
        },
        margin: { left: 20, right: 20 }
      });
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${pageCount}`, 
                  doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 20);
      }
      
      doc.save(`relatorio-geral-projetos-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Relatório Exportado",
        description: `Relatório de ${projects.length} projetos exportado com sucesso!`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-solar-blue to-solar-orange rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Solar Project Manager</h1>
                <p className="text-sm text-gray-500">Gerador de Checklist Inteligente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportAllProjects}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                data-testid="button-export-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-notifications">
                <Bell className="h-5 w-5 text-gray-500" />
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Dashboard */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Projetos Solares</h2>
              <p className="text-gray-600 mt-1">Gerencie seus projetos e checklists de instalação</p>
            </div>
            <Button 
              onClick={() => setShowNewProjectForm(true)}
              className="mt-4 sm:mt-0 bg-solar-blue hover:bg-blue-700"
              data-testid="button-new-project"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>

          <StatsCards projects={projects} />
        </div>

        {/* New Project Form */}
        {showNewProjectForm && (
          <NewProjectForm
            onClose={() => setShowNewProjectForm(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}

        {/* Projects List */}
        <ProjectsList projects={projects} isLoading={isLoading} />
      </div>
    </div>
  );
}
