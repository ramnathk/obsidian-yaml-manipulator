// Auto-generated from docs/examples.md
// Category: Complex Conditions
// Generated: 2025-12-03T21:00:40.150Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Complex Conditions', () => {

  test('Example 51: Simple AND', () => {
    // Input YAML
    const input = {
  "status": "draft",
  "priority": 5
};

    // Rule
    const condition = "status = \"draft\" AND priority > 3";
    const action = "SET urgent true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "draft",
  "priority": 5,
  "urgent": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 52: AND with non-match', () => {
    // Input YAML
    const input = {
  "status": "published",
  "priority": 5
};

    // Rule
    const condition = "status = \"draft\" AND priority > 3";
    const action = "SET urgent true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "published",
  "priority": 5
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 53: OR conditions', () => {
    // Input YAML
    const input = {
  "status": "draft"
};

    // Rule
    const condition = "status = \"draft\" OR priority > 5";
    const action = "SET needsReview true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "draft",
  "needsReview": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 54: NOT operator', () => {
    // Input YAML
    const input = {
  "status": "archived"
};

    // Rule
    const condition = "NOT status = \"archived\"";
    const action = "SET active true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "archived"
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 56: Complex nested conditions', () => {
    // Input YAML
    const input = {
  "status": "draft",
  "priority": 8,
  "tags": [
    "work",
    "urgent"
  ],
  "reviewed": false
};

    // Rule
    const condition = "(status = \"draft\" OR status = \"pending\") AND priority > 5 AND (tags has \"urgent\" OR reviewed = true)";
    const action = "SET escalate true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "draft",
  "priority": 8,
  "tags": [
    "work",
    "urgent"
  ],
  "reviewed": false,
  "escalate": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 57: ANY in array', () => {
    // Input YAML
    const input = {
  "projects": [
    {
      "name": "Website",
      "status": "active"
    },
    {
      "name": "App",
      "status": "archived"
    }
  ]
};

    // Rule
    const condition = "ANY projects WHERE status = \"active\"";
    const action = "SET hasActiveProjects true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "projects": [
    {
      "name": "Website",
      "status": "active"
    },
    {
      "name": "App",
      "status": "archived"
    }
  ],
  "hasActiveProjects": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 58: ALL in array', () => {
    // Input YAML
    const input = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": false
    }
  ]
};

    // Rule
    const condition = "ALL tasks WHERE done = true";
    const action = "SET allComplete true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": false
    }
  ]
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
