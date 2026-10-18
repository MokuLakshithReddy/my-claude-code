import { BaseTool } from "./base.js";

export class WebFetchTool extends BaseTool {
  name = "WebFetch";
  description = "Fetches the text content of a public URL. Use this to read online API documentation, library reference manuals, or GitHub READMEs.";
  parameters = {
    type: "object" as const,
    properties: {
      url: {
        type: "string",
        description: "The full HTTP/HTTPS URL to fetch"
      }
    },
    required: ["url"]
  };

  async execute(args: { url: string }): Promise<string> {
    try {
      const response = await fetch(args.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ClaudeCode/1.0"
        }
      });

      if (!response.ok) {
        return `HTTP error ${response.status}: ${response.statusText}`;
      }

      const raw = await response.text();

      // Clean HTML tags and scripts
      const cleaned = raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();

      const MAX_LENGTH = 8000;
      if (cleaned.length > MAX_LENGTH) {
        return cleaned.slice(0, MAX_LENGTH) + `\n\n[... content truncated to ${MAX_LENGTH} characters]`;
      }

      return cleaned || "(No readable text found on page)";
    } catch (err: any) {
      return `Failed to fetch URL ${args.url}: ${err.message}`;
    }
  }
}
