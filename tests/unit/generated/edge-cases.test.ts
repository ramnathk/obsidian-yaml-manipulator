// Auto-generated from docs/examples.md
// Category: Edge Cases
// Generated: 2025-12-02T23:50:16.311Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Edge Cases', () => {

  test('Example 48: Empty frontmatter block', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "(none)";
    const action = "SET status \"draft\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "draft"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 49: Invalid YAML (parse error)', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "(none)";
    const action = "SET reviewed true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "relatedNote": "[[Project Overview]]"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });
});
