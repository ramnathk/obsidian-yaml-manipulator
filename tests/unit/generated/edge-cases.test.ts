// Auto-generated from docs/examples.md
// Category: Edge Cases
// Generated: 2025-12-06T16:22:50.460Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Edge Cases', () => {

  test('Example 67: Empty frontmatter block', () => {
    // Input YAML (empty frontmatter)
    const input = {};

    // Rule
    const condition = "";
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

});
