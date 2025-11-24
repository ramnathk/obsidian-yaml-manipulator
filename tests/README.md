# Test Suite for YAML Manipulator

This directory contains automated tests generated from `docs/examples.md` and hand-written integration tests.

## Test Structure

```
tests/
├── unit/                           # Unit tests (fast, no dependencies)
│   ├── parser/                     # Parser tests
│   │   ├── conditionLexer.test.ts
│   │   ├── conditionParser.test.ts
│   │   ├── actionParser.test.ts
│   │   ├── valueParser.test.ts
│   │   └── pathResolver.test.ts
│   ├── evaluator/                  # Evaluator tests
│   │   └── conditionEvaluator.test.ts
│   ├── actions/                    # Action executor tests
│   │   ├── basicActions.test.ts
│   │   ├── arrayActions.test.ts
│   │   └── objectActions.test.ts
│   └── generated/                  # Auto-generated from examples.md
│       ├── basic-operations.test.ts
│       ├── conditional-operations.test.ts
│       ├── array-operations.test.ts
│       └── ... (10 files total)
│
├── integration/                    # Integration tests
│   ├── ruleEngine.test.ts
│   ├── batchProcessor.test.ts
│   ├── storage.test.ts
│   └── endToEnd.test.ts
│
├── fixtures/                       # Test data
│   ├── yamlData.ts                 # Sample frontmatter objects
│   └── rules.ts                    # Sample rules
│
├── helpers/                        # Test utilities
│   ├── mockVault.ts                # Mock Obsidian Vault API
│   └── testUtils.ts                # Shared utilities
│
└── generators/                     # Test generation scripts
    └── generateFromExamples.ts     # Converts examples.md to tests
```

## Running Tests

### **All tests:**
```bash
npm run test
```

### **Watch mode** (re-runs on file changes):
```bash
npm run test:watch
```

### **With UI:**
```bash
npm run test:ui
# Opens browser with interactive test UI
```

### **Coverage report:**
```bash
npm run test:coverage
# Generates HTML coverage report in coverage/
```

### **Specific test file:**
```bash
npm run test tests/unit/actions/basicActions.test.ts
```

## Generating Tests from Examples

### **Auto-generate test files:**
```bash
npm run generate:tests
```

This parses `docs/examples.md` and creates test files in `tests/unit/generated/`.

**Process:**
1. Reads all 131 examples from examples.md
2. Extracts input YAML, rules, expected output
3. Generates TypeScript test files
4. One test file per category (10 files)
5. ~400 test cases total

### **When to regenerate:**
- After updating examples.md
- After adding new examples
- After changing example format

## Test Development Workflow

### **TDD (Test-Driven Development):**

1. **Generate tests first:**
   ```bash
   npm run generate:tests
   ```

2. **All tests fail** (no implementation yet):
   ```bash
   npm run test
   # ❌ 400/400 tests fail
   ```

3. **Implement module** (e.g., `src/parser/conditionParser.ts`)

4. **Tests start passing:**
   ```bash
   npm run test:watch
   # ✅ 35/40 tests pass
   # ❌ 5/40 tests fail
   ```

5. **Fix implementation until all pass:**
   ```bash
   # ✅ 40/40 tests pass
   ```

6. **Move to next module**

## Test Organization

### **Unit Tests** (fast, isolated)
- Test individual functions
- No file I/O
- No Obsidian API
- Use mock data from fixtures
- Run in milliseconds

### **Integration Tests** (moderate speed)
- Test multiple modules together
- Use MockVault for file operations
- Test complete workflows
- Run in seconds

### **Manual Tests** (slow, comprehensive)
- Test in real Obsidian
- Use test-vault files
- Verify UI works
- Check cross-platform behavior

## Coverage Goals

| Module | Target Coverage | Why |
|--------|----------------|-----|
| Parsers | 95%+ | Critical, well-defined |
| Evaluators | 95%+ | Truth tables fully specified |
| Actions | 95%+ | All examples tested |
| Core Engine | 85%+ | Complex integration |
| Utils | 90%+ | Important helpers |
| UI Components | 0% | Manual testing only |
| **Overall** | **80%+** | High confidence |

## Example Test Cases

### **From Example 1.1.1 (SET simple field):**
```typescript
test('SET adds field to object', () => {
  const data = { title: 'My Note' };
  executeSet(data, 'status', 'published');

  expect(data).toEqual({
    title: 'My Note',
    status: 'published'
  });
});
```

### **From Example 2.1.1 (Equality condition):**
```typescript
test('evaluates equality correctly', () => {
  const condition = parseCondition('status = "draft"');
  const data = { status: 'draft', title: 'Note' };

  const result = evaluateCondition(condition, data);

  expect(result).toBe(true);
});
```

### **From Example 3.1.1 (APPEND to array):**
```typescript
test('APPEND adds to end of array', () => {
  const data = { tags: ['work', 'project'] };
  executeAppend(data, 'tags', 'urgent');

  expect(data.tags).toEqual(['work', 'project', 'urgent']);
});
```

## Test Fixtures

All test fixtures are in `tests/fixtures/yamlData.ts`:

```typescript
import { yamlFixtures } from '../fixtures/yamlData';

test('example test', () => {
  const data = { ...yamlFixtures.simpleNote };  // Clone to avoid mutation
  // Test with data
});
```

Available fixtures match test-vault files:
- `simpleNote` - Basic frontmatter
- `withTags` - Array of tags
- `nestedMetadata` - Nested objects
- `mantraLog` - Array of objects
- `emptyFrontmatter` - Empty object
- `oldDraft` - Draft with date
- `published` - Published article
- `duplicateTags` - For deduplication testing
- `nullValues` - Explicit nulls
- `emptyArrays` - Empty arrays
- `complexTasks` - Task list
- `numericFields` - Various numbers
- `booleanFields` - Boolean flags

## Next Steps

1. **Run test generator:**
   ```bash
   npm run generate:tests
   ```

2. **See tests (all skipped):**
   ```bash
   npm run test
   # ✅ 0 passed, 400 skipped (waiting for implementation)
   ```

3. **Implement modules** one by one

4. **Watch tests pass:**
   ```bash
   npm run test:watch
   # See tests go from skip → pass as you implement
   ```

5. **Reach 80%+ coverage:**
   ```bash
   npm run test:coverage
   ```

## Benefits

✅ **400 test cases** from examples.md
✅ **Confidence** - If all tests pass, examples work
✅ **Regression prevention** - Tests catch breakage
✅ **Documentation** - Tests show how to use each module
✅ **TDD** - Write tests first, implement after
✅ **Fast feedback** - Tests run in <1 second

---

**Ready to implement!** 🚀
