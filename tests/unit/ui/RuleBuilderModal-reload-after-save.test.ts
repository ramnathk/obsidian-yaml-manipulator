/**
 * Test for rule saving with in-memory data sync
 *
 * Ensures that when a rule is saved, plugin.data is reloaded from disk
 * so that the UI dropdown updates immediately with the new rule.
 *
 * Bug fix: Previously, saveRule() saved to disk but didn't update plugin.data
 * in memory, causing the dropdown to not refresh.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import RuleBuilderModal from '../../../src/ui/RuleBuilderModal.svelte';
import { createNewRule } from '../../../src/storage/ruleStorage';
import { initI18n } from '../../../src/i18n';

// Initialize i18n for tests
initI18n();

describe('RuleBuilderModal - Reload After Save', () => {
	let mockPlugin: any;
	let mockOnClose: any;

	beforeEach(() => {
		// Simulate "disk" storage separate from plugin.data (this is the bug!)
		let diskStorage: any = {
			version: '1.0',
			rules: [],
			settings: {
				defaultBackup: true,
				debug: false,
			},
		};

		// Mock plugin with empty rules
		mockPlugin = {
			app: {
				vault: {
					getFiles: vi.fn(() => []),
					read: vi.fn(),
					modify: vi.fn(),
				},
			},
			data: {
				version: '1.0',
				rules: [], // Start with no rules in memory
				settings: {
					defaultBackup: true,
					debug: false,
				},
			},
			saveData: vi.fn(async (data) => {
				// Save to "disk" but DON'T update plugin.data
				// This is the bug!
				diskStorage = JSON.parse(JSON.stringify(data));
			}),
			loadData: vi.fn(async () => {
				// Load from "disk" storage (not plugin.data)
				return JSON.parse(JSON.stringify(diskStorage));
			}),
			saveSettings: vi.fn(async function() {
				await this.saveData(this.data);
			}),
		};

		mockOnClose = vi.fn();

		// Mock Notice
		vi.mock('obsidian', () => ({
			Notice: vi.fn(),
		}));
	});

	it('should show saved rule in dropdown after saving', async () => {
		render(RuleBuilderModal, {
			props: {
				plugin: mockPlugin,
				onClose: mockOnClose,
			},
		});

		// Initial state: dropdown should only have "-- New Rule --"
		const dropdown = screen.getByLabelText(/Saved Rules:/i) as HTMLSelectElement;
		expect(dropdown.options.length).toBe(1); // Only "-- New Rule --"
		expect(dropdown.options[0].textContent).toBe('-- New Rule --');

		// Fill in rule details
		const ruleNameInput = screen.getByLabelText(/Rule Name/i) as HTMLInputElement;
		const actionTextarea = screen.getByLabelText(/Action/i) as HTMLTextAreaElement;

		await fireEvent.input(ruleNameInput, { target: { value: 'My Test Rule' } });
		await fireEvent.input(actionTextarea, { target: { value: 'SET status "done"' } });

		// Click save button
		const saveButton = screen.getByRole('button', { name: /Save Rule/i });
		await fireEvent.click(saveButton);

		// Wait for save to complete
		await waitFor(() => {
			expect(mockPlugin.saveData).toHaveBeenCalled();
		});

		// BUG: The dropdown should now have 2 options (New Rule + My Test Rule)
		// but it still only has 1 because plugin.data.rules wasn't updated
		const updatedDropdown = screen.getByLabelText(/Saved Rules:/i) as HTMLSelectElement;

		// This assertion will FAIL because of the bug
		expect(updatedDropdown.options.length).toBe(2); // Should be 2 (New Rule + My Test Rule)

		// Verify the new rule is in the dropdown
		const ruleOption = Array.from(updatedDropdown.options)
			.find(opt => opt.textContent === 'My Test Rule');
		expect(ruleOption).toBeTruthy();
	});

	it('should update dropdown after multiple saves', async () => {
		render(RuleBuilderModal, {
			props: {
				plugin: mockPlugin,
				onClose: mockOnClose,
			},
		});

		// Save first rule
		const ruleNameInput = screen.getByLabelText(/Rule Name/i) as HTMLInputElement;
		const actionTextarea = screen.getByLabelText(/Action/i) as HTMLTextAreaElement;
		const saveButton = screen.getByRole('button', { name: /Save Rule/i });

		await fireEvent.input(ruleNameInput, { target: { value: 'Rule 1' } });
		await fireEvent.input(actionTextarea, { target: { value: 'SET status "done"' } });
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockPlugin.saveData).toHaveBeenCalledTimes(1);
		});

		// Create new rule and save again
		const newButton = screen.getByRole('button', { name: /New/i });
		await fireEvent.click(newButton);

		await fireEvent.input(ruleNameInput, { target: { value: 'Rule 2' } });
		await fireEvent.input(actionTextarea, { target: { value: 'SET priority "high"' } });
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockPlugin.saveData).toHaveBeenCalledTimes(2);
		});

		// BUG: Dropdown should have 3 options (New Rule + Rule 1 + Rule 2)
		const dropdown = screen.getByLabelText(/Saved Rules:/i) as HTMLSelectElement;
		expect(dropdown.options.length).toBe(3);

		const optionTexts = Array.from(dropdown.options).map(opt => opt.textContent);
		expect(optionTexts).toContain('Rule 1');
		expect(optionTexts).toContain('Rule 2');
	});
});
