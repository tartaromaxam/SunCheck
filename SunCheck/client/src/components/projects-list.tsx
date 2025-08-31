import { Link } from "wouter";
import { ChevronRight, Zap, Home, Mountain, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@shared/schema";

interface ProjectsListProps {
  projects: Project[];
  isLoading: boolean;
}

export function ProjectsList({ projects, isLoading }: ProjectsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projetos Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoofTypeIcon = (roofType: string) => {
    switch (roofType) {
      case "ceramico":
        return <Home className="w-5 h-5 text-solar-blue" />;
      case "metalico":
        return <Building2 className="w-5 h-5 text-solar-blue" />;
      case "solo":
        return <Mountain className="w-5 h-5 text-solar-blue" />;
      default:
        return <Home className="w-5 h-5 text-solar-blue" />;
    }
  };

  const getRoofTypeLabel = (roofType: string) => {
    const labels = {
      ceramico: "Cerâmico",
      metalico: "Metálico",
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "concluido": 
        return "default";
      case "em_andamento": 
        return "secondary";
      case "planejamento": 
        return "outline";
      default: 
        return "outline";
    }
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projetos Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-500 mb-4">Comece criando seu primeiro projeto solar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos Existentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`} asChild>
              <div 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                data-testid={`project-item-${project.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-solar-blue/10 rounded-lg flex items-center justify-center">
                        {getRoofTypeIcon(project.roofType)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900" data-testid={`project-name-${project.id}`}>
                          {project.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Zap className="w-3 h-3 text-solar-orange mr-1" />
                            <span data-testid={`project-power-${project.id}`}>{project.inverterPower}</span> kW
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 text-solar-blue mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                            <span data-testid={`project-panels-${project.id}`}>{project.solarPanelsCount}</span> painéis
                          </span>
                          <span className="flex items-center">
                            {getRoofTypeIcon(project.roofType)}
                            <span className="ml-1" data-testid={`project-roof-${project.id}`}>
                              {getRoofTypeLabel(project.roofType)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={getStatusBadgeVariant(project.status)}
                      data-testid={`project-status-${project.id}`}
                    >
                      {getStatusLabel(project.status)}
                    </Badge>
                    <Button variant="ghost" size="sm" data-testid={`button-view-project-${project.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
