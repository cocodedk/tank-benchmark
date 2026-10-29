const BUILDER = 'DeepSeek V4.1 Flash';
const MODEL = 'deepseek/deepseek-v4.1-flash-1017';

/** Write the builder's line: who made this page and with which model. */
export function sign(doc = document) {
  const line = doc.getElementById('signature');
  if (line) line.textContent = `Built by ${BUILDER} · ${MODEL} · pi on OpenRouter`;
}
