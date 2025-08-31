import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle2, Zap } from "lucide-react";
import type { Project } from "@shared/schema";

interface StatsCardsProps {
  projects: Project[];
}

export function StatsCards({ projects }: StatsCardsProps) {
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === "concluido").length;
  const inProgressProjects = projects.filter(p => p.status === "em_andamento").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-solar-blue/10 rounded-lg flex items-center justify-center">
              <Activity className="text-solar-blue text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total de Projetos</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-projects">
                {totalProjects}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-solar-green/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-solar-green text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Projetos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="stat-completed-projects">
                {completedProjects}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-solar-orange/10 rounded-lg flex items-center justify-center">
              <Zap className="text-solar-orange text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="stat-in-progress-projects">
                {inProgressProjects}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
