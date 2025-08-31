import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Cog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type InsertProject } from "@shared/schema";

interface NewProjectFormProps {
  onClose: () => void;
  onProjectCreated: () => void;
}

export function NewProjectForm({ onClose, onProjectCreated }: NewProjectFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      roofType: "ceramico" as const,
      inverterPower: "",
      solarPanelsCount: 1,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Projeto criado com sucesso! Checklist gerado automaticamente.",
      });
      onProjectCreated();
    },
    onError: (error: any) => {
      console.error("Error creating project:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o projeto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  return (
    <div className="mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Novo Projeto Solar</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-form"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Projeto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Projeto Residencial - João Silva"
                          {...field}
                          data-testid="input-project-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Nome identificativo do projeto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço da Instalação</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Rua das Flores, 123, Centro"
                            {...field}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormDescription>
                          Local onde será feita a instalação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Cliente</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: (11) 99999-9999"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          Contato para agendamentos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="solarPanelsCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Painéis Desejada *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="200"
                            placeholder="Ex: 20"
                            {...field}
                            onChange={(e) => {
                              const count = parseInt(e.target.value) || 1;
                              field.onChange(count);
                              // Auto-calculate recommended inverter power (minimum 3kW)
                              const calculatedPower = count * 0.55 * 0.8; // 550W panels, 80% efficiency
                              const recommendedPower = Math.max(calculatedPower, 3.0).toFixed(1); // Minimum 3kW
                              form.setValue("inverterPower", recommendedPower);
                            }}
                            data-testid="input-solar-panels"
                          />
                        </FormControl>
                        <FormDescription>
                          Número total de módulos fotovoltaicos (começar por aqui)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inverterPower"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potência do Inversor (kW) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="3.0"
                            max="100"
                            placeholder="Mínimo 3.0 kW"
                            {...field}
                            data-testid="input-inverter-power"
                          />
                        </FormControl>
                        <FormDescription>
                          Potência calculada automaticamente (mínimo 3kW)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="inverterBrand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca do Inversor</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Growatt, Fronius, SMA"
                            {...field}
                            data-testid="input-inverter-brand"
                          />
                        </FormControl>
                        <FormDescription>
                          Marca/modelo do inversor utilizado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instalador Responsável</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do técnico instalador"
                            {...field}
                            data-testid="input-installer"
                          />
                        </FormControl>
                        <FormDescription>
                          Profissional que fará a instalação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="installationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Instalação</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value && field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                          data-testid="input-installation-date"
                        />
                      </FormControl>
                      <FormDescription>
                        Data prevista para realizar a instalação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Instalação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} data-testid="select-roof-type">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de instalação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ceramico">Telhado Cerâmico</SelectItem>
                          <SelectItem value="metalico">Telhado Metálico</SelectItem>
                          <SelectItem value="fibrocimento">Telhado Fibrocimento</SelectItem>
                          <SelectItem value="solo">Instalação no Solo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipo de estrutura onde será instalado o sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seção Plataforma do Inversor */}
                <div className="space-y-4 mt-8">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm text-blue-600 font-bold">🔐</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Acesso à Plataforma</h3>
                    <span className="text-sm text-gray-500">(Credenciais para monitoramento)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="platformLogin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login/Usuário</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="usuário@email.com"
                              {...field}
                              data-testid="input-platform-login"
                            />
                          </FormControl>
                          <FormDescription>
                            Login para acessar a plataforma do inversor
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platformPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Senha da plataforma"
                              {...field}
                              data-testid="input-platform-password"
                            />
                          </FormControl>
                          <FormDescription>
                            Senha para monitoramento online
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="platformUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da Plataforma</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="app.solis.com, portal.growatt.com, etc."
                            {...field}
                            data-testid="input-platform-url"
                          />
                        </FormControl>
                        <FormDescription>
                          Site ou app para monitoramento do inversor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platformNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Instruções especiais ou informações adicionais sobre o acesso à plataforma"
                            {...field}
                            data-testid="input-platform-notes"
                          />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais sobre configuração ou acesso
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="bg-solar-blue hover:bg-blue-700"
                  data-testid="button-generate-checklist"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Cog className="w-4 h-4 mr-2" />
                      Gerar Checklist
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
