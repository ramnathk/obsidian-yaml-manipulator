/**
 * Logger - Log operations to file
 * Based on requirements Section 8
 *
 * Creates detailed operation logs in .obsidian/plugins/yaml-manipulator/logs/
 */

import { Vault, TFile } from 'obsidian';
import { BatchResult, FileResult, Rule } from '../types';
import { DateTime } from 'luxon';

export interface Logger {
	logStart(rule: Rule): void;
	logScan(scanned: number, matched: number): void;
	logFileSuccess(file: TFile, changes: string[], backup?: string): void;
	logFileWarning(file: TFile, warning: string, changes: string[]): void;
	logFileError(file: TFile, error: string): void;
	logSummary(result: BatchResult): void;
	close(): Promise<void>;
}

/**
 * Create a logger for an operation
 */
export function createLogger(vault: Vault, logPath: string): Logger {
	const lines: string[] = [];

	return {
		logStart(rule: Rule): void {
			lines.push('================================================================================');
			lines.push(`Timestamp: ${DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')}`);
			lines.push(`Rule: ${rule.name}`);
			lines.push(`ID: ${rule.id}`);
			lines.push('================================================================================');
			lines.push('');
			lines.push(`Condition: ${rule.condition || '(none - apply to all files)'}`);
			lines.push(`Action: ${rule.action}`);
			lines.push(`Scope: ${rule.scope.type}${rule.scope.folder ? ` (${rule.scope.folder})` : ''}`);
			lines.push(`Backup: ${rule.options.backup ? 'enabled' : 'disabled'}`);
			lines.push('');
			lines.push('================================================================================');
			lines.push('PROCESSING');
			lines.push('================================================================================');
			lines.push('');
		},

		logScan(scanned: number, matched: number): void {
			lines.push(`Scanned: ${scanned} files`);
			lines.push(`Matched: ${matched} files`);
			lines.push('');
		},

		logFileSuccess(file: TFile, changes: string[], backup?: string): void {
			lines.push(`✅ ${file.path}`);
			changes.forEach(change => {
				lines.push(`   ${change}`);
			});
			if (backup) {
				lines.push(`   Backup: ${backup}`);
			}
			lines.push('');
		},

		logFileWarning(file: TFile, warning: string, changes: string[]): void {
			lines.push(`⚠️  ${file.path}`);
			lines.push(`   Warning: ${warning}`);
			if (changes.length > 0) {
				changes.forEach(change => {
					lines.push(`   ${change}`);
				});
			}
			lines.push('');
		},

		logFileError(file: TFile, error: string): void {
			lines.push(`❌ ${file.path}`);
			lines.push(`   Error: ${error}`);
			lines.push('');
		},

		logSummary(result: BatchResult): void {
			lines.push('================================================================================');
			lines.push('SUMMARY');
			lines.push('================================================================================');
			lines.push('');
			lines.push(`Total files processed: ${result.results.length}`);
			lines.push(`Success: ${result.summary.success}`);
			lines.push(`Warnings: ${result.summary.warnings}`);
			lines.push(`Errors: ${result.summary.errors}`);
			lines.push(`Skipped: ${result.summary.skipped}`);
			lines.push(`Backups created: ${result.summary.backupsCreated}`);
			lines.push(`Duration: ${(result.summary.duration / 1000).toFixed(2)}s`);
			lines.push('');
			lines.push('================================================================================');
		},

		async close(): Promise<void> {
			const logContent = lines.join('\n');
			const logExists = await vault.adapter.exists(logPath);

			if (logExists) {
				await vault.adapter.write(logPath, logContent);
			} else {
				// Create parent directory if needed
				const parentPath = logPath.substring(0, logPath.lastIndexOf('/'));
				if (parentPath) {
					try {
						await vault.adapter.mkdir(parentPath);
					} catch (e) {
						// Directory may already exist
					}
				}
				await vault.create(logPath, logContent);
			}
		},
	};
}

/**
 * Generate log file path with timestamp
 */
export function generateLogPath(): string {
	const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
	return `.obsidian/plugins/yaml-manipulator/logs/${timestamp}.log`;
}
