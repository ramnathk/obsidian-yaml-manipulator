// Auto-generated from docs/examples.md
// Category: Additional Operators & Edge Cases
// Generated: 2025-12-03T21:00:40.155Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Additional Operators & Edge Cases', () => {

  test('Example 78: :string check', () => {
    // Input YAML
    const input = {
  "title": "My Note",
  "status": "draft",
  "priority": 5
};

    // Rule
    const condition = "status :string";
    const action = "SET statusType \"text\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "status": "draft",
  "priority": 5,
  "statusType": "text"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 79: :number check', () => {
    // Input YAML
    const input = {
  "priority": 5,
  "count": "123"
};

    // Rule
    const condition = "priority :number";
    const action = "SET priorityType \"numeric\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 5,
  "count": "123",
  "priorityType": "numeric"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 80: :boolean check', () => {
    // Input YAML
    const input = {
  "published": true,
  "draft": false,
  "archived": "yes"
};

    // Rule
    const condition = "published :boolean";
    const action = "SET hasBooleanFlag true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "published": true,
  "draft": false,
  "archived": "yes",
  "hasBooleanFlag": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 81: :object check', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1
  },
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "metadata :object";
    const action = "SET hasMetadata true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 1
  },
  "tags": [
    "work",
    "project"
  ],
  "hasMetadata": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 82: >= (greater than or equal)', () => {
    // Input YAML
    const input = {
  "priority": 5,
  "count": 3
};

    // Rule
    const condition = "priority >= 5";
    const action = "SET highPriority true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 5,
  "count": 3,
  "highPriority": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 83: <= (less than or equal)', () => {
    // Input YAML
    const input = {
  "progress": 100,
  "score": 85
};

    // Rule
    const condition = "progress <= 100";
    const action = "SET withinLimit true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "progress": 100,
  "score": 85,
  "withinLimit": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 84: !has (array doesn\'t have)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "tags !has \"archived\"";
    const action = "SET active true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project"
  ],
  "active": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 85: !:null (not null)', () => {
    // Input YAML
    const input = {
  "status": "active",
  "deletedAt": null,
  "archivedAt": null
};

    // Rule
    const condition = "status !:null";
    const action = "SET hasStatus true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "active",
  "deletedAt": null,
  "archivedAt": null,
  "hasStatus": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 86: ALL with match', () => {
    // Input YAML
    const input = {
  "tasks": [
    {
      "title": "Task 1",
      "done": true
    },
    {
      "title": "Task 2",
      "done": true
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
      "done": true
    }
  ],
  "allComplete": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 87: ALL with no match (one fails)', () => {
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

  test('Example 88: ALL with empty array', () => {
    // Input YAML
    const input = {
  "tasks": []
};

    // Rule
    const condition = "ALL tasks WHERE done = true";
    const action = "SET allComplete true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": []
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 89: INSERT (alternative to INSERT_AT)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "INSERT_AT tags \"urgent\" AT 0";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "urgent",
    "work",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 90: INSERT_AFTER', () => {
    // Input YAML
    const input = {
  "tags": [
    "draft",
    "review",
    "publish"
  ]
};

    // Rule
    const condition = "";
    const action = "INSERT_AFTER tags \"approve\" AFTER \"review\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "review",
    "approve",
    "publish"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 91: INSERT_AFTER when target not found (error)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "INSERT_AFTER tags \"followup\" AFTER \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = null;
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 92: INSERT_BEFORE', () => {
    // Input YAML
    const input = {
  "tags": [
    "review",
    "publish"
  ]
};

    // Rule
    const condition = "";
    const action = "INSERT_BEFORE tags \"draft\" BEFORE \"review\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "review",
    "publish"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 93: REMOVE_ALL (vs REMOVE)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "work",
    "project",
    "work"
  ]
};

    // Rule
    const condition = "";
    const action = "REMOVE tags \"work\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "urgent",
    "work",
    "project",
    "work"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 94: REPLACE (first occurrence)', () => {
    // Input YAML
    const input = {
  "tags": [
    "draft",
    "old-tag",
    "draft",
    "old-tag"
  ]
};

    // Rule
    const condition = "";
    const action = "REPLACE tags \"old-tag\" WITH \"new-tag\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "new-tag",
    "draft",
    "old-tag"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 95: REPLACE_ALL (all occurrences)', () => {
    // Input YAML
    const input = {
  "tags": [
    "draft",
    "old-tag",
    "draft",
    "old-tag"
  ]
};

    // Rule
    const condition = "";
    const action = "REPLACE_ALL tags \"old-tag\" WITH \"new-tag\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "draft",
    "new-tag",
    "draft",
    "new-tag"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 96: RENAME top-level field', () => {
    // Input YAML
    const input = {
  "oldName": "value",
  "status": "active"
};

    // Rule
    const condition = "";
    const action = "RENAME oldName newName";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "newName": "value",
  "status": "active"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 97: RENAME nested field', () => {
    // Input YAML
    const input = {
  "metadata": {
    "oldField": "data",
    "author": "John"
  }
};

    // Rule
    const condition = "";
    const action = "RENAME metadata.oldField metadata.newField";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "newField": "data",
    "author": "John"
  }
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 98: RENAME when source doesn\'t exist (silent)', () => {
    // Input YAML
    const input = {
  "status": "active"
};

    // Rule
    const condition = "";
    const action = "RENAME nonExistent newName";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "status": "active"
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 99: RENAME when target exists (overwrite)', () => {
    // Input YAML
    const input = {
  "oldName": "old value",
  "newName": "existing value"
};

    // Rule
    const condition = "";
    const action = "RENAME oldName newName";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "newName": "old value"
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 100: String length', () => {
    // Input YAML
    const input = {
  "title": "This is a very long title",
  "shortTitle": "Hi"
};

    // Rule
    const condition = "title.length > 20";
    const action = "SET longTitle true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "This is a very long title",
  "shortTitle": "Hi",
  "longTitle": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 101: Object keys length', () => {
    // Input YAML
    const input = {
  "metadata": {
    "author": "John",
    "version": 1,
    "created": "2025-11-01",
    "updated": "2025-11-15"
  }
};

    // Rule
    const condition = "metadata.length > 3";
    const action = "SET richMetadata true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "metadata": {
    "author": "John",
    "version": 1,
    "created": "2025-11-01",
    "updated": "2025-11-15"
  }
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);

  });

  test('Example 102: Exact length match', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "tags.length = 3";
    const action = "SET hasThreeTags true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ],
  "hasThreeTags": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 103: Multiple type checks', () => {
    // Input YAML
    const input = {
  "title": "My Note",
  "priority": 5,
  "published": true
};

    // Rule
    const condition = "title :string AND priority :number AND published :boolean";
    const action = "SET wellFormed true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Note",
  "priority": 5,
  "published": true,
  "wellFormed": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 104: Range check (between values)', () => {
    // Input YAML
    const input = {
  "priority": 7
};

    // Rule
    const condition = "priority >= 5 AND priority <= 10";
    const action = "SET mediumPriority true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "priority": 7,
  "mediumPriority": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 105: Complex ANY/ALL combination', () => {
    // Input YAML
    const input = {
  "projects": [
    {
      "name": "Alpha",
      "status": "active",
      "priority": 8
    },
    {
      "name": "Beta",
      "status": "active",
      "priority": 3
    }
  ]
};

    // Rule
    const condition = "ANY projects WHERE status = \"active\" AND ALL projects WHERE priority > 0";
    const action = "SET hasActiveProjects true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "projects": [
    {
      "name": "Alpha",
      "status": "active",
      "priority": 8
    },
    {
      "name": "Beta",
      "status": "active",
      "priority": 3
    }
  ]
};
    const expectedStatus = "skipped";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);

  });
});
