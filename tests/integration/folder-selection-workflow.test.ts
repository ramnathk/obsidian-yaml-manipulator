/**
 * Folder Selection Workflow Integration Tests
 * Tests the complete folder selection workflow in RuleBuilderModal
 */

import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { tick } from 'svelte';
import RuleBuilderModal from '../../src/ui/RuleBuilderModal.svelte';
import { createNewRule } from '../../src/storage/ruleStorage';
import { initI18n } from '../../src/i18n';

// Initialize i18n before all tests
beforeAll(() => {
	initI18n();
});

// Mock the async functions
vi.mock('../../src/core/fileScanner', () => ({
	scanFiles: vi.fn().mockResolvedValue({
		matched: [
			{ path: 'test1.md', basename: 'test1', name: 'test1.md', extension: 'md' },
			{ path: 'test2.md', basename: 'test2', name: 'test2.md', extension: 'md' }
		],
		skipped: 0,
		errors: []
	})
}));

vi.mock('../../src/core/batchProcessor', () => ({
	processBatch: vi.fn().mockResolvedValue({
		results: [],
		totalFiles: 0,
		successCount: 0,
		errorCount: 0
	})
}));

// Mock Obsidian App with vault and file scanner
const createMockPlugin = (folders: string[] = []) => {
	const mockVault = {
		getAllFolders: vi.fn(() => folders.map(path => ({ path }))),
		getMarkdownFiles: vi.fn(() => [
			{ path: 'Projects/Work/task1.md', basename: 'task1' },
			{ path: 'Projects/Personal/note1.md', basename: 'note1' },
			{ path: 'Notes/Daily/log1.md', basename: 'log1' },
		]),
		read: vi.fn(() => Promise.resolve('---\nstatus: draft\n---\n\nContent')),
		modify: vi.fn(() => Promise.resolve())
	};

	return {
		app: {
			vault: mockVault
		},
		data: {
			rules: [],
			settings: {
				defaultBackup: true,
				debug: false
			}
		}
	};
};

describe('Folder Selection Workflow (E2E)', () => {
	describe('TC-E2E-1: Folder Scope Selection with Autocomplete', () => {
		it('should filter multiple folders based on user input', async () => {
			const mockPlugin = createMockPlugin([
				'Projects/Work',
				'Projects/Personal',
				'Projects/Archive',
				'Notes/Daily',
				'Notes/Weekly',
				'Archive',
				'Sadhana Journal/Sadhana Logs'
			]);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			await tick();

			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Get folder input
			await tick();
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			expect(folderInput).toBeInTheDocument();

			// Type "proj" - should show only Projects folders
			await fireEvent.input(folderInput, { target: { value: 'proj' } });
			await tick();

			await waitFor(() => {
				// Should show all 3 Projects folders
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
				expect(screen.getByText('Projects/Personal')).toBeInTheDocument();
				expect(screen.getByText('Projects/Archive')).toBeInTheDocument();

				// Should NOT show non-matching folders
				expect(screen.queryByText('Notes/Daily')).not.toBeInTheDocument();
				expect(screen.queryByText('Archive')).not.toBeInTheDocument();
				expect(screen.queryByText('Sadhana Journal/Sadhana Logs')).not.toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it('should perform case-insensitive folder filtering', async () => {
			const mockPlugin = createMockPlugin([
				'Projects/Work',
				'projects/personal',
				'PROJECTS/Archive',
				'Notes/Daily'
			]);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			await tick();

			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Get folder input
			await tick();
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;

			// Type "WORK" in all caps
			await fireEvent.input(folderInput, { target: { value: 'WORK' } });
			await tick();

			await waitFor(() => {
				// Should match case-insensitively
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			}, { timeout: 3000 });

			// Clear and try lowercase "projects"
			await fireEvent.input(folderInput, { target: { value: '' } });
			await fireEvent.input(folderInput, { target: { value: 'projects' } });
			await tick();

			await waitFor(() => {
				// Should match all variations of "projects"
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
				expect(screen.getByText('projects/personal')).toBeInTheDocument();
				expect(screen.getByText('PROJECTS/Archive')).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it('should show folder autocomplete when folder scope is selected', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work', 'Projects/Personal', 'Notes/Daily']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select "Folder" scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Autocomplete input should appear
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			expect(folderInput).toBeInTheDocument();

			// Type to trigger autocomplete
			await fireEvent.input(folderInput, { target: { value: 'proj' } });
			await tick();

			// Should show matching folders
			await waitFor(() => {
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
				expect(screen.getByText('Projects/Personal')).toBeInTheDocument();
			}, { timeout: 5000 });
		});

		it('should allow user to select folder from autocomplete', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work', 'Projects/Personal']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select "Folder" scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Get folder input
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;

			// Type to trigger autocomplete
			await fireEvent.input(folderInput, { target: { value: 'work' } });

			// Wait for suggestions
			await waitFor(() => {
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			});

			// Click on suggestion
			const suggestion = screen.getByText('Projects/Work');
			await fireEvent.mouseDown(suggestion);

			// Input value should be updated
			expect(folderInput.value).toBe('Projects/Work');

			// Suggestions should be hidden
			await waitFor(() => {
				expect(screen.queryByText('Projects/Personal')).not.toBeInTheDocument();
			});
		});

		it('should allow keyboard navigation in folder autocomplete', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work', 'Projects/Personal', 'Notes/Daily']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select "Folder" scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Get folder input
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;

			// Type to trigger autocomplete
			await fireEvent.input(folderInput, { target: { value: 'proj' } });

			// Wait for suggestions
			await waitFor(() => {
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			});

			// Navigate down with arrow key
			await fireEvent.keyDown(folderInput, { key: 'ArrowDown' });

			// First item should be selected
			const selectedItem = container.querySelector('.suggestion-item.selected');
			expect(selectedItem).toBeInTheDocument();
			expect(selectedItem?.textContent).toContain('Projects/Work');

			// Press Enter to select
			await fireEvent.keyDown(folderInput, { key: 'Enter' });

			// Input value should be updated
			expect(folderInput.value).toBe('Projects/Work');
		});
	});

	describe('TC-E2E-2: Folder Selection in Rule Workflow', () => {
		it('should create rule with folder scope and validate', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work', 'Notes/Daily']);

			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Enter rule name
			const nameInput = screen.getByPlaceholderText(/My Rule/i);
			await fireEvent.input(nameInput, { target: { value: 'Update work tasks' } });

			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Wait for folder input to appear
			const folderInput = await screen.findByPlaceholderText(/folder\/path/i) as HTMLInputElement;
			await fireEvent.input(folderInput, { target: { value: 'work' } });

			// Wait and select
			await waitFor(() => {
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			});
			await fireEvent.mouseDown(screen.getByText('Projects/Work'));

			// Enter condition
			const conditionInput = screen.getByPlaceholderText(/status = "draft"/i);
			await fireEvent.input(conditionInput, { target: { value: 'status = "draft"' } });

			// Enter action
			const actionInput = screen.getByPlaceholderText(/SET status "published"/i);
			await fireEvent.input(actionInput, { target: { value: 'SET status "published"' } });

			// Click validate
			const validateButton = screen.getByRole('button', { name: /Validate/i });
			await fireEvent.click(validateButton);

			// Should NOT show validation errors
			await waitFor(() => {
				expect(screen.queryByText(/Invalid condition/i)).not.toBeInTheDocument();
				expect(screen.queryByText(/Invalid action/i)).not.toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it('should persist folder selection after autocomplete selection', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work', 'Projects/Personal']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			await tick();

			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Wait for folder input to appear
			await tick();
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			expect(folderInput).toBeInTheDocument();

			// Type to show autocomplete
			await fireEvent.input(folderInput, { target: { value: 'work' } });
			await tick();

			// Wait for suggestions and select
			await waitFor(() => {
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			}, { timeout: 3000 });
			await fireEvent.mouseDown(screen.getByText('Projects/Work'));

			// Folder value should persist
			expect(folderInput.value).toBe('Projects/Work');

			// Enter rule details
			const conditionInput = screen.getByPlaceholderText(/status = "draft"/i);
			await fireEvent.input(conditionInput, { target: { value: 'status = "draft"' } });

			// Folder selection should still be there
			expect(folderInput.value).toBe('Projects/Work');

			// Change scope to vault
			const vaultRadio = screen.getByLabelText(/Entire vault/i);
			await fireEvent.click(vaultRadio);

			// Folder input should be hidden
			const folderInputHidden = container.querySelector('input[type="text"][placeholder*="folder"]');
			expect(folderInputHidden).not.toBeInTheDocument();

			// Switch back to folder scope
			await fireEvent.click(folderRadio);
			await tick();

			// Folder input should reappear (folder path preserved in component state)
			const folderInputAfter = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			expect(folderInputAfter).toBeInTheDocument();
			// Value is preserved (good UX - prevents accidental data loss)
			expect(folderInputAfter.value).toBe('Projects/Work');
		});

		it('should handle invalid folder path gracefully', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Type invalid folder path
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			await fireEvent.input(folderInput, { target: { value: 'NonExistent/Folder' } });

			// No suggestions should appear
			expect(screen.queryByText('NonExistent/Folder')).not.toBeInTheDocument();

			// Can still proceed with validation (will show no files found)
			const conditionInput = screen.getByPlaceholderText(/status = "draft"/i);
			await fireEvent.input(conditionInput, { target: { value: 'status = "draft"' } });

			const actionInput = screen.getByPlaceholderText(/SET status "published"/i);
			await fireEvent.input(actionInput, { target: { value: 'SET status "published"' } });

			// Validate should work
			const validateButton = screen.getByRole('button', { name: /Validate/i });
			await fireEvent.click(validateButton);

			// Should NOT show validation errors (even if no files match)
			await waitFor(() => {
				expect(screen.queryByText(/Invalid condition/i)).not.toBeInTheDocument();
				expect(screen.queryByText(/Invalid action/i)).not.toBeInTheDocument();
			}, { timeout: 3000 });
		});
	});

	describe('TC-E2E-3: Folder Selection Edge Cases', () => {
		it('should handle vault with no folders', async () => {
			const mockPlugin = createMockPlugin([]);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Folder input should appear
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			expect(folderInput).toBeInTheDocument();

			// Type to trigger autocomplete
			await fireEvent.input(folderInput, { target: { value: 'any' } });

			// Only root folder "/" should be available
			// (No suggestions shown because no match, but root is always in the list)
		});

		it('should show root folder (/) in autocomplete', async () => {
			const mockPlugin = createMockPlugin(['Projects']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Type "/" to show root
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			await fireEvent.input(folderInput, { target: { value: '/' } });

			// Should show root folder
			await waitFor(() => {
				expect(screen.getByText('/')).toBeInTheDocument();
			});

			// Select root
			await fireEvent.mouseDown(screen.getByText('/'));

			// Input value should be "/"
			expect(folderInput.value).toBe('/');
		});

		it('should allow manual entry of folder path', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Type full path manually without selecting from dropdown
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			await fireEvent.input(folderInput, { target: { value: 'Projects/Work' } });

			// Input value should be set
			expect(folderInput.value).toBe('Projects/Work');

			// Can proceed with this value even if not selected from dropdown
			const conditionInput = screen.getByPlaceholderText(/status = "draft"/i);
			await fireEvent.input(conditionInput, { target: { value: 'status = "draft"' } });

			const actionInput = screen.getByPlaceholderText(/SET status "published"/i);
			await fireEvent.input(actionInput, { target: { value: 'SET status "published"' } });

			const validateButton = screen.getByRole('button', { name: /Validate/i });
			await fireEvent.click(validateButton);

			// Should NOT show validation errors
			await waitFor(() => {
				expect(screen.queryByText(/Invalid condition/i)).not.toBeInTheDocument();
				expect(screen.queryByText(/Invalid action/i)).not.toBeInTheDocument();
			}, { timeout: 3000 });
		});
	});

	describe('TC-E2E-4: Scope Switching', () => {
		it('should clear folder selection when switching to vault scope', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Select folder scope and select a folder
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]') as HTMLInputElement;
			await fireEvent.input(folderInput, { target: { value: 'work' } });

			await waitFor(() => {
				expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			});
			await fireEvent.mouseDown(screen.getByText('Projects/Work'));

			expect(folderInput.value).toBe('Projects/Work');

			// Switch to Vault scope
			const vaultRadio = screen.getByLabelText(/Entire vault/i);
			await fireEvent.click(vaultRadio);

			// Folder input should be hidden
			const folderInputAfter = container.querySelector('input[type="text"][placeholder*="folder"]');
			expect(folderInputAfter).not.toBeInTheDocument();
		});

		it('should show folder input again when switching back to folder scope', async () => {
			const mockPlugin = createMockPlugin(['Projects/Work']);

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});


			await tick();
			// Start with vault scope (default)
			const vaultRadio = screen.getByLabelText(/Entire vault/i);
			expect(vaultRadio).toBeChecked();

			// Switch to folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);
			await tick();

			// Folder input should appear
			const folderInput = container.querySelector('input[type="text"][placeholder*="folder"]');
			expect(folderInput).toBeInTheDocument();
		});
	});
});
