import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProjectAnalysis {
  efficiency_score: number;
  recommendations: string[];
  cost_optimization: string;
  installation_tips: string[];
}

export async function analyzeProject(
  panelCount: number,
  inverterPower: number,
  roofType: string,
  stringConfig: string
): Promise<ProjectAnalysis> {
  try {
    const systemPrompt = `Você é um especialista em instalações solares fotovoltaicas. 
Analise o projeto e forneça uma análise técnica profissional.
Responda em JSON no formato:
{
  "efficiency_score": number (0-100),
  "recommendations": ["recomendação1", "recomendação2"],
  "cost_optimization": "dica de otimização de custos",
  "installation_tips": ["dica1", "dica2", "dica3"]
}`;

    const projectDetails = `
Projeto Solar:
- Painéis: ${panelCount} unidades (550W cada)
- Inversor: ${inverterPower}kW
- Tipo de instalação: ${roofType}
- Configuração: ${stringConfig}
- Potência total estimada: ${(panelCount * 0.55).toFixed(2)}kW
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            efficiency_score: { type: "number" },
            recommendations: { 
              type: "array",
              items: { type: "string" }
            },
            cost_optimization: { type: "string" },
            installation_tips: {
              type: "array", 
              items: { type: "string" }
            }
          },
          required: ["efficiency_score", "recommendations", "cost_optimization", "installation_tips"]
        }
      },
      contents: projectDetails,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      
      // Ensure arrays exist and are valid
      const validatedAnalysis: ProjectAnalysis = {
        efficiency_score: typeof data.efficiency_score === 'number' ? data.efficiency_score : 75,
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        cost_optimization: typeof data.cost_optimization === 'string' ? data.cost_optimization : "Nenhuma otimização específica identificada.",
        installation_tips: Array.isArray(data.installation_tips) ? data.installation_tips : []
      };
      
      return validatedAnalysis;
    } else {
      throw new Error("Resposta vazia do modelo");
    }
  } catch (error) {
    console.error("Erro na análise do projeto:", error);
    // Fallback analysis
    return {
      efficiency_score: 85,
      recommendations: [
        "Verifique o dimensionamento do inversor",
        "Considere a orientação solar ideal",
        "Avalie a estrutura do telhado"
      ],
      cost_optimization: "Análise indisponível no momento",
      installation_tips: [
        "Verifique as condições climáticas",
        "Mantenha ferramentas organizadas",
        "Teste todas as conexões"
      ]
    };
  }
}

export async function generateInstallationReport(
  projectName: string,
  analysis: ProjectAnalysis,
  panelCount: number,
  inverterPower: number
): Promise<string> {
  try {
    const prompt = `Gere um relatório técnico profissional para instalação solar:

Projeto: ${projectName}
Painéis: ${panelCount} unidades
Inversor: ${inverterPower}kW
Score de Eficiência: ${analysis.efficiency_score}/100

Recomendações: ${analysis.recommendations.join(', ')}
Dicas de Instalação: ${analysis.installation_tips.join(', ')}

Crie um relatório em português, profissional e técnico, com seções organizadas.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return response.text || "Relatório não pôde ser gerado";
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return `Relatório Técnico - ${projectName}

RESUMO DO PROJETO
- Painéis Solares: ${panelCount} unidades (550W cada)
- Inversor: ${inverterPower}kW
- Score de Eficiência: ${analysis.efficiency_score}/100

RECOMENDAÇÕES TÉCNICAS
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}

DICAS DE INSTALAÇÃO
${analysis.installation_tips.map(tip => `• ${tip}`).join('\n')}

OTIMIZAÇÃO DE CUSTOS
${analysis.cost_optimization}`;
  }
}