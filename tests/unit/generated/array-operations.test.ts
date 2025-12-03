// Auto-generated from docs/examples.md
// Category: Array Operations
// Generated: 2025-12-03T21:00:40.148Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Array Operations', () => {

  test('Example 24: APPEND to existing array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
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
    "work",
    "project",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 25: APPEND creates array if field missing', () => {
    // Input YAML
    const input = {
  "title": "Note"
};

    // Rule
    const condition = "";
    const action = "APPEND tags \"new\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "Note",
  "tags": [
    "new"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 26: APPEND to non-array (error)', () => {
    // Input YAML
    const input = {
  "status": "draft"
};

    // Rule
    const condition = "";
    const action = "APPEND status \"test\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = null;
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 27: PREPEND to array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "PREPEND tags \"urgent\"";

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

  test('Example 28: REMOVE matching value', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project",
    "urgent"
  ]
};

    // Rule
    const condition = "";
    const action = "REMOVE tags \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 29: REMOVE non-existent value (silent)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "REMOVE tags \"urgent\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project"
  ]
};
    const expectedStatus = "warning";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 30: REMOVE_AT specific index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "REMOVE_AT tags 1";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 31: REMOVE_AT negative index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "REMOVE_AT tags -1";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 32: REMOVE_AT out of bounds (error)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent"
  ]
};

    // Rule
    const condition = "";
    const action = "REMOVE_AT tags 5";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = null;
    const expectedStatus = "error";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    // Error case - data unchanged, just verify error occurred
    
  });

  test('Example 33: INSERT_AT middle', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "project"
  ]
};

    // Rule
    const condition = "";
    const action = "INSERT_AT tags \"urgent\" AT 1";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 34: INSERT_AT at end (index = length)', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent"
  ]
};

    // Rule
    const condition = "";
    const action = "INSERT_AT tags \"project\" AT 2";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 35: DEDUPLICATE array', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "work",
    "project",
    "urgent",
    "work"
  ]
};

    // Rule
    const condition = "";
    const action = "DEDUPLICATE tags";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "urgent",
    "project"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 36: SORT alphabetically', () => {
    // Input YAML
    const input = {
  "tags": [
    "zebra",
    "apple",
    "mango",
    "banana"
  ]
};

    // Rule
    const condition = "";
    const action = "SORT tags";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "apple",
    "banana",
    "mango",
    "zebra"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 37: SORT numbers', () => {
    // Input YAML
    const input = {
  "scores": [
    100,
    25,
    5,
    300
  ]
};

    // Rule
    const condition = "";
    const action = "SORT scores";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "scores": [
    5,
    25,
    100,
    300
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 39: SORT_BY object property', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 108
    },
    {
      "book": "1984",
      "count": 54
    },
    {
      "book": "Dune",
      "count": 216
    }
  ]
};

    // Rule
    const condition = "";
    const action = "SORT_BY countsLog BY count DESC";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "Dune",
      "count": 216
    },
    {
      "book": "The Hobbit",
      "count": 108
    },
    {
      "book": "1984",
      "count": 54
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 40: MOVE by index', () => {
    // Input YAML
    const input = {
  "tags": [
    "work",
    "urgent",
    "project",
    "personal"
  ]
};

    // Rule
    const condition = "";
    const action = "MOVE tags FROM 1 TO 3";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tags": [
    "work",
    "project",
    "personal",
    "urgent"
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 41: MOVE_WHERE to index', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "1984",
      "count": 2
    },
    {
      "book": "Foundation",
      "count": 7
    }
  ]
};

    // Rule
    const condition = "";
    const action = "MOVE_WHERE countsLog WHERE count > 5 TO 0";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "Foundation",
      "count": 7
    },
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "1984",
      "count": 2
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 42: MOVE_WHERE AFTER', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "1984",
      "count": 2
    }
  ]
};

    // Rule
    const condition = "";
    const action = "MOVE_WHERE countsLog WHERE count > 5 AFTER book=\"The Hobbit\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 3
    },
    {
      "book": "Neuromancer",
      "count": 8
    },
    {
      "book": "1984",
      "count": 2
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 43: UPDATE_WHERE single field', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "BBBK",
      "count": 108,
      "unit": "Repetitions"
    },
    {
      "book": "The Hobbit",
      "count": 54,
      "unit": "Repetitions"
    }
  ]
};

    // Rule
    const condition = "";
    const action = "UPDATE_WHERE countsLog WHERE book=\"BBBK\" SET unit \"Malas\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "BBBK",
      "count": 108,
      "unit": "Malas"
    },
    {
      "book": "The Hobbit",
      "count": 54,
      "unit": "Repetitions"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 44: UPDATE_WHERE multiple fields', () => {
    // Input YAML
    const input = {
  "tasks": [
    {
      "title": "Review PR",
      "status": "pending",
      "priority": 0
    }
  ]
};

    // Rule
    const condition = "";
    const action = "UPDATE_WHERE tasks WHERE title=\"Review PR\" SET status \"done\", priority 5, completedDate \"2025-11-19\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "tasks": [
    {
      "title": "Review PR",
      "status": "done",
      "priority": 5,
      "completedDate": "2025-11-19"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 45: UPDATE_WHERE no matches (silent)', () => {
    // Input YAML
    const input = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 108
    }
  ]
};

    // Rule
    const condition = "";
    const action = "UPDATE_WHERE countsLog WHERE title=\"Neuromancer\" SET count 216";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "countsLog": [
    {
      "book": "The Hobbit",
      "count": 108
    }
  ]
};
    const expectedStatus = "warning";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});
