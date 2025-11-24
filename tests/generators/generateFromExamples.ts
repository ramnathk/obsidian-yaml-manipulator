#!/usr/bin/env node
/**
 * Generate test files from docs/examples.md
 *
 * Parses examples.md and creates vitest test files for each category
 * Run: npm run generate:tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Example {
  id: string;
  section: string;
  title: string;
  input: string;
  rule: {
    condition: string;
    action: string;
  };
  output: string;
  expectedStatus?: 'success' | 'warning' | 'error' | 'skipped';
  resultNote?: string;
}

interface CategoryTests {
  category: string;
  filename: string;
  examples: Example[];
}

/**
 * Parse examples from VitePress documentation
 * Single source of truth: docs-site/reference/examples.md
 */
function parseExamplesFile(): Example[] {
  const examplesPath = path.join(__dirname, '../../docs-site/reference/examples.md');
  const content = fs.readFileSync(examplesPath, 'utf8');

  const examples: Example[] = [];
  let currentSection = '';

  // Match section headers
  const sectionRegex = /^## (\d+)\. (.+)$/gm;
  const sections: { num: string; title: string; pos: number }[] = [];

  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      num: match[1],
      title: match[2],
      pos: match.index
    });
  }

  // Extract examples from each section (VitePress format)
  // Matches: ### Title\n\n**Input:**\n```yaml\n...\n```\n\n**Condition:** `...`\n\n**Action:** `...`\n\n**Output:**\n```yaml\n...\n```
  const exampleRegex = /###\s+(.+?)\n\n\*\*Input:\*\*\n```yaml\n([\s\S]+?)```\n\n\*\*Condition:\*\*\s*`([^`]+)`\n\n\*\*Action:\*\*\s*`([^`]+)`\n\n\*\*Output:\*\*\n```yaml\n([\s\S]+?)```/g;

  let exampleNum = 1;
  while ((match = exampleRegex.exec(content)) !== null) {
    const exampleTitle = match[1];
    const inputYaml = match[2];
    const condition = match[3];
    const action = match[4];
    const outputYaml = match[5];
    const exampleId = String(exampleNum++);

    // Find which section this example belongs to
    const examplePos = match.index;
    let section = '';
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].pos < examplePos) {
        section = sections[i].title;
        break;
      }
    }

    // Create example from VitePress format
    examples.push({
      id: exampleId,
      section,
      title: exampleTitle,
      input: inputYaml.trim(),
      rule: {
        condition: condition.trim(),
        action: action.trim()
      },
      output: outputYaml.trim(),
      expectedStatus: 'success'
    });
  }

  console.log(`📋 Parsed ${examples.length} examples from VitePress documentation`);
  return examples;
}

/**
 * Parse a YAML block from an example
 */
function parseYamlBlock(block: string): {
  input: string;
  rule: { condition: string; action: string };
  output: string;
  expectedStatus?: 'success' | 'warning' | 'error' | 'skipped';
  resultNote?: string;
} | null {
  // Extract Input
  const inputMatch = block.match(/# Input\n---\n([\s\S]+?)\n---/);
  if (!inputMatch) return null;
  const input = inputMatch[1].trim();

  // Extract Rule
  let condition = '';
  let action = '';

  const conditionMatch = block.match(/# Rule\nCondition: (.+)/);
  if (conditionMatch) {
    condition = conditionMatch[1].replace('(none)', '').trim();
  }

  const actionMatch = block.match(/(?:# Rule\n)?Action: (.+)/);
  if (actionMatch) {
    action = actionMatch[1].trim();
  }

  // For examples with just "# Rule" on one line and action below
  if (!action) {
    const simpleActionMatch = block.match(/# Rule\n([A-Z_]+.+)/);
    if (simpleActionMatch) {
      action = simpleActionMatch[1].trim();
    }
  }

  // Extract Output
  const outputMatch = block.match(/# Output.*?\n---\n([\s\S]+?)\n---/);
  let output = '';
  if (outputMatch) {
    output = outputMatch[1].trim();
  }

  // Extract expected status/result
  let expectedStatus: 'success' | 'warning' | 'error' | 'skipped' | undefined;
  let resultNote: string | undefined;

  if (block.includes('NO CHANGE')) {
    expectedStatus = output ? 'success' : 'skipped';
  }
  if (block.includes('# Result: ⚠️ Warning')) {
    expectedStatus = 'warning';
    const warningMatch = block.match(/# Result: ⚠️ Warning[:\-] (.+)/);
    if (warningMatch) resultNote = warningMatch[1].trim();
  }
  if (block.includes('# Result: ❌ Error')) {
    expectedStatus = 'error';
    const errorMatch = block.match(/# Result: ❌ Error[:\-] (.+)/);
    if (errorMatch) resultNote = errorMatch[1].trim();
  }

  return {
    input,
    rule: { condition, action },
    output,
    expectedStatus: expectedStatus || 'success',
    resultNote
  };
}

/**
 * Group examples by category
 */
function groupByCategory(examples: Example[]): CategoryTests[] {
  const categories = new Map<string, Example[]>();

  for (const example of examples) {
    if (!categories.has(example.section)) {
      categories.set(example.section, []);
    }
    categories.get(example.section)!.push(example);
  }

  const result: CategoryTests[] = [];
  for (const [category, exs] of categories.entries()) {
    const filename = category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.test.ts';

    result.push({
      category,
      filename,
      examples: exs
    });
  }

  return result;
}

/**
 * Generate test file content
 */
function generateTestFile(categoryTests: CategoryTests): string {
  const { category, examples } = categoryTests;

  let code = `// Auto-generated from docs/examples.md
// Category: ${category}
// Generated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';

describe('${category}', () => {
`;

  for (const example of examples) {
    code += generateTestCase(example);
  }

  code += '});\n';

  return code;
}

/**
 * Generate a single test case
 */
function generateTestCase(example: Example): string {
  // Convert YAML string to JSON for test data
  const inputData = yamlToJson(example.input);
  const outputData = example.output ? yamlToJson(example.output) : null;

  return `
  test('Example ${example.id}: ${escapeString(example.title)}', async () => {
    // Input YAML
    const input = ${inputData};

    // Rule
    const condition = ${JSON.stringify(example.rule.condition)};
    const action = ${JSON.stringify(example.rule.action)};

    // TODO: Execute rule when ruleEngine is implemented
    // const result = await executeRule({ condition, action }, input);

    // Expected output
    const expectedOutput = ${outputData};
    const expectedStatus = ${JSON.stringify(example.expectedStatus)};

    // Assertions (will be activated when implementation exists)
    // expect(result.status).toBe(expectedStatus);
    ${outputData ? '// expect(result.newData).toEqual(expectedOutput);' : '// expect(result.modified).toBe(false);'}
    ${example.resultNote ? `// expect(result.${example.expectedStatus === 'error' ? 'error' : 'warning'}).toContain(${JSON.stringify(example.resultNote)});` : ''}

    // Placeholder until rule engine is implemented
    expect(true).toBe(true);
  });
`;
}

/**
 * Convert YAML string to JSON string for code generation
 */
function yamlToJson(yaml: string): string {
  try {
    // Simple YAML to JSON conversion for common cases
    // This is a simplified converter - real parsing happens in gray-matter at runtime

    const lines = yaml.split('\n');
    const obj: any = {};
    let current = obj;
    const stack: any[] = [obj];
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Simple key: value parsing
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        if (value) {
          current[key] = parseSimpleValue(value);
        }
      }
    }

    return JSON.stringify(obj, null, 2);
  } catch (e) {
    // Fallback: return empty object
    return '{}';
  }
}

function parseSimpleValue(value: string): any {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Parse number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }

  // Parse boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Parse null
  if (value === 'null') return null;

  // Parse array
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function escapeString(str: string): string {
  return str.replace(/'/g, "\\'");
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating tests from examples.md...\n');

  // Parse examples
  const examples = parseExamplesFile();

  if (examples.length === 0) {
    console.error('❌ No examples found in docs/examples.md');
    process.exit(1);
  }

  // Group by category
  const categories = groupByCategory(examples);

  console.log(`📂 Found ${categories.length} categories:\n`);
  categories.forEach(cat => {
    console.log(`   ${cat.category}: ${cat.examples.length} examples`);
  });
  console.log();

  // Create output directory
  const outputDir = path.join(__dirname, '../unit/generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate test files
  let totalTests = 0;
  for (const categoryTests of categories) {
    const testCode = generateTestFile(categoryTests);
    const outputPath = path.join(outputDir, categoryTests.filename);
    fs.writeFileSync(outputPath, testCode, 'utf8');

    console.log(`✅ Generated ${categoryTests.filename} (${categoryTests.examples.length} tests)`);
    totalTests += categoryTests.examples.length;
  }

  // Generate index file
  const indexCode = `// Auto-generated test index
// Import all generated test files

${categories.map(cat => `import './${cat.filename.replace('.ts', '')}';`).join('\n')}
`;

  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexCode, 'utf8');

  console.log(`\n🎉 Generated ${totalTests} tests in ${categories.length} files`);
  console.log(`📍 Location: tests/unit/generated/`);
  console.log(`\n▶️  Run tests with: npm run test`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { parseExamplesFile, groupByCategory, generateTestFile };
