/**
 * Translation Baseline Tests
 *
 * PURPOSE: These tests assert the EXACT text of all user-facing strings.
 * This is INTENTIONAL, not a code smell!
 *
 * WHY THIS IS IMPORTANT:
 * 1. Documents the baseline English text for all UI elements
 * 2. Catches unintentional changes to user-facing text
 * 3. Provides a reference for translators (they see what the English text should be)
 * 4. Ensures text changes are deliberate and reviewed
 * 5. Serves as living documentation of all user-facing strings
 *
 * IF YOU CHANGE USER-FACING TEXT:
 * 1. Update the translation file (src/i18n/locales/en.json)
 * 2. Update these tests to match the new text
 * 3. This ensures the change is intentional and reviewed
 *
 * DO NOT skip or delete these tests - they serve a critical quality control purpose!
 */

import { describe, it, expect } from 'vitest';
import enTranslations from '../../../src/i18n/locales/en.json';

describe('Translation Baseline - Plugin', () => {
	it('should have correct plugin name', () => {
		expect(enTranslations.plugin.name).toBe('YAML Toolkit');
	});

	it('should have correct loading message', () => {
		expect(enTranslations.plugin.loading).toBe('Loading YAML Toolkit plugin');
	});
});

describe('Translation Baseline - Commands', () => {
	it('should have correct command names', () => {
		expect(enTranslations.commands.openRuleBuilder).toBe('Open Rule Builder');
	});
});

describe('Translation Baseline - Settings', () => {
	it('should have correct settings title', () => {
		expect(enTranslations.settings.title).toBe('YAML Toolkit Settings');
	});

	it('should have correct default backup settings', () => {
		expect(enTranslations.settings.defaultBackup.name).toBe('Default Backup');
		expect(enTranslations.settings.defaultBackup.description).toBe(
			'Create backup files (.bak) before making changes'
		);
	});

	it('should have correct debug mode settings', () => {
		expect(enTranslations.settings.debugMode.name).toBe('Debug Mode');
		expect(enTranslations.settings.debugMode.description).toBe('Show debug information in console');
	});
});

describe('Translation Baseline - Rule Builder', () => {
	it('should have correct rule builder title', () => {
		expect(enTranslations.ruleBuilder.title).toBe('YAML Toolkit: Rule Builder');
	});

	it('should have correct saved rules labels', () => {
		expect(enTranslations.ruleBuilder.savedRules.label).toBe('Saved Rules:');
		expect(enTranslations.ruleBuilder.savedRules.newRule).toBe('-- New Rule --');
	});

	it('should have correct button labels', () => {
		expect(enTranslations.ruleBuilder.buttons.new).toBe('New');
		expect(enTranslations.ruleBuilder.buttons.delete).toBe('Delete');
		expect(enTranslations.ruleBuilder.buttons.cancel).toBe('Cancel');
		expect(enTranslations.ruleBuilder.buttons.save).toBe('Save Rule');
		expect(enTranslations.ruleBuilder.buttons.validate).toBe('Validate');
		expect(enTranslations.ruleBuilder.buttons.preview).toBe('Preview');
		expect(enTranslations.ruleBuilder.buttons.apply).toBe('Apply');
		expect(enTranslations.ruleBuilder.buttons.test).toBe('Test Rule');
		expect(enTranslations.ruleBuilder.buttons.testing).toBe('Testing...');
	});

	it('should have correct rule name field labels', () => {
		expect(enTranslations.ruleBuilder.fields.ruleName.label).toBe('Rule Name:');
		expect(enTranslations.ruleBuilder.fields.ruleName.placeholder).toBe('My Rule');
		expect(enTranslations.ruleBuilder.fields.ruleName.default).toBe('Unnamed Rule');
	});

	it('should have correct scope field labels', () => {
		expect(enTranslations.ruleBuilder.fields.scope.legend).toBe('Scope:');
		expect(enTranslations.ruleBuilder.fields.scope.vault).toBe('Entire Vault');
		expect(enTranslations.ruleBuilder.fields.scope.folder).toBe('Folder');
		expect(enTranslations.ruleBuilder.fields.scope.current).toBe('Current File');
		expect(enTranslations.ruleBuilder.fields.scope.folderPlaceholder).toBe('folder/path');
	});

	it('should have correct condition field labels', () => {
		expect(enTranslations.ruleBuilder.fields.condition.label).toBe(
			'Find files based on frontmatter (optional):'
		);
		expect(enTranslations.ruleBuilder.fields.condition.helpText).toBe(
			'This condition determines which files will be processed. Only files whose frontmatter matches this condition will be modified. Leave empty to process all files in scope.'
		);
		expect(enTranslations.ruleBuilder.fields.condition.placeholder).toBe(
			'status = "draft" AND priority > 5'
		);
	});

	it('should have correct action field labels', () => {
		expect(enTranslations.ruleBuilder.fields.action.label).toBe('Action (required):');
		expect(enTranslations.ruleBuilder.fields.action.placeholder).toBe('SET status "published"');
		expect(enTranslations.ruleBuilder.fields.action.required).toBe('Action is required');
	});

	it('should have correct backup field label', () => {
		expect(enTranslations.ruleBuilder.fields.backup.label).toBe('Create backups before modifying');
	});

	it('should have correct validation messages', () => {
		expect(enTranslations.ruleBuilder.validation.passed).toBe('✓ Validation passed - rule is valid');
		expect(enTranslations.ruleBuilder.validation.invalidCondition).toBe('Invalid condition');
		expect(enTranslations.ruleBuilder.validation.invalidAction).toBe('Invalid action');
	});

	it('should have correct tab labels', () => {
		expect(enTranslations.ruleBuilder.tabs.preview).toBe('Preview Files');
		expect(enTranslations.ruleBuilder.tabs.test).toBe('Test Sample');
	});

	it('should have correct close validation label', () => {
		expect(enTranslations.ruleBuilder.closeValidation).toBe('Close validation panel');
	});
});

describe('Translation Baseline - Preview', () => {
	it('should have correct loading message', () => {
		expect(enTranslations.preview.loading).toBe('Scanning files and previewing changes...');
	});

	it('should have correct failed message', () => {
		expect(enTranslations.preview.failed).toBe('Preview Failed');
	});

	it('should have correct empty state messages', () => {
		expect(enTranslations.preview.empty.title).toBe('No markdown files found in the selected scope.');
		expect(enTranslations.preview.empty.message).toBe(
			'Try selecting a different folder or check your file filters.'
		);
	});

	it('should have correct summary labels', () => {
		expect(enTranslations.preview.summary.title).toBe('Summary');
		expect(enTranslations.preview.summary.matched).toBe('matched');
		expect(enTranslations.preview.summary.warning).toBe('warning');
		expect(enTranslations.preview.summary.warnings).toBe('warnings');
		expect(enTranslations.preview.summary.error).toBe('error');
		expect(enTranslations.preview.summary.errors).toBe('errors');
		expect(enTranslations.preview.summary.skipped).toBe('skipped');
	});

	it('should have correct file details labels', () => {
		expect(enTranslations.preview.fileDetails.error).toBe('Error:');
		expect(enTranslations.preview.fileDetails.reason).toBe('Reason:');
		expect(enTranslations.preview.fileDetails.conditionNotMatch).toBe('Condition did not match');
		expect(enTranslations.preview.fileDetails.noChanges).toBe('No changes to display');
		expect(enTranslations.preview.fileDetails.unknownError).toBe('Unknown error');
	});

	it('should have correct note text', () => {
		expect(enTranslations.preview.note.text).toBe(
			'These are preview results only. No files have been modified. Click'
		);
		expect(enTranslations.preview.note.action).toBe('Apply');
		expect(enTranslations.preview.note.continuation).toBe('to write these changes to disk.');
	});
});

describe('Translation Baseline - Test', () => {
	it('should have correct instructions', () => {
		expect(enTranslations.test.instructions).toBe(
			'Test your rule against sample YAML without modifying any files in your vault. Enter YAML frontmatter below or load an example.'
		);
	});

	it('should have correct example names', () => {
		expect(enTranslations.test.examples.draftNote).toBe('Draft Note');
		expect(enTranslations.test.examples.publishedNote).toBe('Published Note');
		expect(enTranslations.test.examples.minimalNote).toBe('Minimal Note');
		expect(enTranslations.test.examples.complexNote).toBe('Complex Note');
	});

	it('should have correct sample YAML labels', () => {
		expect(enTranslations.test.sampleYaml.label).toBe('Sample YAML:');
		expect(enTranslations.test.sampleYaml.placeholder).toBe(
			'title: My Note\nstatus: draft\npriority: 5\ntags:\n  - work'
		);
	});

	it('should have correct result labels', () => {
		expect(enTranslations.test.result.error).toBe('Error:');
		expect(enTranslations.test.result.conditionNotMatch).toBe('Condition did not match');
		expect(enTranslations.test.result.conditionEvaluationMessage).toBe(
			'The condition evaluated to false for this sample.'
		);
		expect(enTranslations.test.result.match).toBe('Match:');
		expect(enTranslations.test.result.matched).toBe('✓ Condition matched');
		expect(enTranslations.test.result.warning).toBe('Warning:');
		expect(enTranslations.test.result.noChanges).toBe('No changes needed - values already match target.');
		expect(enTranslations.test.result.note).toBe(
			'This test ran entirely in-memory. No vault files were accessed or modified.'
		);
	});

	it('should have correct YAML error messages', () => {
		expect(enTranslations.test.yamlError.parse).toBe('YAML parse error:');
		expect(enTranslations.test.yamlError.invalid).toBe('Invalid YAML');
	});

	it('should have correct execution error messages', () => {
		expect(enTranslations.test.executionError.prefix).toBe('Rule execution error:');
		expect(enTranslations.test.executionError.unknown).toBe('Unknown error');
	});
});

describe('Translation Baseline - Diff', () => {
	it('should have correct diff headers', () => {
		expect(enTranslations.diff.headers.before).toBe('Before');
		expect(enTranslations.diff.headers.after).toBe('After');
	});

	it('should have correct changes title', () => {
		expect(enTranslations.diff.changes.title).toBe('Changes:');
	});
});

describe('Translation Baseline - Notices', () => {
	it('should have correct notice messages', () => {
		expect(enTranslations.notices.ruleSaved).toBe('Rule saved successfully');
		expect(enTranslations.notices.ruleDeleted).toBe('Rule deleted');
		expect(enTranslations.notices.noFilesMatched).toBe('No files matched the scope');
		expect(enTranslations.notices.processing).toBe('Processing {count} file(s)...');
		expect(enTranslations.notices.complete).toBe(
			'✅ Complete: {success} success, {warnings} warnings, {errors} errors'
		);
		expect(enTranslations.notices.error).toBe('Error: {message}');
	});
});

describe('Translation Baseline - Confirm Dialogs', () => {
	it('should have correct confirm dialog text', () => {
		expect(enTranslations.confirm.applyWithoutPreview.title).toBe(
			"⚠️ You haven't previewed this rule yet."
		);
		expect(enTranslations.confirm.applyWithoutPreview.message).toBe(
			"It's recommended to preview before applying to see what changes will be made."
		);
		expect(enTranslations.confirm.applyWithoutPreview.question).toBe('Continue anyway?');
	});
});

describe('Translation Baseline - Status', () => {
	it('should have correct status labels', () => {
		expect(enTranslations.status.success).toBe('Success');
		expect(enTranslations.status.warning).toBe('Warning');
		expect(enTranslations.status.error).toBe('Error');
		expect(enTranslations.status.skipped).toBe('Skipped');
	});
});

describe('Translation Structure Validation', () => {
	it('should have all required top-level keys', () => {
		const requiredKeys = [
			'plugin',
			'commands',
			'settings',
			'ruleBuilder',
			'preview',
			'test',
			'diff',
			'notices',
			'confirm',
			'status',
		];

		for (const key of requiredKeys) {
			expect(enTranslations).toHaveProperty(key);
		}
	});

	it('should not have any empty strings', () => {
		const checkForEmptyStrings = (obj: any, path: string = ''): string[] => {
			const emptyPaths: string[] = [];

			for (const [key, value] of Object.entries(obj)) {
				const currentPath = path ? `${path}.${key}` : key;

				if (typeof value === 'string') {
					if (value.trim() === '') {
						emptyPaths.push(currentPath);
					}
				} else if (typeof value === 'object' && value !== null) {
					emptyPaths.push(...checkForEmptyStrings(value, currentPath));
				}
			}

			return emptyPaths;
		};

		const emptyPaths = checkForEmptyStrings(enTranslations);
		expect(emptyPaths).toEqual([]);
	});
});
