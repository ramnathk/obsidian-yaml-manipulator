// Auto-generated from docs/examples.md
// Category: Obsidian-Specific Fields
// Generated: 2025-12-03T21:00:40.154Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Obsidian-Specific Fields', () => {

  test('Example 74: Add tag', () => {
    // Input YAML
    const input = {
  "tags": [
    "project",
    "work"
  ]
};

    // Rule
    const condition = "";
    const action = "APPEND tags \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "project",
    "work",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 75: Set aliases', () => {
    // Input YAML
    const input = {
  "title": "Project Overview"
};

    // Rule
    const condition = "";
    const action = "SET aliases [\"Overview\", \"Project Summary\"]";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "Project Overview",
  "aliases": [
    "Overview",
    "Project Summary"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 77: Dataview custom fields', () => {
    // Input YAML
    const input = {
  "project": "Website Redesign"
};

    // Rule
    const condition = "project exists";
    const action = "SET status \"active\", priority 5, dueDate \"2025-12-31\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "project": "Website Redesign",
  "status": "active",
  "priority": 5,
  "dueDate": "2025-12-31"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
