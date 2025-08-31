import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertChecklistItemSchema, updateChecklistItemSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeProject, generateInstallationReport } from "./gemini";

// Professional solar installation checklist generator
function generateChecklistItems(projectData: any) {
  const { roofType, inverterPower, solarPanelsCount } = projectData;
  const power = parseFloat(inverterPower);
  
  // Technical calculations based on professional standards
  const panelPower = 550; // Watts per panel (assuming 550W panels)
  const totalPanelPower = (solarPanelsCount * panelPower) / 1000; // kW
  
  // Minimum inverter power is 3kW
  const minimumInverterPower = 3.0;
  const adjustedPower = Math.max(power, minimumInverterPower);
  
  // String configuration: 2x2 or 3x3 only
  let stringConfig = "2x2"; // Default
  let numberOfStrings = 2;
  let panelsPerString = Math.ceil(solarPanelsCount / 2);
  
  if (solarPanelsCount > 8) {
    stringConfig = "3x3";
    numberOfStrings = 3;
    panelsPerString = Math.ceil(solarPanelsCount / 3);
  }
  
  const stringCurrent = panelPower / 40; // Approximate current per string (Voc = 40V)
  
  const items = [];

  // Segurança (Safety Items)
  items.push(
    {
      title: "Sistema de Aterramento Equipotencial",
      description: `Hastes cobreadas 2,4m (${Math.ceil(numberOfStrings * 0.5)} un), cabo nu 16mm² (${Math.ceil(solarPanelsCount * 2)}m), conectores de aterramento`,
      category: "seguranca"
    }
  );

  // Cálculos técnicos para materiais elétricos
  const ccCableLength = Math.ceil(solarPanelsCount * 4.5); // 4.5m per panel average
  const caCableLength = Math.ceil(adjustedPower * 2.5 + 10); // Distance estimate based on power + reserve
  const mc4Connectors = Math.max(3, Math.ceil(numberOfStrings + 1)); // Mínimo 3 pares: 1 no telhado + 2 no inversor
  
  // Cabo CA sempre 6mm² no mínimo
  const caCableSection = "6mm²";
  
  // Disjuntores sempre entre 32A e 50A
  let breakerCurrent = 32; // Padrão mínimo
  if (adjustedPower > 5) breakerCurrent = 40;
  if (adjustedPower > 8) breakerCurrent = 50;

  items.push(
    {
      title: `Cabo Solar CC 6mm² (${ccCableLength}m)`,
      description: `${Math.ceil(ccCableLength/2)}m vermelho + ${Math.ceil(ccCableLength/2)}m preto, cabo solar 6mm² dupla isolação para configuração ${stringConfig}`,
      category: "materiais_eletricos"
    },
    {
      title: `Conectores MC4 (${mc4Connectors} pares)`,
      description: `Conectores MC4 originais: 1 par no telhado (interligação strings) + 2 pares no inversor (entrada CC)`,
      category: "materiais_eletricos"
    },
    {
      title: `String Box CC ${numberOfStrings}x1`,
      description: `Caixa de proteção CC para configuração ${stringConfig}, fusíveis ${Math.ceil(stringCurrent * 1.25)}A, DPS CC Tipo II`,
      category: "materiais_eletricos"
    },
    {
      title: `Cabo CA ${caCableSection} (${caCableLength}m)`,
      description: `Cabo multipolar ${caCableSection} para ${adjustedPower}kW (mínimo 3kW), isolação 0,6/1kV, conexão inversor-quadro CA`,
      category: "materiais_eletricos"
    },
    {
      title: `Disjuntor CA ${breakerCurrent}A`,
      description: `Disjuntor tripolar ${breakerCurrent}A (padrão ${breakerCurrent}A), curva C, 6kA, para proteção do circuito CA`,
      category: "materiais_eletricos"
    },
    {
      title: "DPS CA Classe II",
      description: `Dispositivo de proteção contra surtos CA, ${adjustedPower <= 5 ? "20kA" : adjustedPower <= 15 ? "40kA" : "60kA"}, adequado para ${adjustedPower}kW`,
      category: "materiais_eletricos"
    }
  );

  // Estrutura (Structure Items)
  const structureItems = getStructureItems(roofType, solarPanelsCount, numberOfStrings);
  items.push(...structureItems);

  return items;
}

function getStructureItems(roofType: string, panelCount: number, numberOfStrings: number = 1) {
  // Cálculos técnicos de estrutura
  const panelsPerRow = Math.ceil(panelCount / numberOfStrings); // Painéis por fileira
  const railLength = Math.ceil(panelsPerRow * 2.1); // 2.1m por painel (painel = ~2m)
  const totalRailLength = railLength * numberOfStrings;
  const fixationPoints = Math.ceil(panelCount * 1.2); // 1.2 pontos de fixação por painel
  
  switch (roofType) {
    case "ceramico":
      return [
        {
          title: `Ganchos para Telha Cerâmica (${fixationPoints} un)`,
          description: `Ganchos ajustáveis em aço inox 316 para telhas cerâmicas, com vedação EPDM dupla, suporte para ${numberOfStrings} fileiras`,
          category: "estrutura"
        },
        {
          title: `Trilhos de Alumínio Anodizado (${totalRailLength}m)`,
          description: `Trilhos 40x40mm para ${numberOfStrings} strings de ${panelsPerRow} painéis, incluindo emendas, terminais e reguladores`,
          category: "estrutura"
        },
        {
          title: `Grampos de Fixação (${panelCount * 2} un)`,
          description: `${Math.ceil(panelCount * 0.2)} grampos terminais + ${Math.ceil(panelCount * 1.8)} intermediários, alumínio anodizado`,
          category: "estrutura"
        },
        {
          title: `Kit de Fixação Cerâmica (${fixationPoints} kits)`,
          description: "Parafusos M8x80, buchas S8, arruelas e vedações EPDM para fixação em estrutura cerâmica",
          category: "estrutura"
        }
      ];
    
    case "metalico":
      return [
        {
          title: `Grampos Trapezoidais (${Math.ceil(fixationPoints * 0.7)} un)`,
          description: `Grampos para telha trapezoidal/zipada, adequados para ${numberOfStrings} fileiras, com vedação dupla EPDM`,
          category: "estrutura"
        },
        {
          title: `Trilhos de Alumínio Anodizado (${totalRailLength}m)`,
          description: `Sistema de trilhos 40x40mm para estrutura metálica, ${numberOfStrings} strings, com conectores e terminais`,
          category: "estrutura"
        },
        {
          title: `Grampos de Fixação (${panelCount * 2} un)`,
          description: `Grampos terminais e intermediários para fixação de ${panelCount} painéis em ${numberOfStrings} strings`,
          category: "estrutura"
        },
        {
          title: `Parafusos Autoperfurantes (${fixationPoints * 2} un)`,
          description: "Parafusos 12x80mm com vedação EPDM, brocas adequadas para perfil metálico",
          category: "estrutura"
        }
      ];
    
    case "fibrocimento":
      return [
        {
          title: `Ganchos para Telha Fibrocimento (${fixationPoints} un)`,
          description: `Ganchos específicos para telhas de fibrocimento/Brasilit, em aço galvanizado, com vedação EPDM reforçada para ${numberOfStrings} fileiras`,
          category: "estrutura"
        },
        {
          title: `Trilhos de Alumínio Anodizado (${totalRailLength}m)`,
          description: `Sistema de trilhos 40x40mm reforçado para fibrocimento, ${numberOfStrings} strings de ${panelsPerRow} painéis, com conectores especiais`,
          category: "estrutura"
        },
        {
          title: `Grampos de Fixação (${panelCount * 2} un)`,
          description: `Grampos terminais e intermediários em alumínio anodizado, adequados para carga de vento em fibrocimento`,
          category: "estrutura"
        },
        {
          title: `Kit de Fixação Fibrocimento (${fixationPoints} kits)`,
          description: "Parafusos autoperfurantes 12x100mm, buchas especiais, arruelas metálicas e vedações EPDM duplas para telhas de fibrocimento",
          category: "estrutura"
        },
        {
          title: "Reforço Estrutural",
          description: `${Math.ceil(fixationPoints * 0.3)} perfis de reforço interno em aço galvanizado para distribuição de cargas em telhas fibrocimento`,
          category: "estrutura"
        }
      ];

    case "solo":
      const foundationPoints = Math.ceil(numberOfStrings * 2); // 2 fundações por string
      return [
        {
          title: `Estrutura Solo Fixa (${Math.ceil(panelCount / 6)} kits)`,
          description: `Sistema de estrutura fixa para solo, cada kit comporta 6 painéis, inclinação 20°, para ${numberOfStrings} strings`,
          category: "estrutura"
        },
        {
          title: `Fundações de Concreto (${foundationPoints} un)`,
          description: `Blocos de fundação 40x40x60cm ou estacas hélice contínua, adequadas para ${panelCount} painéis`,
          category: "estrutura"
        },
        {
          title: `Kit de Ancoragem (${foundationPoints} kits)`,
          description: "Chumbadores M16x200mm, porcas, arruelas e graute para fixação da estrutura nas fundações",
          category: "estrutura"
        },
        {
          title: "Sistema de Aterramento Solo",
          description: `Malha de aterramento com ${foundationPoints} hastes cobreadas interligadas, cabo nu 25mm²`,
          category: "estrutura"
        }
      ];
    
    default:
      return [];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      
      // Process date field for database
      const processedData = {
        ...validatedData,
        installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : undefined,
      };
      
      // Create project
      const project = await storage.createProject(processedData);
      
      // Generate checklist items
      const checklistData = generateChecklistItems(validatedData);
      const checklistItems = checklistData.map(item => ({
        ...item,
        projectId: project.id,
        isCompleted: 0
      }));
      
      // Save checklist items
      await storage.createChecklistItems(checklistItems);
      
      // Return project with items
      const projectWithItems = await storage.getProjectWithItems(project.id);
      
      res.json(projectWithItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Erro ao buscar projetos" });
    }
  });

  // Get project with checklist items
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const project = await storage.getProjectWithItems(id);
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Erro ao buscar projeto" });
    }
  });

  // Update checklist item
  app.patch("/api/checklist-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const validatedData = updateChecklistItemSchema.parse(req.body);
      const item = await storage.updateChecklistItem(id, validatedData);
      
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.error("Error updating checklist item:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      await storage.deleteProject(id);
      res.json({ message: "Projeto deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Erro ao deletar projeto" });
    }
  });

  // Update project status
  app.patch("/api/projects/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const { status } = req.body;
      if (!["planejamento", "em_andamento", "concluido"].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      await storage.updateProjectStatus(id, status);
      res.json({ message: "Status atualizado com sucesso" });
    } catch (error) {
      console.error("Error updating project status:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const updateSchema = z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        inverterPower: z.string(),
        inverterBrand: z.string().optional(),
        solarPanelsCount: z.number(),
        installationDate: z.string().optional(),
        installer: z.string().optional(),
        roofType: z.enum(["ceramico", "metalico", "fibrocimento", "solo"]),
        status: z.enum(["planejamento", "em_andamento", "concluido"]),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Process date field for database
      const processedData = {
        ...validatedData,
        installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : undefined,
      };
      
      await storage.updateProject(id, processedData);
      
      const project = await storage.getProjectWithItems(id);
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Analyze project with Gemini AI
  app.post("/api/projects/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      // Determine string configuration
      let stringConfig = "2x2";
      if (project.solarPanelsCount > 8) {
        stringConfig = "3x3";
      }
      
      const analysis = await analyzeProject(
        project.solarPanelsCount,
        parseFloat(project.inverterPower),
        project.roofType,
        stringConfig
      );
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing project:", error);
      res.status(500).json({ message: "Erro ao analisar projeto" });
    }
  });

  // Generate project report with Gemini AI
  app.post("/api/projects/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      // Determine string configuration
      let stringConfig = "2x2";
      if (project.solarPanelsCount > 8) {
        stringConfig = "3x3";
      }
      
      // First get analysis
      const analysis = await analyzeProject(
        project.solarPanelsCount,
        parseFloat(project.inverterPower),
        project.roofType,
        stringConfig
      );
      
      // Then generate report
      const report = await generateInstallationReport(
        project.name,
        analysis,
        project.solarPanelsCount,
        parseFloat(project.inverterPower)
      );
      
      res.json({ report });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
