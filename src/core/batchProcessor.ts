/**
 * Batch Processor - Process multiple files with progress tracking
 * Based on requirements Section 11.2.4
 *
 * Processes files in batches, creates backups, tracks progress
 */

import { App, TFile } from 'obsidian';
import { FileResult, Rule } from '../types';
import { executeRule } from './ruleEngine';
import { writeFrontmatter } from '../yaml/yamlProcessor';
import { LIMITS } from '../constants';

export interface BatchResult {
	/** Individual file results */
	results: FileResult[];
	/** Summary statistics */
	summary: {
		success: number;
		warnings: number;
		errors: number;
		skipped: number;
		duration: number;
		backupsCreated: number;
	};
}

export interface Progress {
	current: number;
	total: number;
	currentFile: TFile;
	successCount: number;
	warningCount: number;
	errorCount: number;
	skippedCount: number;
	elapsed: number;
	estimatedRemaining: number;
	rate: number; // files/sec
}

export type ProgressCallback = (progress: Progress) => void;

/**
 * Process multiple files with a rule
 *
 * @param app - Obsidian App instance
 * @param files - Files to process
 * @param rule - Rule to apply
 * @param progressCallback - Optional callback for progress updates
 * @returns BatchResult with all file results
 */
export async function processBatch(
	app: App,
	files: TFile[],
	rule: Rule,
	progressCallback?: ProgressCallback
): Promise<BatchResult> {
	const startTime = Date.now();
	const results: FileResult[] = [];
	let backupsCreated = 0;

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		try {
			// Execute rule (dry-run)
			const result = await executeRule(app, rule, file);
			results.push(result);

			// Create backup if modified and backup enabled
			if (result.modified && rule.options.backup) {
				try {
					await createBackup(app, file);
					backupsCreated++;
				} catch (backupError) {
					console.warn(`Failed to create backup for ${file.path}:`, backupError);
				}
			}

			// Write changes if modified
			if (result.modified && result.newData) {
				const content = await app.vault.read(file);
				const { content: bodyContent } = await import('../yaml/yamlProcessor').then(m =>
					m.readFrontmatter(app, file)
				);
				await writeFrontmatter(app, file, result.newData, bodyContent);
			}

			// Progress callback
			if (progressCallback) {
				const elapsed = Date.now() - startTime;
				const rate = (i + 1) / (elapsed / 1000);
				const estimatedRemaining = ((files.length - (i + 1)) / rate) * 1000;

				const successCount = results.filter(r => r.status === 'success').length;
				const warningCount = results.filter(r => r.status === 'warning').length;
				const errorCount = results.filter(r => r.status === 'error').length;
				const skippedCount = results.filter(r => r.status === 'skipped').length;

				progressCallback({
					current: i + 1,
					total: files.length,
					currentFile: file,
					successCount,
					warningCount,
					errorCount,
					skippedCount,
					elapsed,
					estimatedRemaining,
					rate,
				});
			}

			// Yield to UI thread every N files to keep Obsidian responsive
			// Use smaller batch size for better UI responsiveness
			if (i % LIMITS.BATCH_YIELD_INTERVAL === 0) {
				await new Promise(resolve => setTimeout(resolve, LIMITS.BATCH_THROTTLE_MS));
			}
		} catch (error) {
			// If processing fails, add error result
			results.push({
				file,
				status: 'error',
				modified: false,
				changes: [],
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: Date.now() - startTime,
			});
		}
	}

	// Calculate summary
	const summary = {
		success: results.filter(r => r.status === 'success').length,
		warnings: results.filter(r => r.status === 'warning').length,
		errors: results.filter(r => r.status === 'error').length,
		skipped: results.filter(r => r.status === 'skipped').length,
		duration: Date.now() - startTime,
		backupsCreated,
	};

	return { results, summary };
}

/**
 * Create backup of a file with path validation
 * Prevents path traversal attacks by validating backup path stays within vault
 */
async function createBackup(app: App, file: TFile): Promise<void> {
	// Validate file path doesn't contain path traversal
	if (file.path.includes('..')) {
		throw new Error(`Invalid file path for backup (contains '..'): ${file.path}`);
	}

	const backupPath = file.path + '.bak';

	// Additional validation: ensure backup path is normalized
	const normalizedPath = backupPath.replace(/\\/g, '/').replace(/\/\//g, '/');
	if (normalizedPath !== backupPath) {
		throw new Error(`Invalid backup path (not normalized): ${backupPath}`);
	}

	// Validate backup path doesn't escape vault root
	// Obsidian's vault.create() and vault.adapter.write() handle this,
	// but we add explicit validation for robustness
	if (normalizedPath.startsWith('/') || normalizedPath.includes('..')) {
		throw new Error(`Invalid backup path (potential path traversal): ${backupPath}`);
	}

	const content = await app.vault.read(file);
	const backupExists = await app.vault.adapter.exists(backupPath);

	if (backupExists) {
		await app.vault.adapter.write(backupPath, content);
	} else {
		await app.vault.create(backupPath, content);
	}
}
