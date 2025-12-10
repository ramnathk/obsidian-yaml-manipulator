/**
 * Tests for FolderAutocomplete Component
 * Tests folder listing, filtering, keyboard navigation, and selection
 */

import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import { tick } from 'svelte';
import FolderAutocomplete from '../../../src/ui/components/FolderAutocomplete.svelte';

// Mock Obsidian App with vault API
const createMockApp = (folders: string[] = []) => ({
	vault: {
		getAllFolders: vi.fn(() => folders.map(path => ({ path })))
	}
});

describe('FolderAutocomplete Component', () => {
	describe('TC-1.1: Component Rendering', () => {
		it('should render input field with placeholder', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: []
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('type', 'text');
			expect(input).toHaveAttribute('autocomplete', 'off');
		});

		it('should render with initial value', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: 'Projects/Work',
					placeholder: 'Enter folder path...',
					testFolders: []
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...') as HTMLInputElement;
			expect(input.value).toBe('Projects/Work');
		});
	});

	describe('TC-2.1: Folder Filtering', () => {
		it('should filter folders based on input', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Projects/Personal', 'Notes/Daily', 'Archive']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type "proj" to filter
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Should show Projects folders
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();
			expect(screen.getByText('Projects/Personal')).toBeInTheDocument();

			// Should not show non-matching folders
			expect(screen.queryByText('Notes/Daily')).not.toBeInTheDocument();
			expect(screen.queryByText('Archive')).not.toBeInTheDocument();
		});

		it('should perform case-insensitive filtering', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Notes/Daily']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type "WORK" in uppercase
			await fireEvent.input(input, { target: { value: 'WORK' } });

			// Should match case-insensitively
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();
		});

		it('should show root folder in suggestions', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type "/" to show root
			await fireEvent.input(input, { target: { value: '/' } });

			// Should show root folder
			expect(screen.getByText('/')).toBeInTheDocument();
		});

		it('should hide suggestions when no matches found', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects', 'Notes']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type something that doesn't match
			await fireEvent.input(input, { target: { value: 'xyz123notfound' } });

			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});
	});

	describe('TC-3.1: Mouse Selection', () => {
		it('should select folder on click', async () => {
			const mockApp = createMockApp();

			render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Notes/Daily']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...') as HTMLInputElement;

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Click on suggestion
			const suggestion = screen.getByText('Projects/Work');
			await fireEvent.mouseDown(suggestion);

			// Value should be updated
			expect(input.value).toBe('Projects/Work');
		});

		it('should hide suggestions after selection', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Projects/Personal']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();

			// Click on suggestion
			const suggestion = screen.getByText('Projects/Work');
			await fireEvent.mouseDown(suggestion);

			// Suggestions should be hidden
			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});
	});

	describe('TC-4.1: Keyboard Navigation', () => {
		it('should navigate with arrow keys and select with Enter', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work', 'Projects/Personal']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...') as HTMLInputElement;

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Navigate down
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// First item should be selected
			let selectedItem = container.querySelector('.suggestion-item.selected');
			expect(selectedItem?.textContent).toContain('Projects/Work');

			// Navigate down again
			await fireEvent.keyDown(input, { key: 'ArrowDown' });

			// Second item should be selected
			selectedItem = container.querySelector('.suggestion-item.selected');
			expect(selectedItem?.textContent).toContain('Projects/Personal');

			// Press Enter to select
			await fireEvent.keyDown(input, { key: 'Enter' });

			// Value should be updated
			expect(input.value).toBe('Projects/Personal');
		});

		it('should close suggestions with Escape key', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });
			expect(screen.getByText('Projects/Work')).toBeInTheDocument();

			// Press Escape
			await fireEvent.keyDown(input, { key: 'Escape' });

			// Suggestions should be hidden
			const dropdown = container.querySelector('.suggestions-dropdown');
			expect(dropdown).not.toBeInTheDocument();
		});
	});

	describe('TC-5.1: Accessibility', () => {
		it('should have proper ARIA roles and tabindex', async () => {
			const mockApp = createMockApp();

			const { container } = render(FolderAutocomplete, {
				props: {
					app: mockApp,
					value: '',
					placeholder: 'Enter folder path...',
					testFolders: ['Projects/Work']
				}
			});

			await tick();

			const input = screen.getByPlaceholderText('Enter folder path...');

			// Type to show suggestions
			await fireEvent.input(input, { target: { value: 'proj' } });

			// Check ARIA role and tabindex
			const suggestionItem = container.querySelector('.suggestion-item');
			expect(suggestionItem).toHaveAttribute('role', 'button');
			expect(suggestionItem).toHaveAttribute('tabindex', '0');
		});
	});
});
