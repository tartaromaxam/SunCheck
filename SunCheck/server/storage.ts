import { projects, checklistItems, type Project, type InsertProject, type ChecklistItem, type InsertChecklistItem, type UpdateChecklistItem, type ProjectWithItems } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectWithItems(id: number): Promise<ProjectWithItems | undefined>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<void>;
  updateProjectStatus(id: number, status: string): Promise<void>;
  deleteProject(id: number): Promise<void>;
  
  // Checklist Items
  createChecklistItems(items: InsertChecklistItem[]): Promise<ChecklistItem[]>;
  updateChecklistItem(id: number, updates: UpdateChecklistItem): Promise<ChecklistItem | undefined>;
  getChecklistItemsByProject(projectId: number): Promise<ChecklistItem[]>;
  deleteChecklistItemsByProject(projectId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectWithItems(id: number): Promise<ProjectWithItems | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    
    if (!project) return undefined;

    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.projectId, id));

    return { ...project, checklistItems: items };
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<void> {
    await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id));
  }

  async updateProjectStatus(id: number, status: string): Promise<void> {
    await db
      .update(projects)
      .set({ status })
      .where(eq(projects.id, id));
  }

  async deleteProject(id: number): Promise<void> {
    // Items will be deleted automatically due to CASCADE
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Checklist Items
  async createChecklistItems(items: InsertChecklistItem[]): Promise<ChecklistItem[]> {
    return await db
      .insert(checklistItems)
      .values(items)
      .returning();
  }

  async updateChecklistItem(id: number, updates: UpdateChecklistItem): Promise<ChecklistItem | undefined> {
    const [item] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, id))
      .returning();
    return item || undefined;
  }

  async getChecklistItemsByProject(projectId: number): Promise<ChecklistItem[]> {
    return await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.projectId, projectId));
  }

  async deleteChecklistItemsByProject(projectId: number): Promise<void> {
    await db.delete(checklistItems).where(eq(checklistItems.projectId, projectId));
  }
}

export const storage = new DatabaseStorage();
