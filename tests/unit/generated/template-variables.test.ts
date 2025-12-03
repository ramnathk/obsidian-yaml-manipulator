// Auto-generated from docs/examples.md
// Category: Template Variables
// Generated: 2025-12-02T23:50:16.309Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Template Variables', () => {

  test('Example 46: {{today}}', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "(none)";
    const action = "SET formattedDate \"{{date:MMMM d, yyyy}}\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output - verify format, not exact date
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(result.newData.formattedDate).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    // Verify it matches the format "MMMM d, yyyy" (e.g., "December 3, 2025")
    
  });

  test('Example 47: {{fm:field}}', () => {
    // Input YAML
    const input = {
  "title": "My Project",
  "author": "John Doe"
};

    // Rule
    const condition = "(none)";
    const action = "SET displayName \"{{fm:author}} - {{fm:title}}\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Project",
  "author": "John Doe",
  "displayName": "John Doe - My Project"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
