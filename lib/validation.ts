import { z } from 'zod';

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Use uma URL http(s) válida')
  .transform((v) => v || null);

export const appSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Use apenas letras minúsculas, números e hífen'),
  publisher: z.string().trim().min(2, 'Informe o publicador').max(80),
  shortDescription: z.string().trim().min(10, 'Mínimo de 10 caracteres').max(160, 'Máximo de 160 caracteres'),
  description: z.string().trim().min(20, 'Mínimo de 20 caracteres').max(20000),
  categoryId: z.string().trim().max(40).transform((v) => v || null),
  website: optionalUrl,
  tags: z.string().trim().max(300),
  itomPackageId: z
    .string()
    .trim()
    .regex(/^\d*$/, 'Somente números')
    .transform((v) => (v ? Number(v) : null)),
  featured: z.boolean(),
  published: z.boolean(),
});

export const versionSchema = z.object({
  appId: z.string().min(1),
  tempId: z.string().uuid('Envie o arquivo do instalador'),
  version: z
    .string()
    .trim()
    .min(1, 'Informe a versão')
    .max(40)
    .regex(/^[0-9A-Za-z.\-+_]+$/, 'Formato inválido (ex.: 1.4.2)'),
  platform: z.string().trim().min(1).max(30),
  changelog: z.string().trim().max(10000),
});

export const newsSchema = z.object({
  title: z.string().trim().min(4, 'Informe o título').max(140),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Use apenas letras minúsculas, números e hífen'),
  summary: z.string().trim().min(10, 'Mínimo de 10 caracteres').max(300),
  body: z.string().trim().min(20, 'Mínimo de 20 caracteres').max(50000),
  appId: z.string().trim().max(40).transform((v) => v || null),
  published: z.boolean(),
});

export const passwordSchema = z
  .string()
  .min(10, 'A senha precisa de ao menos 10 caracteres')
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use letras e números');

export const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido').max(160);
