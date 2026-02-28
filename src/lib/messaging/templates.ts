import "server-only";

import { db } from "@/lib/db";
import { messageTemplates } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Minimal Markdown → HTML converter.
 * Handles: # h1, ## h2, ### h3, **bold**, *italic*, [text](url), paragraphs, line breaks.
 */
function markdownToHtml(md: string): string {
  const paragraphs = md.split(/\n{2,}/);

  const converted = paragraphs.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    // Headings (must be first line of block)
    const lines = trimmed.split("\n");
    const processedLines = lines.map((line) => {
      const h3 = line.match(/^###\s+(.*)/);
      if (h3) return `<h3>${inlineMarkdown(h3[1])}</h3>`;
      const h2 = line.match(/^##\s+(.*)/);
      if (h2) return `<h2>${inlineMarkdown(h2[1])}</h2>`;
      const h1 = line.match(/^#\s+(.*)/);
      if (h1) return `<h1>${inlineMarkdown(h1[1])}</h1>`;
      const li = line.match(/^[-*]\s+(.*)/);
      if (li) return `<li>${inlineMarkdown(li[1])}</li>`;
      return inlineMarkdown(line);
    });

    // Wrap consecutive <li> in <ul>
    const joined = processedLines.join("\n");
    const withUl = joined.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

    // If block starts with a heading tag, return as-is
    if (/^<h[123]>/.test(withUl) || /^<ul>/.test(withUl)) {
      return withUl;
    }

    return `<p>${withUl.replace(/\n/g, "<br>")}</p>`;
  });

  return converted.filter(Boolean).join("\n");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

export interface RenderTemplateOptions {
  text: string;
  variables: Record<string, string>;
}

/** Substitutes {{var}} tokens and converts Markdown to HTML. */
export function renderTemplate({ text, variables }: RenderTemplateOptions): {
  html: string;
  plain: string;
} {
  const substituted = text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = variables[key];
    return val !== undefined ? escapeHtml(val) : `{{${key}}}`;
  });

  return {
    html: markdownToHtml(substituted),
    plain: substituted,
  };
}

/** Same substitution on a short string (e.g. email subject). */
export function renderSubject(
  subject: string,
  variables: Record<string, string>
): string {
  return subject.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

// ---------------------------------------------------------------------------
// Template resolution: agency override → platform fallback → throw
// ---------------------------------------------------------------------------

export interface ResolvedTemplate {
  id: string;
  key: string;
  channel: string;
  subject: string;
  body: string;
  scope: "platform" | "agency";
  agencyId: string | null;
}

export async function resolveEmailTemplate({
  templateKey,
  agencyId,
}: {
  templateKey: string;
  agencyId?: string;
}): Promise<ResolvedTemplate> {
  // 1. Try agency override first
  if (agencyId) {
    const override = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.key, templateKey),
        eq(messageTemplates.channel, "email"),
        eq(messageTemplates.agencyId, agencyId),
        eq(messageTemplates.isActive, true)
      ),
    });

    if (override) {
      return {
        id: override.id,
        key: override.key,
        channel: override.channel,
        subject: override.subject,
        body: override.body,
        scope: override.scope as "platform" | "agency",
        agencyId: override.agencyId,
      };
    }
  }

  // 2. Fall back to platform template (agency_id IS NULL)
  const platform = await db.query.messageTemplates.findFirst({
    where: and(
      eq(messageTemplates.key, templateKey),
      eq(messageTemplates.channel, "email"),
      isNull(messageTemplates.agencyId),
      eq(messageTemplates.isActive, true)
    ),
  });

  if (!platform) {
    throw new Error(`Email template not found: ${templateKey}`);
  }

  return {
    id: platform.id,
    key: platform.key,
    channel: platform.channel,
    subject: platform.subject,
    body: platform.body,
    scope: platform.scope as "platform" | "agency",
    agencyId: platform.agencyId,
  };
}
