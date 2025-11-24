/**
 * File Scanner - Scan vault/folder for files matching criteria
 * Based on requirements Section 11.2.3
 *
 * Scans markdown files in vault or folder scope with timeout and limit protection
 */

import { TFile, Vault } from 'obsidian';
import { RuleScope } from '../types';
import { normalizePath } from '../utils/pathNormalizer';

export interface ScanResult {
	/** Files that matched */
	matched: TFile[];
	/** Total files scanned */
	scanned: number;
	/** Scan duration in ms */
	duration: number;
	/** Whether max file limit was exceeded */
	exceededLimit: boolean;
	/** Whether scan timed out */
	timedOut: boolean;
}

export interface ScanOptions {
	/** Maximum files to scan */
	maxFiles?: number;
	/** Timeout in milliseconds */
	timeout?: number;
}

/**
 * Scan vault for markdown files matching scope
 *
 * @param vault - Obsidian Vault instance
 * @param scope - Rule scope (vault or folder)
 * @param options - Scan options (limits and timeout)
 * @returns ScanResult with matched files
 */
export async function scanFiles(
	vault: Vault,
	scope: RuleScope,
	options: ScanOptions = {}
): Promise<ScanResult> {
	const startTime = Date.now();
	const maxFiles = options.maxFiles || 1000;
	const timeout = options.timeout || 30000;

	const matched: TFile[] = [];
	let scanned = 0;
	let exceededLimit = false;
	let timedOut = false;

	// Get all markdown files
	const allFiles = vault.getMarkdownFiles();

	// Filter by scope
	let scopedFiles = allFiles;
	if (scope.type === 'folder' && scope.folder) {
		// Normalize folder path and ensure it ends with /
		// This prevents matching "samples" with "samples-old"
		let normalizedFolder = normalizePath(scope.folder);
		if (!normalizedFolder.endsWith('/')) {
			normalizedFolder += '/';
		}
		scopedFiles = allFiles.filter(file =>
			normalizePath(file.path).startsWith(normalizedFolder)
		);
	}

	// Scan files with limits
	for (const file of scopedFiles) {
		// Check timeout
		if (Date.now() - startTime > timeout) {
			timedOut = true;
			break;
		}

		// Check limit
		if (scanned >= maxFiles) {
			exceededLimit = true;
			break;
		}

		matched.push(file);
		scanned++;
	}

	return {
		matched,
		scanned,
		duration: Date.now() - startTime,
		exceededLimit,
		timedOut,
	};
}

/**
 * Get current file from active view
 */
export function getCurrentFile(app: any): TFile | null {
	const activeView = app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
	return activeView?.file || null;
}
