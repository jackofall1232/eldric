export class DialogueTree {
  constructor(nodes) { this.nodes = new Map(Object.entries(nodes)); }
  line(id, context = {}) { const node = this.nodes.get(id); if (!node) return null; const variants = node.variants ?? []; const variant = variants.find((candidate) => !candidate.when || candidate.when(context)); return { text: variant?.text ?? node.text, next: variant?.next ?? node.next ?? null, choices: node.choices ?? [] }; }
}
