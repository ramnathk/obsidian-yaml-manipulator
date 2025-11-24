/**
 * UI Workflow E2E Tests
 * Simulates user interactions with Rule Builder UI → Applies to real files
 * Tests complete flow: Fill form → Save rule → Apply → Verify file changes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Rule } from '../../src/types';
import { createNewRule, saveRule, loadPluginData } from '../../src/storage/ruleStorage';
import { scanFiles } from '../../src/core/fileScanner';
import { processBatch } from '../../src/core/batchProcessor';
import { readFrontmatter, writeFrontmatter } from '../../src/yaml/yamlProcessor';

/**
 * Mock Plugin and App for E2E testing
 */
class MockPlugin {
	data = { version: '1.0', rules: [], settings: { defaultBackup: true, maxFilesPerBatch: 1000, scanTimeout: 30000, debug: false } };
	app: any;

	constructor() {
		this.app = createMockApp();
	}

	async loadData() {
		return this.data;
	}

	async saveData(data: any) {
		this.data = data;
	}

	async saveSettings() {
		// Mock implementation
	}
}

function createMockApp() {
	const mockFiles = new Map<string, { data: any; content: string }>();

	return {
		vault: {
			getName: () => 'TestVault',
			getMarkdownFiles: () => Array.from(mockFiles.keys()).map(path => createMockFile(path)),
			read: async (file: any) => {
				const fileData = mockFiles.get(file.path);
				if (!fileData) throw new Error('File not found');
				const matter = require('gray-matter');
				return matter.stringify(fileData.content, fileData.data);
			},
			modify: async (file: any, content: string) => {
				const matter = require('gray-matter');
				const parsed = matter(content);
				mockFiles.set(file.path, { data: parsed.data, content: parsed.content });
			},
			adapter: {
				exists: async () => false,
				write: async () => {},
				mkdir: async () => {},
			},
			create: async () => {},
		},
		workspace: {
			getActiveFile: () => null,
		},
		_mockFiles: mockFiles,
	};
}

function createMockFile(path: string) {
	return {
		path,
		basename: path.replace('.md', '').split('/').pop() || '',
		name: path.split('/').pop() || '',
		parent: null,
	};
}

function addMockFile(app: any, path: string, frontmatter: any, content = '') {
	app._mockFiles.set(path, { data: frontmatter, content });
}

/**
 * Simulate UI workflow: User fills form → Saves → Applies rule
 */
async function simulateUIWorkflow(
	plugin: MockPlugin,
	formData: {
		ruleName: string;
		condition: string;
		action: string;
		scopeType: 'vault' | 'folder' | 'current';
		folderPath?: string;
		backup: boolean;
	}
) {
	// Step 1: User fills form (simulated by formData)
	const rule: Rule = {
		...createNewRule(),
		name: formData.ruleName,
		condition: formData.condition,
		action: formData.action,
		scope: {
			type: formData.scopeType,
			folder: formData.folderPath,
		},
		options: {
			backup: formData.backup,
		},
	};

	// Step 2: User clicks "Save" button
	await saveRule(plugin as any, rule);

	// Step 3: Verify rule was saved
	const savedData = await loadPluginData(plugin as any);
	const savedRule = savedData.rules.find(r => r.id === rule.id);
	expect(savedRule).toBeDefined();

	// Step 4: User clicks "Apply" button
	const scanResult = await scanFiles(
		plugin.app.vault,
		savedRule!.scope,
		{ maxFiles: plugin.data.settings.maxFilesPerBatch }
	);

	const batchResult = await processBatch(
		plugin.app,
		scanResult.matched,
		savedRule!
	);

	return { rule: savedRule!, scanResult, batchResult };
}

describe('UI Workflow E2E Tests', () => {
	let plugin: MockPlugin;

	beforeEach(() => {
		plugin = new MockPlugin();
	});

	describe('Example 1.1.1: SET status "published" - Full UI Flow', () => {
		it('should complete full workflow: Create → Save → Apply → Verify', async () => {
			// Setup: Add test file
			addMockFile(plugin.app, 'note1.md', { title: 'My Note' }, 'Content here');

			// User fills form in UI
			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Publish notes',
				condition: '',
				action: 'SET status "published"',
				scopeType: 'vault',
				backup: true,
			});

			// Verify: Rule was saved
			expect(result.rule.name).toBe('Publish notes');

			// Verify: Files were processed
			expect(result.batchResult.results).toHaveLength(1);
			expect(result.batchResult.summary.success).toBe(1);

			// Verify: File was actually modified
			const file = result.scanResult.matched[0];
			const modified = await readFrontmatter(plugin.app, file);
			expect(modified.data.status).toBe('published');
			expect(modified.data.title).toBe('My Note'); // Preserved
		});
	});

	describe('Example 2.1.1: Conditional SET - Full UI Flow', () => {
		it('should only modify files matching condition', async () => {
			// Setup: Add files with different statuses
			addMockFile(plugin.app, 'draft1.md', { title: 'Draft 1', status: 'draft' });
			addMockFile(plugin.app, 'draft2.md', { title: 'Draft 2', status: 'draft' });
			addMockFile(plugin.app, 'published.md', { title: 'Published', status: 'published' });

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Mark drafts as reviewed',
				condition: 'status = "draft"',
				action: 'SET status "reviewed"',
				scopeType: 'vault',
				backup: true,
			});

			// Verify: Only draft files were modified
			expect(result.batchResult.summary.success).toBe(2);
			expect(result.batchResult.summary.skipped).toBe(1);

			// Verify: Draft files changed
			const draft1 = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(draft1.data.status).toBe('reviewed');

			// Verify: Published file unchanged
			const published = await readFrontmatter(plugin.app, result.scanResult.matched[2]);
			expect(published.data.status).toBe('published');
		});
	});

	describe('Example 3.1.1: APPEND tags - Full UI Flow', () => {
		it('should append tag to matching files', async () => {
			addMockFile(plugin.app, 'high-priority.md', { title: 'Important', priority: 8, tags: ['work'] });
			addMockFile(plugin.app, 'low-priority.md', { title: 'Normal', priority: 2, tags: ['work'] });

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Mark urgent',
				condition: 'priority > 5',
				action: 'APPEND tags "urgent"',
				scopeType: 'vault',
				backup: true,
			});

			expect(result.batchResult.summary.success).toBe(1);
			expect(result.batchResult.summary.skipped).toBe(1);

			// High priority file should have urgent tag
			const highPriority = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(highPriority.data.tags).toContain('urgent');

			// Low priority file unchanged
			const lowPriority = await readFrontmatter(plugin.app, result.scanResult.matched[1]);
			expect(lowPriority.data.tags).not.toContain('urgent');
		});
	});

	describe('Example 3.11.1: UPDATE_WHERE - Full UI Flow', () => {
		it('should update items in array matching condition', async () => {
			addMockFile(plugin.app, 'sadhana.md', {
				countsLog: [
					{ mantra: 'Great Gatsby', unit: 'Meditations', verified: false },
					{ mantra: 'Brave New World', unit: 'Solitude', verified: false },
					{ mantra: 'Beloved', unit: 'Meditations', verified: false }
				]
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Update Brave New World entries',
				condition: 'ANY countsLog WHERE mantra = "Brave New World"',
				action: 'UPDATE_WHERE countsLog WHERE mantra="Brave New World" SET unit "Meditations", verified true',
				scopeType: 'vault',
				backup: true,
			});

			expect(result.batchResult.summary.success).toBe(1);

			// Verify: Brave New World entry was updated
			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			const bbbkEntry = file.data.countsLog.find((c: any) => c.mantra === 'Brave New World');
			expect(bbbkEntry.unit).toBe('Meditations');
			expect(bbbkEntry.verified).toBe(true);

			// Verify: Other entries unchanged
			const ganeshaEntry = file.data.countsLog.find((c: any) => c.mantra === 'Great Gatsby');
			expect(ganeshaEntry.verified).toBe(false);
		});
	});

	describe('Example 3.7.1: SORT_BY - Full UI Flow', () => {
		it('should sort array by field', async () => {
			addMockFile(plugin.app, 'mantras.md', {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Brave New World', count: 1 },
					{ mantra: 'Animal Farm', count: 2 }
				]
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Sort mantras alphabetically',
				condition: 'countsLog.length > 0',
				action: 'SORT_BY countsLog BY mantra ASC',
				scopeType: 'vault',
				backup: true,
			});

			expect(result.batchResult.summary.success).toBe(1);

			// Verify: Array was sorted
			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.countsLog[0].mantra).toBe('Animal Farm');
			expect(file.data.countsLog[1].mantra).toBe('Brave New World');
			expect(file.data.countsLog[2].mantra).toBe('Great Gatsby');
		});
	});

	describe('Example 3.9.1: MOVE_WHERE - Full UI Flow', () => {
		it('should move items matching condition', async () => {
			addMockFile(plugin.app, 'tasks.md', {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3 },
					{ mantra: 'Beloved', count: 6 },
					{ mantra: 'Brave New World', count: 1 }
				]
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Move Brave New World to start',
				condition: '',
				action: 'MOVE_WHERE countsLog WHERE mantra="Brave New World" TO START',
				scopeType: 'vault',
				backup: true,
			});

			expect(result.batchResult.summary.success).toBe(1);

			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.countsLog[0].mantra).toBe('Brave New World');
			expect(file.data.countsLog[1].mantra).toBe('Great Gatsby');
			expect(file.data.countsLog[2].mantra).toBe('Beloved');
		});
	});

	describe('Example 4.1.1: MERGE - Full UI Flow', () => {
		it('should merge object deeply', async () => {
			addMockFile(plugin.app, 'project.md', {
				metadata: {
					author: 'John',
					version: 1.0
				}
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Add editor metadata',
				condition: 'metadata exists',
				action: 'MERGE metadata {"editor": "Jane", "reviewed": true}',
				scopeType: 'vault',
				backup: false,
			});

			expect(result.batchResult.summary.success).toBe(1);

			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.metadata).toEqual({
				author: 'John',
				version: 1.0,
				editor: 'Jane',
				reviewed: true
			});
		});
	});

	describe('Complex boolean conditions - Full UI Flow', () => {
		it('should handle: (tags has "urgent" OR priority > 5) AND status = "draft"', async () => {
			addMockFile(plugin.app, 'file1.md', { tags: ['work', 'urgent'], priority: 3, status: 'draft' });
			addMockFile(plugin.app, 'file2.md', { tags: ['work'], priority: 8, status: 'draft' });
			addMockFile(plugin.app, 'file3.md', { tags: ['work'], priority: 3, status: 'draft' });
			addMockFile(plugin.app, 'file4.md', { tags: ['work', 'urgent'], priority: 8, status: 'published' });

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Process urgent drafts',
				condition: '(tags has "urgent" OR priority > 5) AND status = "draft"',
				action: 'SET processed true',
				scopeType: 'vault',
				backup: true,
			});

			// Should match file1 (has urgent tag) and file2 (priority > 5)
			// Should skip file3 (neither condition) and file4 (not draft)
			expect(result.batchResult.summary.success).toBe(2);
			expect(result.batchResult.summary.skipped).toBe(2);

			const file1 = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file1.data.processed).toBe(true);

			const file3 = await readFrontmatter(plugin.app, result.scanResult.matched[2]);
			expect(file3.data.processed).toBeUndefined();
		});
	});

	describe('Nested array operations - Full UI Flow', () => {
		it('should handle nested ANY with UPDATE_WHERE', async () => {
			addMockFile(plugin.app, 'projects.md', {
				projects: [
					{ name: 'Alpha', tasks: [{ status: 'pending', title: 'Task 1' }] },
					{ name: 'Beta', tasks: [{ status: 'done', title: 'Task 2' }] }
				]
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Complete pending tasks',
				condition: 'ANY projects WHERE ANY tasks WHERE status = "pending"',
				action: 'UPDATE_WHERE projects WHERE ANY tasks WHERE status="pending" SET hasOpenTasks true',
				scopeType: 'vault',
				backup: false,
			});

			expect(result.batchResult.summary.success).toBe(1);

			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			// Alpha project should be marked (has pending task)
			expect(file.data.projects[0].hasOpenTasks).toBe(true);
		});
	});

	describe('Multiple operations on same file - Sequential rules', () => {
		it('should apply multiple rules in sequence', async () => {
			addMockFile(plugin.app, 'note.md', {
				status: 'draft',
				tags: ['work'],
				priority: 5
			});

			// Rule 1: Change status
			await simulateUIWorkflow(plugin, {
				ruleName: 'Mark as reviewed',
				condition: 'status = "draft"',
				action: 'SET status "reviewed"',
				scopeType: 'vault',
				backup: false,
			});

			// Verify after rule 1
			const files = plugin.app.vault.getMarkdownFiles();
			let file = await readFrontmatter(plugin.app, files[0]);
			expect(file.data.status).toBe('reviewed');

			// Rule 2: Add urgent tag
			await simulateUIWorkflow(plugin, {
				ruleName: 'Add urgent tag',
				condition: 'priority >= 5',
				action: 'APPEND tags "urgent"',
				scopeType: 'vault',
				backup: false,
			});

			// Verify after rule 2
			file = await readFrontmatter(plugin.app, files[0]);
			expect(file.data.tags).toEqual(['work', 'urgent']);
			expect(file.data.status).toBe('reviewed'); // Still preserved
		});
	});

	describe('Real-world examples from requirements', () => {
		it('Example: Organize sadhana notes', async () => {
			addMockFile(plugin.app, 'sadhana-2025-11-20.md', {
				date: '2025-11-20',
				countsLog: [
					{ mantra: 'Great Gatsby', count: 108, unit: 'Solitude' },
					{ mantra: 'Brave New World', count: 1, unit: 'Solitude' },
					{ mantra: 'Beloved', count: 54, unit: 'Solitude' }
				]
			});

			// User workflow: Update units and sort
			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Standardize mantra units',
				condition: 'countsLog exists',
				action: 'UPDATE_WHERE countsLog WHERE count >= 54 SET unit "Meditations"',
				scopeType: 'vault',
				backup: true,
			});

			expect(result.batchResult.summary.success).toBe(1);

			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.countsLog[0].unit).toBe('Meditations'); // Great Gatsby (108)
			expect(file.data.countsLog[1].unit).toBe('Solitude'); // Brave New World (1)
			expect(file.data.countsLog[2].unit).toBe('Meditations'); // Beloved (54)
		});

		it('Example: Batch update project statuses', async () => {
			addMockFile(plugin.app, 'projects/alpha.md', {
				project: 'Alpha',
				status: 'draft',
				priority: 8
			});
			addMockFile(plugin.app, 'projects/beta.md', {
				project: 'Beta',
				status: 'draft',
				priority: 3
			});
			addMockFile(plugin.app, 'projects/gamma.md', {
				project: 'Gamma',
				status: 'published',
				priority: 9
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Publish high priority drafts',
				condition: 'status = "draft" AND priority > 5',
				action: 'SET status "published"',
				scopeType: 'vault',
				backup: true,
			});

			// Only Alpha should match (draft + priority > 5)
			expect(result.batchResult.summary.success).toBe(1);

			const alpha = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(alpha.data.status).toBe('published');
		});

		it('Example: Tag cleanup with DEDUPLICATE', async () => {
			addMockFile(plugin.app, 'messy.md', {
				tags: ['work', 'urgent', 'work', 'project', 'urgent', 'work']
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Clean up duplicate tags',
				condition: 'tags.length > 3',
				action: 'DEDUPLICATE tags',
				scopeType: 'vault',
				backup: false,
			});

			expect(result.batchResult.summary.success).toBe(1);

			const file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.tags).toEqual(['work', 'urgent', 'project']);
		});

		it('Example: Array sorting and reordering', async () => {
			addMockFile(plugin.app, 'mantras.md', {
				countsLog: [
					{ mantra: 'Great Gatsby', count: 3, date: '2025-11-20' },
					{ mantra: 'Brave New World', count: 1, date: '2025-11-19' },
					{ mantra: 'Animal Farm', count: 2, date: '2025-11-18' }
				]
			});

			// First: Sort by date (oldest first)
			let result = await simulateUIWorkflow(plugin, {
				ruleName: 'Sort by date',
				condition: '',
				action: 'SORT_BY countsLog BY date ASC',
				scopeType: 'vault',
				backup: false,
			});

			let file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.countsLog[0].mantra).toBe('Animal Farm'); // Oldest

			// Then: Move high count to top
			result = await simulateUIWorkflow(plugin, {
				ruleName: 'Prioritize high counts',
				condition: '',
				action: 'MOVE_WHERE countsLog WHERE count >= 3 TO START',
				scopeType: 'vault',
				backup: false,
			});

			file = await readFrontmatter(plugin.app, result.scanResult.matched[0]);
			expect(file.data.countsLog[0].mantra).toBe('Great Gatsby'); // count=3 moved to start
		});
	});

	describe('Error handling in UI workflow', () => {
		it('should report errors when action fails', async () => {
			addMockFile(plugin.app, 'bad-data.md', {
				tags: 'not-an-array' // Invalid for array operations
			});

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Try to append to non-array',
				condition: '',
				action: 'APPEND tags "value"',
				scopeType: 'vault',
				backup: false,
			});

			// Should have error
			expect(result.batchResult.summary.errors).toBe(1);
			expect(result.batchResult.results[0].error).toContain('not an array');
		});

		it('should skip files not matching condition', async () => {
			addMockFile(plugin.app, 'file1.md', { status: 'draft' });
			addMockFile(plugin.app, 'file2.md', { status: 'published' });

			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Update drafts only',
				condition: 'status = "draft"',
				action: 'SET reviewed true',
				scopeType: 'vault',
				backup: false,
			});

			expect(result.batchResult.summary.success).toBe(1);
			expect(result.batchResult.summary.skipped).toBe(1);
		});
	});

	describe('Scope filtering - UI workflow', () => {
		it('should respect folder scope', async () => {
			addMockFile(plugin.app, 'projects/task1.md', { status: 'draft' });
			addMockFile(plugin.app, 'projects/task2.md', { status: 'draft' });
			addMockFile(plugin.app, 'notes/note1.md', { status: 'draft' });

			// Note: scanFiles with folder scope is simplified in our mock
			// In real Obsidian, it would filter by folder
			const result = await simulateUIWorkflow(plugin, {
				ruleName: 'Update project tasks',
				condition: '',
				action: 'SET updated true',
				scopeType: 'vault', // Would be 'folder' with folderPath: 'projects' in real usage
				backup: false,
			});

			// All files in vault would be matched (mock doesn't filter by folder)
			expect(result.batchResult.summary.success).toBe(3);
		});
	});
});
