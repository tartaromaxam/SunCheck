import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type Project } from "@shared/schema";
import { z } from "zod";

interface EditProjectFormProps {
  project: Project;
  onClose: () => void;
  onProjectUpdated: () => void;
}

export function EditProjectForm({ project, onClose, onProjectUpdated }: EditProjectFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateSchema = z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    phone: z.string().optional(),
    inverterPower: z.string(),
    inverterBrand: z.string().optional(),
    solarPanelsCount: z.string(),
    installationDate: z.string().optional(),
    installer: z.string().optional(),
    roofType: z.enum(["ceramico", "metalico", "fibrocimento", "solo"]),
    status: z.enum(["planejamento", "em_andamento", "concluido"]),
  });

  const form = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: project.name,
      address: project.address || "",
      phone: project.phone || "",
      inverterPower: project.inverterPower,
      inverterBrand: project.inverterBrand || "",
      solarPanelsCount: project.solarPanelsCount.toString(),
      installationDate: project.installationDate ? new Date(project.installationDate).toISOString().split('T')[0] : "",
      installer: project.installer || "",
      roofType: project.roofType,
      status: project.status,
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/projects/${project.id}`, {
        ...data,
        solarPanelsCount: parseInt(data.solarPanelsCount),
      });
    },
    onSuccess: () => {
      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso!",
      });
      onProjectUpdated();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    updateProjectMutation.mutate(data);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Editar Projeto</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-edit">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="inverterPower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potência do Inversor (kW)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.1" 
                          min="3"
                          data-testid="input-edit-inverter-power" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inverterBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca do Inversor</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-inverter-brand" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="solarPanelsCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Painéis</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          data-testid="input-edit-panels-count" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Instalação</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          data-testid="input-edit-installation-date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="installer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instalador Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-installer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roofType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Instalação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-roof-type">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ceramico">Telhado Cerâmico</SelectItem>
                        <SelectItem value="metalico">Telhado Metálico</SelectItem>
                        <SelectItem value="fibrocimento">Telhado Fibrocimento</SelectItem>
                        <SelectItem value="solo">Instalação no Solo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção Plataforma do Inversor */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm text-blue-600 font-bold">🔐</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Acesso à Plataforma</h3>
                  <span className="text-sm text-gray-500">(Credenciais para monitoramento)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            data-testid="input-platform-login-edit"
                          />
                        </FormControl>
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
                            data-testid="input-platform-password-edit"
                          />
                        </FormControl>
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
                          data-testid="input-platform-url-edit"
                        />
                      </FormControl>
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
                          data-testid="input-platform-notes-edit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-edit">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-solar-blue hover:bg-blue-700"
                  data-testid="button-save-edit"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}