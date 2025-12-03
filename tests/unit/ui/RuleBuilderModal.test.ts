/**
 * Svelte Component Tests for RuleBuilderModal
 * Tests UI interactions, validation, preview, and apply workflows
 */

import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RuleBuilderModal from '../../../src/ui/RuleBuilderModal.svelte';
import type { TFile } from 'obsidian';

// Mock the async functions
vi.mock('../../../src/core/fileScanner', () => ({
	scanFiles: vi.fn().mockResolvedValue({
		matched: [
			{
				path: 'test1.md',
				basename: 'test1',
				name: 'test1.md',
				extension: 'md'
			},
			{
				path: 'test2.md',
				basename: 'test2',
				name: 'test2.md',
				extension: 'md'
			}
		],
		skipped: 0,
		errors: []
	})
}));

vi.mock('../../../src/core/batchProcessor', () => ({
	processBatch: vi.fn().mockResolvedValue({
		results: [
			{
				file: { path: 'test1.md', basename: 'test1', name: 'test1.md' },
				status: 'success',
				modified: true,
				changes: ['Set status to "published"'],
				originalData: { status: 'draft' },
				newData: { status: 'published' },
				duration: 10
			},
			{
				file: { path: 'test2.md', basename: 'test2', name: 'test2.md' },
				status: 'skipped',
				modified: false,
				changes: [],
				duration: 5
			}
		],
		summary: { success: 1, warnings: 0, errors: 0, skipped: 1 }
	})
}));

describe('RuleBuilderModal UI Tests', () => {
	let mockPlugin: any;
	let mockFiles: TFile[];

	beforeEach(() => {
		// Clear any previous notices
		(global as any).clearLastNotice?.();

		// Create mock files
		mockFiles = [
			{
				path: 'test1.md',
				basename: 'test1',
				name: 'test1.md',
				extension: 'md',
				parent: null
			} as TFile,
			{
				path: 'test2.md',
				basename: 'test2',
				name: 'test2.md',
				extension: 'md',
				parent: null
			} as TFile
		];

		// Create mock plugin
		mockPlugin = {
			app: {
				vault: {
					getMarkdownFiles: vi.fn().mockReturnValue(mockFiles),
					read: vi.fn().mockResolvedValue('---\nstatus: draft\npriority: 5\n---\n\nContent'),
					modify: vi.fn().mockResolvedValue(undefined),
					adapter: {
						exists: vi.fn().mockResolvedValue(false),
						write: vi.fn().mockResolvedValue(undefined)
					}
				}
			},
			data: {
				rules: [],
				settings: {
					defaultBackup: true,
					scanTimeout: 30000,
					debug: false
				}
			},
			loadData: vi.fn().mockResolvedValue({
				rules: [],
				settings: {
					defaultBackup: true,
					scanTimeout: 30000,
					debug: false
				}
			}),
			saveData: vi.fn().mockResolvedValue(undefined),
			saveSettings: vi.fn().mockResolvedValue(undefined)
		};

		// Mock window.confirm
		global.confirm = vi.fn().mockReturnValue(true);
	});

	describe('Component Rendering', () => {
		it('should render rule builder form with all fields', () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			// Check for main elements
			expect(screen.getByText('YAML Rule Builder')).toBeInTheDocument();
			expect(screen.getByLabelText(/Rule Name/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Condition/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Action/i)).toBeInTheDocument();
			expect(screen.getByText(/Create backups/i)).toBeInTheDocument();
		});

		it('should render action buttons', () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Save Rule/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Validate/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Preview/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument();
		});

		it('should render scope radio buttons', () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/Entire Vault/i)).toBeInTheDocument();
			expect(screen.getByText(/Folder/i)).toBeInTheDocument();
			expect(screen.getByText(/Current File/i)).toBeInTheDocument();
		});
	});

	describe('Validation', () => {
		it('should show error for invalid condition syntax', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const conditionInput = screen.getByLabelText(/Condition/i);
			const validateBtn = screen.getByRole('button', { name: /Validate/i });

			// Enter invalid condition
			await fireEvent.input(conditionInput, {
				target: { value: 'status = ' } // Incomplete
			});

			await fireEvent.click(validateBtn);

			// Should show error
			await waitFor(() => {
				expect(screen.getByText(/Parser error|Invalid condition/i)).toBeInTheDocument();
			});
		});

		it('should show error when action is empty', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const actionInput = screen.getByLabelText(/Action/i);
			const validateBtn = screen.getByRole('button', { name: /Validate/i });

			// Leave action empty
			await fireEvent.input(actionInput, {
				target: { value: '' }
			});

			await fireEvent.click(validateBtn);

			// Should show error
			await waitFor(() => {
				expect(screen.getByText(/Action is required/i)).toBeInTheDocument();
			});
		});

		it('should show error for invalid action syntax', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const actionInput = screen.getByLabelText(/Action/i);
			const validateBtn = screen.getByRole('button', { name: /Validate/i });

			// Enter invalid action
			await fireEvent.input(actionInput, {
				target: { value: 'INVALID syntax here' }
			});

			await fireEvent.click(validateBtn);

			// Should show error
			await waitFor(() => {
				expect(screen.getByText(/Parser error|Invalid action/i)).toBeInTheDocument();
			});
		});

		it('should pass validation with valid inputs', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const conditionInput = screen.getByLabelText(/Condition/i);
			const actionInput = screen.getByLabelText(/Action/i);
			const validateBtn = screen.getByRole('button', { name: /Validate/i });

			// Enter valid inputs
			await fireEvent.input(conditionInput, {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(actionInput, {
				target: { value: 'SET status "published"' }
			});

			await fireEvent.click(validateBtn);

			// Should NOT show errors
			expect(screen.queryByText(/Invalid condition/i)).not.toBeInTheDocument();
			expect(screen.queryByText(/Invalid action/i)).not.toBeInTheDocument();
		});
	});

	describe('TC-9.1: Preview Workflow', () => {
		it('should show validation section when Preview clicked', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const conditionInput = screen.getByLabelText(/Condition/i);
			const actionInput = screen.getByLabelText(/Action/i);
			const previewBtn = screen.getByRole('button', { name: /Preview/i });

			// Fill valid rule
			await fireEvent.input(conditionInput, {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(actionInput, {
				target: { value: 'SET status "published"' }
			});

			// Initially validation section should not exist
			expect(screen.queryByText(/Preview Files/i)).not.toBeInTheDocument();

			// Click preview
			await fireEvent.click(previewBtn);

			// Validation section should appear
			await waitFor(() => {
				expect(screen.getByText(/Preview Files/i)).toBeInTheDocument();
			});

			// Preview Files tab should be active by default
			const previewTab = screen.getByRole('button', { name: /Preview Files/i });
			expect(previewTab).toHaveClass('active');
		});

		it('should preserve tab state when switching tabs', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			// Fill and preview
			await fireEvent.input(screen.getByLabelText(/Condition/i), {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(screen.getByLabelText(/Action/i), {
				target: { value: 'SET status "published"' }
			});
			await fireEvent.click(screen.getByRole('button', { name: /Preview/i }));

			await waitFor(() => {
				expect(screen.getByText(/Preview Files/i)).toBeInTheDocument();
			});

			// Switch to Test Sample tab
			const testTab = screen.getByRole('button', { name: /Test Sample/i });
			await fireEvent.click(testTab);

			await waitFor(() => {
				expect(testTab).toHaveClass('active');
			});

			// Switch back to Preview Files
			const previewTab = screen.getByRole('button', { name: /Preview Files/i });
			await fireEvent.click(previewTab);

			await waitFor(() => {
				expect(previewTab).toHaveClass('active');
			});
		});

		it('should reset preview flag when rule configuration changes', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const conditionInput = screen.getByLabelText(/Condition/i);
			const actionInput = screen.getByLabelText(/Action/i);
			const previewBtn = screen.getByRole('button', { name: /Preview/i });
			const applyBtn = screen.getByRole('button', { name: /Apply/i });

			// Fill and preview
			await fireEvent.input(conditionInput, {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(actionInput, {
				target: { value: 'SET status "published"' }
			});
			await fireEvent.click(previewBtn);

			await waitFor(() => {
				expect(screen.getByText(/Preview Files/i)).toBeInTheDocument();
			});

			// Now modify the action
			await fireEvent.input(actionInput, {
				target: { value: 'SET status "reviewed"' } // Changed
			});

			// Click Apply - should show warning because preview is stale
			await fireEvent.click(applyBtn);

			// Should call confirm with warning message
			expect(global.confirm).toHaveBeenCalledWith(
				expect.stringContaining("haven't previewed")
			);
		});

		it('should close validation section when X clicked', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			// Open preview
			await fireEvent.input(screen.getByLabelText(/Condition/i), {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(screen.getByLabelText(/Action/i), {
				target: { value: 'SET status "published"' }
			});
			await fireEvent.click(screen.getByRole('button', { name: /Preview/i }));

			await waitFor(() => {
				expect(screen.getByText(/Preview Files/i)).toBeInTheDocument();
			});

			// Click close button
			const closeBtn = screen.getByTitle(/Close validation panel/i);
			await fireEvent.click(closeBtn);

			// Validation section should disappear
			await waitFor(() => {
				expect(screen.queryByText(/Preview Files/i)).not.toBeInTheDocument();
			});
		});
	});

	describe('TC-6.1: Smart Warning System', () => {
		it('should show warning when Apply clicked without preview', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const conditionInput = screen.getByLabelText(/Condition/i);
			const actionInput = screen.getByLabelText(/Action/i);
			const applyBtn = screen.getByRole('button', { name: /Apply/i });

			// Fill rule
			await fireEvent.input(conditionInput, {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(actionInput, {
				target: { value: 'SET status "published"' }
			});

			// Click Apply WITHOUT previewing
			await fireEvent.click(applyBtn);

			// Should call confirm with warning
			expect(global.confirm).toHaveBeenCalledWith(
				expect.stringContaining("haven't previewed")
			);
		});

		it('should NOT show warning when Apply clicked after preview', async () => {
			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			const conditionInput = screen.getByLabelText(/Condition/i);
			const actionInput = screen.getByLabelText(/Action/i);
			const previewBtn = screen.getByRole('button', { name: /Preview/i });
			const applyBtn = screen.getByRole('button', { name: /Apply/i });

			// Fill rule
			await fireEvent.input(conditionInput, {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(actionInput, {
				target: { value: 'SET status "published"' }
			});

			// Click Preview first
			await fireEvent.click(previewBtn);

			// Wait for preview to complete by checking for results in the preview panel
			await waitFor(
				() => {
					// Check for file results in preview (test1.md should be listed)
					const previewSection = container.querySelector('.preview-files');
					expect(previewSection).toBeTruthy();
				},
				{ timeout: 3000 }
			);

			// Additional wait to ensure reactivity settles
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Reset confirm mock to track new calls
			(global.confirm as any).mockClear();

			// Now click Apply
			await fireEvent.click(applyBtn);

			// Should NOT call confirm (no warning) because we previewed
			expect(global.confirm).not.toHaveBeenCalled();
		});

		it('should allow user to cancel when warned about no preview', async () => {
			// Mock confirm to return false (user cancels)
			(global.confirm as any).mockReturnValue(false);

			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			await fireEvent.input(screen.getByLabelText(/Condition/i), {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(screen.getByLabelText(/Action/i), {
				target: { value: 'SET status "published"' }
			});

			const applyBtn = screen.getByRole('button', { name: /Apply/i });
			await fireEvent.click(applyBtn);

			// Confirm was called
			expect(global.confirm).toHaveBeenCalled();

			// vault.modify should NOT have been called (user cancelled)
			expect(mockPlugin.app.vault.modify).not.toHaveBeenCalled();
		});
	});

	describe('Saved Rules Management', () => {
		it('should load saved rules into dropdown', async () => {
			const savedRules = [
				{
					id: 'rule1',
					name: 'Publish Drafts',
					condition: 'status = "draft"',
					action: 'SET status "published"',
					scope: { type: 'vault', folder: '' },
					options: { backup: true },
					created: new Date().toISOString(),
					lastUsed: null
				}
			];

			// Create standalone plugin with rules already present
			const pluginWithRules = {
				app: {
					vault: {
						getMarkdownFiles: vi.fn().mockReturnValue([]),
						read: vi.fn().mockResolvedValue('---\nstatus: draft\n---\n'),
						modify: vi.fn().mockResolvedValue(undefined),
						adapter: {
							exists: vi.fn().mockResolvedValue(false),
							write: vi.fn().mockResolvedValue(undefined)
						}
					}
				},
				data: {
					rules: savedRules,  // Rules present from the start
					settings: {
						defaultBackup: true,
						scanTimeout: 30000,
						debug: false
					}
				},
				loadData: vi.fn().mockResolvedValue({
					rules: savedRules,
					settings: { defaultBackup: true, scanTimeout: 30000, debug: false }
				}),
				saveData: vi.fn().mockResolvedValue(undefined),
				saveSettings: vi.fn().mockResolvedValue(undefined)
			};

			const { container } = render(RuleBuilderModal, {
				props: {
					plugin: pluginWithRules,
					onClose: vi.fn()
				}
			});

			// Wait for component to mount and load rules
			await waitFor(() => {
				const select = container.querySelector('#saved-rules-select');
				const options = select?.querySelectorAll('option');
				// Should have 2 options: "-- New Rule --" and "Publish Drafts"
				expect(options?.length).toBeGreaterThanOrEqual(2);
			}, { timeout: 2000 });

			// Verify the rule name is in the dropdown
			expect(screen.getByText('Publish Drafts')).toBeInTheDocument();
		});

		it('should load rule when selected from dropdown', async () => {
			const savedRules = [
				{
					id: 'rule1',
					name: 'Publish Drafts',
					condition: 'status = "draft"',
					action: 'SET status "published"',
					scope: { type: 'vault', folder: '' },
					options: { backup: true },
					created: new Date().toISOString(),
					lastUsed: null
				}
			];

			// Create standalone plugin with rules already present
			const pluginWithRules = {
				app: {
					vault: {
						getMarkdownFiles: vi.fn().mockReturnValue([]),
						read: vi.fn().mockResolvedValue('---\nstatus: draft\n---\n'),
						modify: vi.fn().mockResolvedValue(undefined),
						adapter: {
							exists: vi.fn().mockResolvedValue(false),
							write: vi.fn().mockResolvedValue(undefined)
						}
					}
				},
				data: {
					rules: savedRules,  // Rules present from the start
					settings: {
						defaultBackup: true,
						scanTimeout: 30000,
						debug: false
					}
				},
				loadData: vi.fn().mockResolvedValue({
					rules: savedRules,
					settings: { defaultBackup: true, scanTimeout: 30000, debug: false }
				}),
				saveData: vi.fn().mockResolvedValue(undefined),
				saveSettings: vi.fn().mockResolvedValue(undefined)
			};

			render(RuleBuilderModal, {
				props: {
					plugin: pluginWithRules,
					onClose: vi.fn()
				}
			});

			// Wait for rules to load
			await waitFor(() => {
				expect(screen.getByText('Publish Drafts')).toBeInTheDocument();
			}, { timeout: 2000 });

			const select = screen.getByLabelText(/Saved Rules/i) as HTMLSelectElement;

			// Select the rule from dropdown
			await fireEvent.change(select, { target: { value: 'rule1' } });

			// Check that form is populated with rule data
			await waitFor(() => {
				const conditionInput = screen.getByLabelText(/Condition/i) as HTMLTextAreaElement;
				const actionInput = screen.getByLabelText(/Action/i) as HTMLTextAreaElement;
				expect(conditionInput.value).toBe('status = "draft"');
				expect(actionInput.value).toBe('SET status "published"');
			}, { timeout: 2000 });
		});

		it('should save rule when Save button clicked', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			await fireEvent.input(screen.getByLabelText(/Rule Name/i), {
				target: { value: 'Test Rule' }
			});
			await fireEvent.input(screen.getByLabelText(/Condition/i), {
				target: { value: 'status = "draft"' }
			});
			await fireEvent.input(screen.getByLabelText(/Action/i), {
				target: { value: 'SET status "published"' }
			});

			const saveBtn = screen.getByRole('button', { name: /Save Rule/i });
			await fireEvent.click(saveBtn);

			// Should save settings
			await waitFor(() => {
				expect(mockPlugin.saveSettings).toHaveBeenCalled();
			});
		});
	});

	describe('Scope Selection', () => {
		it('should show folder input when Folder scope selected', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			// Select folder scope
			const folderRadio = screen.getByLabelText(/Folder/i);
			await fireEvent.click(folderRadio);

			// Folder path input should appear
			await waitFor(() => {
				const folderInput = screen.getByPlaceholderText(/folder\/path/i);
				expect(folderInput).toBeInTheDocument();
			});
		});

		it('should hide folder input when Vault scope selected', async () => {
			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose: vi.fn()
				}
			});

			// Select folder scope first
			await fireEvent.click(screen.getByLabelText(/Folder/i));

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/folder\/path/i)).toBeInTheDocument();
			});

			// Switch to vault scope
			await fireEvent.click(screen.getByLabelText(/Entire Vault/i));

			// Folder input should disappear
			await waitFor(() => {
				expect(screen.queryByPlaceholderText(/folder\/path/i)).not.toBeInTheDocument();
			});
		});
	});

	describe('Cancel Button', () => {
		it('should call onClose when Cancel clicked', async () => {
			const onClose = vi.fn();

			render(RuleBuilderModal, {
				props: {
					plugin: mockPlugin,
					onClose
				}
			});

			const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
			await fireEvent.click(cancelBtn);

			expect(onClose).toHaveBeenCalled();
		});
	});

});
