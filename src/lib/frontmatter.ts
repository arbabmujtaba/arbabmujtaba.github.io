/**
 * Front-matter reader shared by the browser content loader (`cms.ts`) and the
 * tests. It is deliberately a small hand-rolled parser — the content bundle
 * cannot afford a YAML library — so its limits are part of the contract with
 * the admin, which writes front-matter with `gray-matter`:
 *
 *   - scalars: booleans, null, numbers (`1`, `-0.02`, `1.7`), quoted strings
 *   - nested objects by indentation, and `- ` block sequences
 *   - flat inline arrays `[a, b]`
 *
 * It does NOT understand inline objects (`{}`), which is why the admin strips
 * empty customization groups before saving instead of writing `style: {}`.
 */

export function parseYamlValue(val: string): any {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  // Numeric values
  if (/^-?\d+(\.\d+)?$/.test(val)) return parseFloat(val);
  // Inline arrays [a, b, c]
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.slice(1, -1).split(',').map(s => {
      const t = s.trim().replace(/^['"]|['"]$/g, '');
      return parseYamlValue(t);
    });
  }
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

export function parseMarkdown(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const yamlString = match[1];
  const content = match[2];
  const data = parseYamlBlock(yamlString);

  return { data, content };
}

/**
 * Parse a YAML block supporting nested objects (indentation-based),
 * arrays with dash syntax, and scalar values.
 */
export function parseYamlBlock(yamlString: string): Record<string, any> {
  const data: Record<string, any> = {};
  const lines = yamlString.split('\n');

  // Stack tracks the current object at each indentation level
  // Each entry: { indent: number, obj: Record<string, any>, key: string | null, list: any[] | null }
  interface StackFrame {
    indent: number;
    obj: Record<string, any>;
    key: string | null;
    list: any[] | null;
    // Present on a deferred child frame created for an empty-value key. Lets a
    // deeper-indented block sequence replace the provisional nested object with
    // a real array on the owning object.
    ownerObj: Record<string, any> | null;
    ownerKey: string | null;
  }

  const stack: StackFrame[] = [{ indent: -1, obj: data, key: null, list: null, ownerObj: null, ownerKey: null }];

  function currentFrame(): StackFrame {
    return stack[stack.length - 1];
  }

  for (const line of lines) {
    // Skip empty lines
    if (line.trim() === '') continue;

    // Determine indentation level (number of leading spaces)
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const trimmed = line.trim();

    // Pop stack frames that are at the same or deeper indentation (when we go back to a shallower level)
    while (stack.length > 1 && indent <= currentFrame().indent) {
      stack.pop();
    }

    // Handle list items (lines starting with -)
    if (trimmed.startsWith('- ') || trimmed === '-') {
      const listVal = trimmed.length > 2 ? trimmed.slice(2).trim() : '';
      const frame = currentFrame();

      // If the current frame key has a list, append to it
      if (frame.list !== null) {
        if (listVal.includes(':')) {
          // Inline object in list: "- key: value"
          const colonIdx = listVal.indexOf(':');
          const subKey = listVal.slice(0, colonIdx).trim();
          let subVal = listVal.slice(colonIdx + 1).trim();
          subVal = subVal.replace(/^['"]|['"]$/g, '');
          frame.list.push({ [subKey]: parseYamlValue(subVal) });
        } else {
          frame.list.push(parseYamlValue(listVal));
        }
      } else if (frame.key) {
        // Start a new list on the frame's key (sequence at same indent as key)
        const list: any[] = [];
        if (listVal.includes(':')) {
          const colonIdx = listVal.indexOf(':');
          const subKey = listVal.slice(0, colonIdx).trim();
          let subVal = listVal.slice(colonIdx + 1).trim();
          subVal = subVal.replace(/^['"]|['"]$/g, '');
          list.push({ [subKey]: parseYamlValue(subVal) });
        } else if (listVal) {
          list.push(parseYamlValue(listVal));
        }
        frame.obj[frame.key] = list;
        frame.list = list;
      } else if (frame.ownerObj && frame.ownerKey) {
        // Block sequence indented under an empty-value key: replace the
        // provisional nested object on the owner with a real array.
        const list: any[] = [];
        if (listVal.includes(':')) {
          const colonIdx = listVal.indexOf(':');
          const subKey = listVal.slice(0, colonIdx).trim();
          let subVal = listVal.slice(colonIdx + 1).trim();
          subVal = subVal.replace(/^['"]|['"]$/g, '');
          list.push({ [subKey]: parseYamlValue(subVal) });
        } else if (listVal) {
          list.push(parseYamlValue(listVal));
        }
        frame.ownerObj[frame.ownerKey] = list;
        frame.list = list;
      }
      continue;
    }

    // Handle key:value lines
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > -1) {
      const key = trimmed.slice(0, colonIdx).trim();
      const rawVal = trimmed.slice(colonIdx + 1).trim();
      const frame = currentFrame();

      if (rawVal === '' || rawVal === undefined) {
        // Empty value: provisionally treat as a nested object, but it may turn
        // out to be a block sequence. Deeper-indented '- ' items will replace
        // this provisional object with an array via ownerObj/ownerKey.
        const nestedObj: Record<string, any> = {};
        frame.obj[key] = nestedObj;
        frame.key = key;
        frame.list = null;
        stack.push({ indent, obj: nestedObj, key: null, list: null, ownerObj: frame.obj, ownerKey: key });
      } else {
        // Scalar or inline array value
        frame.obj[key] = parseYamlValue(rawVal);
        // Update frame key in case next lines are list items for this key
        frame.key = key;
        frame.list = null;
      }
    }
  }

  return data;
}

