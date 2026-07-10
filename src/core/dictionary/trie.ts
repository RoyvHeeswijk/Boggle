interface TrieNode {
  children: Map<string, TrieNode>;
  isWord: boolean;
}

export class Trie {
  private root: TrieNode = { children: new Map(), isWord: false };

  insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, { children: new Map(), isWord: false });
      }
      node = node.children.get(char)!;
    }
    node.isWord = true;
  }

  has(word: string): boolean {
    const node = this.traverse(word);
    return node?.isWord ?? false;
  }

  hasPrefix(prefix: string): boolean {
    return this.traverse(prefix) !== null;
  }

  private traverse(str: string): TrieNode | null {
    let node = this.root;
    for (const char of str) {
      if (!node.children.has(char)) return null;
      node = node.children.get(char)!;
    }
    return node;
  }

  static fromWords(words: string[]): Trie {
    const trie = new Trie();
    for (const word of words) {
      trie.insert(word);
    }
    return trie;
  }
}

export function normalizeWord(raw: string): string | null {
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

  if (normalized.length < 3) return null;
  return normalized;
}

export function isValidDictionaryWord(word: string): boolean {
  return /^[a-z]{3,}$/.test(word);
}
