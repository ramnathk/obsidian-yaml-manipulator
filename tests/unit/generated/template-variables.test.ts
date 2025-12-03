// Auto-generated from docs/examples.md
// Category: Template Variables
// Generated: 2025-12-03T21:00:40.150Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Template Variables', () => {

  test('Example 59: {{today}}', () => {
    // Input YAML
    const input = {
  "title": "My Note"
};

    // Rule
    const condition = "";
    const action = "SET createdDate \"{{today}}\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "createdDate": "2025-11-19"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 65: {{fm:field}}', () => {
    // Input YAML
    const input = {
  "title": "My Project",
  "author": "John Doe"
};

    // Rule
    const condition = "";
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
