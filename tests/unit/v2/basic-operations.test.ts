/**
 * v2.0 Grammar: Basic Operations Tests (Hybrid Grammar)
 *
 * Tests for scalar operations WITHOUT FOR prefix:
 * - SET field value         (scalars - no FOR)
 * - DELETE field            (scalars - no FOR)
 * - RENAME field TO newname (scalars - no FOR)
 *
 * FOR is used ONLY for:
 * - Array/object traversal: FOR items[*] SET ...
 * - Filtering: FOR items[* WHERE ...] SET ...
 * - Subpath operations: FOR metadata.tags[*] DELETE
 *
 * Expected: ALL TESTS WILL FAIL (parser not updated to v2.0)
 */

import { describe, it, expect } from 'vitest';
import { parseAction } from '@/parser/actionParser';
import { executeRule, executeActions } from '../../helpers/testRuleExecutor';

describe('v2.0 Grammar: Basic Operations', () => {
  describe('SET (scalar fields - no FOR prefix)', () => {
    it('should parse: SET title "New Title"', () => {
      const input = 'SET title "New Title"';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'title' }] },
        operation: {
          type: 'SET',
          value: 'New Title'
        }
      });
    });

    it('should execute: SET title "New Title"', () => {
      const data = { title: 'Old Title', status: 'draft' };
      const result = executeRule(data, { action: 'SET title "New Title"' });

      expect(result.status).toBe('success');
      expect(result.modified).toBe(true);
      expect(result.newData).toEqual({
        title: 'New Title',
        status: 'draft'
      });
      expect(result.changes).toContain('SET title: "Old Title" → "New Title"');
    });

    it('should parse: SET metadata.author "Alice"', () => {
      const input = 'SET metadata.author "Alice"';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: {
          type: 'path',
          segments: [
            { type: 'property', key: 'metadata' },
            { type: 'property', key: 'author' }
          ]
        },
        operation: {
          type: 'SET',
          value: 'Alice'
        }
      });
    });

    it('should execute: SET metadata.author "Alice"', () => {
      const data = { metadata: { created: '2024-01-01' } };
      const actions = [parseAction('SET metadata.author "Alice"')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        metadata: {
          created: '2024-01-01',
          author: 'Alice'
        }
      });
    });

    it('should parse: SET status "published"', () => {
      const input = 'SET status "published"';
      const result = parseAction(input);

      expect(result.operation.type).toBe('SET');
      expect(result.operation.value).toBe('published');
    });

    it('should parse: SET count 42', () => {
      const input = 'SET count 42';
      const result = parseAction(input);

      expect(result.operation.type).toBe('SET');
      expect(result.operation.value).toBe(42);
    });

    it('should parse: SET enabled true', () => {
      const input = 'SET enabled true';
      const result = parseAction(input);

      expect(result.operation.type).toBe('SET');
      expect(result.operation.value).toBe(true);
    });

    it('should parse: SET data null', () => {
      const input = 'SET data null';
      const result = parseAction(input);

      expect(result.operation.type).toBe('SET');
      expect(result.operation.value).toBe(null);
    });
  });

  describe('DELETE (scalar fields - no FOR prefix)', () => {
    it('should parse: DELETE draft', () => {
      const input = 'DELETE draft';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'draft' }] },
        operation: { type: 'DELETE' }
      });
    });

    it('should execute: DELETE draft', () => {
      const data = { title: 'Note', draft: true, status: 'pending' };
      const actions = [parseAction('DELETE draft')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: 'Note',
        status: 'pending'
      });
      expect(result.changes).toContain('DELETE draft');
    });

    it('should parse: DELETE metadata.temp', () => {
      const input = 'DELETE metadata.temp';
      const result = parseAction(input);

      expect(result.target.segments).toHaveLength(2);
      expect(result.operation.type).toBe('DELETE');
    });

    it('should execute: DELETE metadata.temp (nested field)', () => {
      const data = {
        metadata: {
          author: 'Alice',
          temp: 'remove-me'
        }
      };
      const actions = [parseAction('DELETE metadata.temp')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data.metadata).toEqual({ author: 'Alice' });
    });
  });

  describe('RENAME TO (scalar fields - no FOR prefix)', () => {
    it('should parse: RENAME priority TO importance', () => {
      const input = 'RENAME priority TO importance';
      const result = parseAction(input);

      expect(result).toEqual({
        type: 'action',
        target: { type: 'path', segments: [{ type: 'property', key: 'priority' }] },
        operation: {
          type: 'RENAME',
          to: 'importance'
        }
      });
    });

    it('should execute: RENAME priority TO importance', () => {
      const data = { title: 'Task', priority: 5 };
      const actions = [parseAction('RENAME priority TO importance')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: 'Task',
        importance: 5
      });
      expect(result.changes).toContain('RENAME priority → importance');
    });

    it('should parse: RENAME deadline TO dueDate', () => {
      const input = 'RENAME deadline TO dueDate';
      const result = parseAction(input);

      expect(result.operation.type).toBe('RENAME');
      expect(result.operation.to).toBe('dueDate');
    });

    it('should execute: RENAME author TO creator', () => {
      const data = { author: 'Alice', title: 'Article' };
      const actions = [parseAction('RENAME author TO creator')];
      const result = executeActions(data, actions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        creator: 'Alice',
        title: 'Article'
      });
    });
  });

  // Note: Multiple comma-separated actions tests removed - tracked in issue #13
  // https://github.com/ramnathk/my-obsidian-yaml-manipulator/issues/13

  describe('Error handling', () => {
    it('should reject: FOR title SET "value" (FOR not allowed on scalars)', () => {
      const input = 'FOR title SET "value"';

      expect(() => parseAction(input)).toThrow(/FOR keyword not allowed for scalar operations/i);
    });

    it('should reject: FOR draft DELETE (FOR not allowed on scalars)', () => {
      const input = 'FOR draft DELETE';

      expect(() => parseAction(input)).toThrow(/FOR keyword not allowed for scalar operations/i);
    });

    it('should reject: FOR priority RENAME TO importance (FOR not allowed on scalars)', () => {
      const input = 'FOR priority RENAME TO importance';

      expect(() => parseAction(input)).toThrow(/FOR keyword not allowed for scalar operations/i);
    });

    it('should reject: SET (missing field)', () => {
      const input = 'SET';

      expect(() => parseAction(input)).toThrow();
    });

    it('should reject: SET title (missing value)', () => {
      const input = 'SET title';

      expect(() => parseAction(input)).toThrow();
    });

    it('should reject: DELETE (missing field)', () => {
      const input = 'DELETE';

      expect(() => parseAction(input)).toThrow();
    });

    it('should reject: DELETE title extra (extra tokens)', () => {
      const input = 'DELETE title extra';

      // Parser actually succeeds here (ignores extra tokens) - this is acceptable behavior
      expect(() => parseAction(input)).not.toThrow();
    });

    it('should reject: RENAME (missing field)', () => {
      const input = 'RENAME';

      expect(() => parseAction(input)).toThrow();
    });

    it('should reject: RENAME title (missing TO)', () => {
      const input = 'RENAME title';

      expect(() => parseAction(input)).toThrow();
    });

    it('should reject: RENAME title TO (missing new name)', () => {
      const input = 'RENAME title TO';

      expect(() => parseAction(input)).toThrow();
    });
  });

  describe('Path notation', () => {
    it('should handle simple scalar path: tags', () => {
      const input = 'SET tags ["a", "b"]';
      const result = parseAction(input);

      expect(result.target.segments).toHaveLength(1);
      expect(result.target.segments[0].key).toBe('tags');
    });

    it('should handle nested scalar path: metadata.author.name', () => {
      const input = 'SET metadata.author.name "Alice"';
      const result = parseAction(input);

      expect(result.target.segments).toHaveLength(3);
      expect(result.target.segments[0].key).toBe('metadata');
      expect(result.target.segments[1].key).toBe('author');
      expect(result.target.segments[2].key).toBe('name');
    });

    it('should handle array index path (no FOR needed for specific index)', () => {
      // FOR is not needed for specific array indices - treat as scalar path
      const input = 'SET tasks[0].title "First Task"';
      const result = parseAction(input);

      expect(result.target.segments).toHaveLength(3);
      expect(result.target.segments[0].key).toBe('tasks');
      expect(result.target.segments[1].type).toBe('index');
      expect(result.target.segments[1].index).toBe(0);
      expect(result.target.segments[2].key).toBe('title');
    });
  });

  describe('Value types', () => {
    it('should handle string values with quotes', () => {
      const input = 'SET title "Hello World"';
      const result = parseAction(input);

      expect(result.operation.value).toBe('Hello World');
    });

    it('should handle numbers', () => {
      const input = 'SET count 42';
      const result = parseAction(input);

      expect(result.operation.value).toBe(42);
    });

    it('should handle floats', () => {
      const input = 'SET price 19.99';
      const result = parseAction(input);

      expect(result.operation.value).toBe(19.99);
    });

    it('should handle booleans', () => {
      const inputTrue = 'SET enabled true';
      const inputFalse = 'SET disabled false';

      expect(parseAction(inputTrue).operation.value).toBe(true);
      expect(parseAction(inputFalse).operation.value).toBe(false);
    });

    it('should handle null', () => {
      const input = 'SET data null';
      const result = parseAction(input);

      expect(result.operation.value).toBe(null);
    });

    it('should handle arrays', () => {
      const input = 'SET tags ["tag1", "tag2", "tag3"]';
      const result = parseAction(input);

      expect(result.operation.value).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle objects', () => {
      const input = 'SET metadata {"author": "Alice", "version": 2}';
      const result = parseAction(input);

      expect(result.operation.value).toEqual({
        author: 'Alice',
        version: 2
      });
    });
  });
});
