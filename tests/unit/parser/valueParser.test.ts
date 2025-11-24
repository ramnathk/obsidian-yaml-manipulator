/**
 * Tests for Value Parser
 */

import { describe, it, expect } from 'vitest';
import {
	parseValue,
	parseString,
	parseNumber,
	parseBoolean,
	parseArray,
	parseObject,
	needsQuotes
} from '../../../src/parser/valueParser';

describe('Value Parser', () => {
	describe('parseString', () => {
		it('should parse double-quoted strings', () => {
			expect(parseString('"hello"')).toBe('hello');
			expect(parseString('"hello world"')).toBe('hello world');
		});

		it('should parse single-quoted strings', () => {
			expect(parseString("'hello'")).toBe('hello');
			expect(parseString("'hello world'")).toBe('hello world');
		});

		it('should handle escaped quotes', () => {
			expect(parseString('"He said \\"hello\\""')).toBe('He said "hello"');
			expect(parseString("'It\\'s working'")).toBe("It's working");
		});

		it('should process escape sequences', () => {
			expect(parseString('"Line 1\\nLine 2"')).toBe('Line 1\nLine 2');
			expect(parseString('"Tab\\there"')).toBe('Tab\there');
			expect(parseString('"Back\\\\slash"')).toBe('Back\\slash');
		});

		it('should return unquoted strings as-is', () => {
			expect(parseString('hello')).toBe('hello');
		});
	});

	describe('parseNumber', () => {
		it('should parse integers', () => {
			expect(parseNumber('123')).toBe(123);
			expect(parseNumber('0')).toBe(0);
			expect(parseNumber('-42')).toBe(-42);
		});

		it('should parse floats', () => {
			expect(parseNumber('123.45')).toBe(123.45);
			expect(parseNumber('0.5')).toBe(0.5);
			expect(parseNumber('-3.14')).toBe(-3.14);
		});

		it('should return null for non-numbers', () => {
			expect(parseNumber('abc')).toBe(null);
			expect(parseNumber('12.34.56')).toBe(null);
			expect(parseNumber('')).toBe(null);
		});
	});

	describe('parseBoolean', () => {
		it('should parse true', () => {
			expect(parseBoolean('true')).toBe(true);
			expect(parseBoolean('TRUE')).toBe(true);
			expect(parseBoolean('True')).toBe(true);
		});

		it('should parse false', () => {
			expect(parseBoolean('false')).toBe(false);
			expect(parseBoolean('FALSE')).toBe(false);
			expect(parseBoolean('False')).toBe(false);
		});

		it('should return null for non-booleans', () => {
			expect(parseBoolean('yes')).toBe(null);
			expect(parseBoolean('no')).toBe(null);
			expect(parseBoolean('1')).toBe(null);
		});
	});

	describe('parseArray', () => {
		it('should parse simple arrays', () => {
			expect(parseArray('["a", "b", "c"]')).toEqual(['a', 'b', 'c']);
			expect(parseArray('[1, 2, 3]')).toEqual([1, 2, 3]);
		});

		it('should parse mixed type arrays', () => {
			expect(parseArray('["text", 123, true, null]')).toEqual(['text', 123, true, null]);
		});

		it('should parse nested arrays', () => {
			expect(parseArray('[["a", "b"], ["c", "d"]]')).toEqual([['a', 'b'], ['c', 'd']]);
		});

		it('should parse empty arrays', () => {
			expect(parseArray('[]')).toEqual([]);
		});

		it('should throw on invalid JSON', () => {
			expect(() => parseArray('[invalid]')).toThrow();
			expect(() => parseArray('["unclosed')).toThrow();
		});
	});

	describe('parseObject', () => {
		it('should parse simple objects', () => {
			expect(parseObject('{"key": "value"}')).toEqual({ key: 'value' });
			expect(parseObject('{"count": 42}')).toEqual({ count: 42 });
		});

		it('should parse nested objects', () => {
			expect(parseObject('{"outer": {"inner": "value"}}')).toEqual({
				outer: { inner: 'value' }
			});
		});

		it('should parse objects with multiple fields', () => {
			const result = parseObject('{"name": "John", "age": 30, "active": true}');
			expect(result).toEqual({ name: 'John', age: 30, active: true });
		});

		it('should throw on invalid JSON', () => {
			expect(() => parseObject('{invalid}')).toThrow();
			expect(() => parseObject('{"unclosed"')).toThrow();
		});

		it('should throw on non-objects', () => {
			expect(() => parseObject('[]')).toThrow();
			expect(() => parseObject('"string"')).toThrow();
		});
	});

	describe('parseValue - auto-detection', () => {
		it('should auto-detect null', () => {
			expect(parseValue('null')).toBe(null);
			expect(parseValue('NULL')).toBe(null);
		});

		it('should auto-detect booleans', () => {
			expect(parseValue('true')).toBe(true);
			expect(parseValue('false')).toBe(false);
		});

		it('should auto-detect numbers', () => {
			expect(parseValue('123')).toBe(123);
			expect(parseValue('45.67')).toBe(45.67);
			expect(parseValue('-10')).toBe(-10);
		});

		it('should auto-detect quoted strings', () => {
			expect(parseValue('"hello"')).toBe('hello');
			expect(parseValue("'world'")).toBe('world');
		});

		it('should auto-detect arrays', () => {
			expect(parseValue('["a", "b"]')).toEqual(['a', 'b']);
		});

		it('should auto-detect objects', () => {
			expect(parseValue('{"key": "value"}')).toEqual({ key: 'value' });
		});

		it('should treat unquoted text as string', () => {
			expect(parseValue('hello')).toBe('hello');
			expect(parseValue('some-text')).toBe('some-text');
		});

		it('should handle empty string', () => {
			expect(parseValue('')).toBe('');
			expect(parseValue('   ')).toBe('');
		});
	});

	describe('needsQuotes', () => {
		it('should detect when quotes are needed', () => {
			expect(needsQuotes('[[wikilink]]')).toBe(true);
			expect(needsQuotes('Key: value')).toBe(true);
			expect(needsQuotes('true')).toBe(true);
			expect(needsQuotes('123')).toBe(true);
			expect(needsQuotes('null')).toBe(true);
		});

		it('should detect when quotes are not needed', () => {
			expect(needsQuotes('hello')).toBe(false);
			expect(needsQuotes('hello-world')).toBe(false);
		});

		it('should detect special characters', () => {
			expect(needsQuotes('value#comment')).toBe(true);
			expect(needsQuotes('value@test')).toBe(true);
			expect(needsQuotes('value{test}')).toBe(true);
		});

		it('should detect leading/trailing whitespace', () => {
			expect(needsQuotes(' hello')).toBe(true);
			expect(needsQuotes('hello ')).toBe(true);
		});
	});

	describe('Edge cases', () => {
		it('should handle Unicode text', () => {
			expect(parseString('"ॐ नमः शिवाय"')).toBe('ॐ नमः शिवाय');
			expect(parseValue('"ॐ नमः शिवाय"')).toBe('ॐ नमः शिवाय');
		});

		it('should handle emojis', () => {
			expect(parseString('"😊 🎉"')).toBe('😊 🎉');
		});

		it('should handle wikilinks in quotes', () => {
			expect(parseString('"[[Great Gatsby]]"')).toBe('[[Great Gatsby]]');
			expect(parseString('"[[Page|Alias]]"')).toBe('[[Page|Alias]]');
		});

		it('should handle quotes inside strings', () => {
			expect(parseString('"He said \\"hello\\""')).toBe('He said "hello"');
			expect(parseString("'She said \"hi\"'")).toBe('She said "hi"');
		});

		it('should handle complex escape sequences', () => {
			expect(parseString('"Line 1\\nLine 2\\tTabbed"')).toBe('Line 1\nLine 2\tTabbed');
		});
	});
});
