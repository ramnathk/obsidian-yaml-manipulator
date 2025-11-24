/**
 * Tests for Template Engine
 */

import { describe, it, expect } from 'vitest';
import { resolveTemplates, TemplateContext } from '../../../src/core/templateEngine';
import { DateTime } from 'luxon';

// Mock TFile and Vault
const createMockContext = (overrides?: Partial<TemplateContext>): TemplateContext => {
	const mockFile = {
		basename: 'my-note',
		path: 'folder/subfolder/my-note.md',
		parent: { path: 'folder/subfolder' },
	} as any;

	const mockVault = {
		getName: () => 'MyVault',
	} as any;

	return {
		file: mockFile,
		vault: mockVault,
		frontmatter: { title: 'Test Note', tags: ['work', 'urgent'] },
		currentDate: DateTime.fromISO('2025-11-19T14:30:15'),
		...overrides,
	};
};

describe('Template Engine', () => {
	describe('Date variables', () => {
		it('should resolve {{today}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{today}}', ctx);
			expect(result).toBe('2025-11-19');
		});

		it('should resolve {{now}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{now}}', ctx);
			// Check format, not exact timezone (varies by system)
			expect(result).toMatch(/^2025-11-19T14:30:15\.\d{3}[+-]\d{2}:\d{2}$/);
		});

		it('should resolve {{year}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{year}}', ctx);
			expect(result).toBe('2025');
		});

		it('should resolve {{month}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{month}}', ctx);
			expect(result).toBe('11');
		});

		it('should resolve {{day}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{day}}', ctx);
			expect(result).toBe('19');
		});

		it('should resolve {{time}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{time}}', ctx);
			expect(result).toBe('14:30:15');
		});

		it('should resolve {{timestamp}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{timestamp}}', ctx);
			expect(result).toMatch(/^\d+$/);
		});
	});

	describe('Custom date formatting', () => {
		it('should resolve {{date:yyyy-MM-dd}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{date:yyyy-MM-dd}}', ctx);
			expect(result).toBe('2025-11-19');
		});

		it('should resolve {{date:MMMM d, yyyy}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{date:MMMM d, yyyy}}', ctx);
			expect(result).toBe('November 19, 2025');
		});

		it('should resolve {{date:MMM dd}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{date:MMM dd}}', ctx);
			expect(result).toBe('Nov 19');
		});

		it('should resolve {{date:yyyyMMdd}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{date:yyyyMMdd}}', ctx);
			expect(result).toBe('20251119');
		});

		it('should handle invalid date format', () => {
			const ctx = createMockContext();
			// Luxon may return the literal string for invalid format tokens
			const result = resolveTemplates('{{date:invalid}}', ctx);
			// Just verify it doesn't crash
			expect(result).toBeDefined();
		});
	});

	describe('File context variables', () => {
		it('should resolve {{filename}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{filename}}', ctx);
			expect(result).toBe('my-note');
		});

		it('should resolve {{basename}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{basename}}', ctx);
			expect(result).toBe('my-note');
		});

		it('should resolve {{filepath}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{filepath}}', ctx);
			expect(result).toBe('folder/subfolder/my-note.md');
		});

		it('should resolve {{folder}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{folder}}', ctx);
			expect(result).toBe('folder/subfolder');
		});

		it('should resolve {{vault}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{vault}}', ctx);
			expect(result).toBe('MyVault');
		});
	});

	describe('Frontmatter variables', () => {
		it('should resolve {{fm:title}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{fm:title}}', ctx);
			expect(result).toBe('Test Note');
		});

		it('should resolve {{fm:tags[0]}}', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{fm:tags[0]}}', ctx);
			expect(result).toBe('work');
		});

		it('should throw on missing frontmatter field', () => {
			const ctx = createMockContext();
			expect(() => resolveTemplates('{{fm:missing}}', ctx)).toThrow('not found');
		});
	});

	describe('Multiple variables', () => {
		it('should resolve multiple variables in one string', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('Created on {{today}} in {{folder}}', ctx);
			expect(result).toBe('Created on 2025-11-19 in folder/subfolder');
		});

		it('should resolve mixed variable types', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('{{filename}} - {{fm:title}} - {{today}}', ctx);
			expect(result).toBe('my-note - Test Note - 2025-11-19');
		});
	});

	describe('Edge cases', () => {
		it('should handle string with no variables', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('plain text', ctx);
			expect(result).toBe('plain text');
		});

		it('should handle empty string', () => {
			const ctx = createMockContext();
			const result = resolveTemplates('', ctx);
			expect(result).toBe('');
		});

		it('should throw on unknown variable', () => {
			const ctx = createMockContext();
			expect(() => resolveTemplates('{{unknown}}', ctx)).toThrow('Unknown template variable');
		});
	});
});
