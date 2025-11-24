/**
 * Comprehensive Tests for Basic Actions
 * Covers all code paths including error handling
 */

import { describe, it, expect } from 'vitest';
import {
	executeSet,
	executeAdd,
	executeDelete,
	executeRename
} from '../../../src/actions/basicActions';

describe('Basic Actions - Full Coverage', () => {
	describe('executeSet', () => {
		it('should set new field', () => {
			const data = { title: 'Note' };
			const result = executeSet(data, 'status', 'draft');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.status).toBe('draft');
			expect(result.changes[0]).toContain('SET status:');
		});

		it('should overwrite existing field', () => {
			const data = { status: 'draft' };
			const result = executeSet(data, 'status', 'published');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect(data.status).toBe('published');
			expect(result.changes[0]).toContain('→');
		});

		it('should create nested paths', () => {
			const data = {};
			const result = executeSet(data, 'metadata.author', 'John');

			expect(result.success).toBe(true);
			expect((data as any).metadata.author).toBe('John');
		});

		it('should handle various value types', () => {
			const data: any = {};

			executeSet(data, 'str', 'text');
			executeSet(data, 'num', 123);
			executeSet(data, 'bool', true);
			executeSet(data, 'nullVal', null);
			executeSet(data, 'arr', [1, 2, 3]);
			executeSet(data, 'obj', { key: 'value' });

			expect(data.str).toBe('text');
			expect(data.num).toBe(123);
			expect(data.bool).toBe(true);
			expect(data.nullVal).toBe(null);
			expect(data.arr).toEqual([1, 2, 3]);
			expect(data.obj).toEqual({ key: 'value' });
		});

		it('should format long strings in change message', () => {
			const data = {};
			const longString = 'a'.repeat(100);
			const result = executeSet(data, 'field', longString);

			expect(result.changes[0]).toContain('...');
		});

		it('should format arrays and objects in change message', () => {
			const data: any = {};

			const result1 = executeSet(data, 'arr', [1, 2, 3]);
			expect(result1.changes[0]).toContain('[3 items]');

			const result2 = executeSet(data, 'obj', { a: 1, b: 2 });
			expect(result2.changes[0]).toContain('{2 fields}');
		});
	});

	describe('executeAdd', () => {
		it('should add new field', () => {
			const data = { title: 'Note' };
			const result = executeAdd(data, 'status', 'draft');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect((data as any).status).toBe('draft');
		});

		it('should warn when field exists', () => {
			const data = { status: 'published' };
			const result = executeAdd(data, 'status', 'draft');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toContain('already exists');
			expect(data.status).toBe('published'); // Unchanged
		});

		it('should create nested paths when parent missing', () => {
			const data = {};
			const result = executeAdd(data, 'metadata.version', '1.0');

			expect(result.success).toBe(true);
			expect((data as any).metadata.version).toBe('1.0');
		});

		it('should warn when nested field exists', () => {
			const data = { metadata: { version: '1.0' } };
			const result = executeAdd(data, 'metadata.version', '2.0');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
			expect(result.warning).toBeDefined();
		});
	});

	describe('executeDelete', () => {
		it('should delete existing field', () => {
			const data = { title: 'Note', draft: true };
			const result = executeDelete(data, 'draft');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect((data as any).draft).toBeUndefined();
		});

		it('should be silent when field does not exist', () => {
			const data = { title: 'Note' };
			const result = executeDelete(data, 'missing');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
		});

		it('should delete nested field', () => {
			const data = { metadata: { author: 'John', version: 1.0 } };
			const result = executeDelete(data, 'metadata.version');

			expect(result.success).toBe(true);
			expect(data.metadata).toEqual({ author: 'John' });
		});

		it('should be silent when nested field missing', () => {
			const data = { metadata: { author: 'John' } };
			const result = executeDelete(data, 'metadata.missing');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
		});
	});

	describe('executeRename', () => {
		it('should rename field', () => {
			const data = { oldName: 'value', other: 'data' };
			const result = executeRename(data, 'oldName', 'newName');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(true);
			expect((data as any).newName).toBe('value');
			expect((data as any).oldName).toBeUndefined();
		});

		it('should be silent when source does not exist', () => {
			const data = { field: 'value' };
			const result = executeRename(data, 'missing', 'newName');

			expect(result.success).toBe(true);
			expect(result.modified).toBe(false);
		});

		it('should overwrite target if it exists', () => {
			const data = { oldName: 'value1', newName: 'value2' };
			const result = executeRename(data, 'oldName', 'newName');

			expect(result.success).toBe(true);
			expect((data as any).newName).toBe('value1');
			expect((data as any).oldName).toBeUndefined();
		});

		it('should handle nested paths', () => {
			const data = { old: { nested: { field: 'value' } } };
			const result = executeRename(data, 'old.nested.field', 'new.location');

			expect(result.success).toBe(true);
			expect((data as any).new.location).toBe('value');
		});
	});
});
