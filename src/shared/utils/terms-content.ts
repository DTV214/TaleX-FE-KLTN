const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const ORDERED_LIST_PATTERN = /^\d+[.)]\s+/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>");
}

function flushList(
  html: string[],
  listItems: string[],
  listType: "ul" | "ol" | null,
) {
  if (!listType || listItems.length === 0) {
    return;
  }

  html.push(`<${listType}>${listItems.join("")}</${listType}>`);
  listItems.length = 0;
}

export function renderTermsContent(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    return "";
  }

  if (HTML_TAG_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const html: string[] = [];
  const listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  trimmed.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(html, listItems, listType);
      listType = null;
      return;
    }

    if (line.startsWith("### ")) {
      flushList(html, listItems, listType);
      listType = null;
      html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      return;
    }

    if (line.startsWith("## ")) {
      flushList(html, listItems, listType);
      listType = null;
      html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith("# ")) {
      flushList(html, listItems, listType);
      listType = null;
      html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      return;
    }

    if (line.startsWith("> ")) {
      flushList(html, listItems, listType);
      listType = null;
      html.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
      return;
    }

    if (line.startsWith("- ")) {
      if (listType !== "ul") {
        flushList(html, listItems, listType);
        listType = "ul";
      }
      listItems.push(`<li>${formatInline(line.slice(2))}</li>`);
      return;
    }

    if (ORDERED_LIST_PATTERN.test(line)) {
      if (listType !== "ol") {
        flushList(html, listItems, listType);
        listType = "ol";
      }
      listItems.push(`<li>${formatInline(line.replace(ORDERED_LIST_PATTERN, ""))}</li>`);
      return;
    }

    flushList(html, listItems, listType);
    listType = null;
    html.push(`<p>${formatInline(line)}</p>`);
  });

  flushList(html, listItems, listType);

  return html.join("");
}
