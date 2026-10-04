import { z } from "zod";

const importNodeSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  name: z.string().min(1).max(255),
  type: z.enum(["file", "folder"]),
  language: z.string().optional(),
  encoding: z.string().optional(),
  content: z.string().optional(),
  locked: z.boolean().optional(),
  encryptionSalt: z.string().nullable().optional(),
  encryptionIv: z.string().nullable().optional(),
});

export const importWorkspaceSchema = z.object({
  nodes: z.array(importNodeSchema).max(20000),
});

export const createFileSchema = z.object({
  parentId: z.string().nullable(),
  name: z.string().min(1).max(255),
  content: z.string().default(""),
  language: z.string().optional(),
  encoding: z.string().optional(),
});

export const updateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().nullable().optional(),
  content: z.string().optional(),
  language: z.string().optional(),
  encoding: z.string().optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
  encryptionSalt: z.string().nullable().optional(),
  encryptionIv: z.string().nullable().optional(),
});

export const createFolderSchema = z.object({
  parentId: z.string().nullable(),
  name: z.string().min(1).max(255),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().nullable().optional(),
  collapsed: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  theme: z.string().min(1).optional(),
  json: z
    .string()
    .min(1)
    .refine((v) => {
      try {
        const parsed = JSON.parse(v);
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    }, "Must be a JSON object")
    .optional(),
  recentFiles: z
    .array(z.object({ fileId: z.string(), openedAt: z.number() }))
    .max(100)
    .optional(),
  favorites: z.array(z.string()).max(1000).optional(),
});

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).nullable().optional(),
});
