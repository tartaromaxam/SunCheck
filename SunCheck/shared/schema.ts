import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Projeto Solar"),
  address: text("address"), // Endereço da instalação
  phone: varchar("phone", { length: 20 }), // Telefone do cliente
  roofType: varchar("roof_type", { length: 50 }).notNull(), // 'ceramico', 'metalico', 'fibrocimento', 'solo'
  inverterPower: decimal("inverter_power", { precision: 5, scale: 2 }).notNull(), // Potência em kW
  inverterBrand: varchar("inverter_brand", { length: 100 }), // Marca do inversor
  solarPanelsCount: integer("solar_panels_count").notNull(), // Número de placas
  installationDate: timestamp("installation_date"), // Data prevista/realizada da instalação
  installer: varchar("installer", { length: 100 }), // Nome do instalador responsável
  platformLogin: varchar("platform_login", { length: 100 }), // Login da plataforma do inversor
  platformPassword: varchar("platform_password", { length: 100 }), // Senha da plataforma do inversor
  platformUrl: varchar("platform_url", { length: 200 }), // URL da plataforma (ex: app.solis.com)
  platformNotes: text("platform_notes"), // Observações sobre acesso à plataforma
  status: varchar("status", { length: 20 }).notNull().default("planejamento"), // 'planejamento', 'em_andamento', 'concluido'
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 200 }).notNull(), // Título da tarefa
  description: text("description"), // Descrição gerada pela IA
  category: varchar("category", { length: 50 }).notNull(), // 'seguranca', 'materiais_eletricos', 'estrutura'
  isCompleted: integer("is_completed").notNull().default(0), // 0 = false, 1 = true (SQLite compatibility)
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  checklistItems: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  project: one(projects, {
    fields: [checklistItems.projectId],
    references: [projects.id],
  }),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  address: z.string().optional(),
  phone: z.string().optional(),
  roofType: z.enum(["ceramico", "metalico", "fibrocimento", "solo"], {
    required_error: "Tipo de instalação é obrigatório",
  }),
  inverterPower: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 3.0 && num <= 100;
  }, "Potência deve ser entre 3.0 e 100 kW (mínimo 3kW)"),
  inverterBrand: z.string().optional(),
  solarPanelsCount: z.number().min(1, "Número de painéis deve ser pelo menos 1").max(200, "Máximo de 200 painéis"),
  installationDate: z.union([z.string(), z.date()]).optional(),
  installer: z.string().optional(),
  platformLogin: z.string().optional(),
  platformPassword: z.string().optional(),
  platformUrl: z.string().optional(),
  platformNotes: z.string().optional(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
  createdAt: true,
});

export const updateChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
  projectId: true,
  createdAt: true,
}).partial();

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type UpdateChecklistItem = z.infer<typeof updateChecklistItemSchema>;

// Types with relations
export type ProjectWithItems = Project & {
  checklistItems: ChecklistItem[];
};
