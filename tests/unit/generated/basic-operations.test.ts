// Auto-generated from docs/examples.md
// Category: Basic Operations
// Generated: 2025-12-03T21:00:40.143Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Basic Operations', () => {

  test('Example 1: Set simple field', () => {
    // Input YAML
    const input = {
  "title": "My Note"
};

    // Rule
    const condition = "";
    const action = "SET status \"published\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "status": "published"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 2: Set overwrites existing field', () => {
    // Input YAML
    const input = {
  "status": "draft"
};

    // Rule
    const condition = "";
    const action = "SET status \"published\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "published"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 3: Set nested field', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John"
  }
};

    // Rule
    const condition = "";
    const action = "SET metadata.version \"1.0\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 1
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 4: Set creates parent if missing', () => {
    // Input YAML
    const input = {
  "title": "Note"
};

    // Rule
    const condition = "";
    const action = "SET metadata.version \"1.0\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "Note",
  "metadata": {
    "version": 1
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 5: ADD when field missing', () => {
    // Input YAML
    const input = {
  "title": "My Note"
};

    // Rule
    const condition = "";
    const action = "ADD status \"draft\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "status": "draft"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 6: ADD when field exists (no change + warning)', () => {
    // Input YAML
    const input = {
  "title": "My Note",
  "status": "published"
};

    // Rule
    const condition = "";
    const action = "ADD status \"draft\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "status": "published"
};
    const expectedStatus = "warning";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    expect(result.warning).toContain("Field 'status' already exists");
  });

  test('Example 7: DELETE existing field', () => {
    // Input YAML
    const input = {
  "title": "My Note",
  "draft": true,
  "status": "pending"
};

    // Rule
    const condition = "";
    const action = "DELETE draft";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "status": "pending"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 8: DELETE non-existent field (silent, no error)', () => {
    // Input YAML
    const input = {
  "title": "My Note"
};

    // Rule
    const condition = "";
    const action = "DELETE status";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note"
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 9: DELETE nested field', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1
  }
};

    // Rule
    const condition = "";
    const action = "DELETE metadata.version";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John"
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
