// Auto-generated from docs/examples.md
// Category: Conditional Operations
// Generated: 2025-12-02T23:50:16.306Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Conditional Operations', () => {

  test('Example 10: Numeric comparison', () => {
    // Input YAML
    const input = {
  "priority": 5
};

    // Rule
    const condition = "priority > 3";
    const action = "SET urgent true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 5,
  "urgent": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 11: Array contains (has)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "review"
  ]
};

    // Rule
    const condition = "tags has \"urgent\"";
    const action = "SET priority \"high\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "review"
  ],
  "priority": "high"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 12: Empty array', () => {
    // Input YAML
    const input = {
  "tags": []
};

    // Rule
    const condition = "tags empty";
    const action = "DELETE tags";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 13: Array length', () => {
    // Input YAML
    const input = {
  "tags": [
    "one",
    "two",
    "three"
  ]
};

    // Rule
    const condition = "tags.length > 2";
    const action = "SET manyTags true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "one",
    "two",
    "three"
  ],
  "manyTags": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 14: Null check', () => {
    // Input YAML
    const input = {
  "deletedAt": null
};

    // Rule
    const condition = "deletedAt :null";
    const action = "DELETE deletedAt";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 15: Basic regex', () => {
    // Input YAML
    const input = {
  "filename": "project-2025-report.md"
};

    // Rule
    const condition = "filename ~ /\\d{4}/";
    const action = "SET hasYear true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "filename": "project-2025-report.md",
  "hasYear": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
