/**
 * Core TypeScript interfaces for YAML Manipulator plugin
 * Based on requirements Section 7.3 and 12.1
 */

import { TFile } from 'obsidian';

/**
 * Parsed YAML frontmatter with content
 */
export interface FrontmatterData {
	/** Parsed YAML data as JavaScript object */
	data: any;
	/** Body content (everything after frontmatter) */
	content: string;
}

/**
 * Result of executing an action on data
 */
export interface ActionResult {
	/** Whether the operation completed successfully */
	success: boolean;
	/** Whether the data was actually modified */
	modified: boolean;
	/** Array of human-readable change descriptions */
	changes: string[];
	/** Warning message if operation succeeded with caveats */
	warning?: string;
	/** Error message if operation failed */
	error?: string;
}

/**
 * Result of processing a single file
 */
export interface FileResult {
	/** The file that was processed */
	file: TFile;
	/** Processing status */
	status: 'success' | 'warning' | 'error' | 'skipped';
	/** Whether the file was modified */
	modified: boolean;
	/** Array of changes made */
	changes: string[];
	/** Original frontmatter data (before changes) */
	originalData?: any;
	/** New frontmatter data (after changes) */
	newData?: any;
	/** Error message if processing failed */
	error?: string;
	/** Warning message if processing succeeded with caveats */
	warning?: string;
	/** Processing duration in milliseconds */
	duration: number;
}

/**
 * Result of processing multiple files in batch
 */
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

/**
 * Rule for bulk YAML manipulation
 * Will be expanded in later iterations
 */
export interface Rule {
	/** Unique identifier */
	id: string;
	/** User-friendly name */
	name: string;
	/** Condition string (empty if unconditional) */
	condition: string;
	/** Action string */
	action: string;
	/** Scope of rule application */
	scope: RuleScope;
	/** Rule options */
	options: RuleOptions;
	/** ISO 8601 timestamp of creation */
	created: string;
	/** ISO 8601 timestamp of last use */
	lastUsed?: string;
}

/**
 * Scope where rule should be applied
 */
export interface RuleScope {
	/** Type of scope */
	type: 'vault' | 'folder' | 'current';
	/** Folder path (only for type='folder') */
	folder?: string;
}

/**
 * Options for rule execution
 */
export interface RuleOptions {
	/** Whether to create backups before modifying */
	backup: boolean;
}

/**
 * Plugin settings
 */
export interface YamlManipulatorSettings {
	/** Whether to create backups by default */
	defaultBackup: boolean;
	/** Maximum files to process in one batch */
	maxFilesPerBatch: number;
	/** Timeout for vault scanning (ms) */
	scanTimeout: number;
	/** Show debug information */
	debug: boolean;
}

/**
 * Plugin data structure (saved to data.json)
 */
export interface PluginData {
	/** Version of plugin data format */
	version: string;
	/** Saved rules */
	rules: Rule[];
	/** ISO 8601 timestamp of last run */
	lastRun?: string;
	/** Plugin settings */
	settings: YamlManipulatorSettings;
}

/**
 * Condition Abstract Syntax Tree (AST) node types
 */
export type ConditionAST =
	| ComparisonNode
	| ExistenceNode
	| TypeCheckNode
	| EmptyCheckNode
	| HasNode
	| BooleanNode
	| NotNode
	| QuantifierNode;

export interface ComparisonNode {
	type: 'comparison';
	left: string; // path
	operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | '~';
	right: any; // value or regex pattern
}

export interface ExistenceNode {
	type: 'existence';
	path: string;
	operator: 'exists' | '!exists';
}

export interface TypeCheckNode {
	type: 'type_check';
	path: string;
	typeCheck: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
	negated?: boolean; // For !:type
}

export interface EmptyCheckNode {
	type: 'empty_check';
	path: string;
	operator: 'empty' | '!empty';
}

export interface HasNode {
	type: 'has';
	path: string;
	value: any;
	operator: 'has' | '!has';
}

export interface BooleanNode {
	type: 'boolean';
	operator: 'AND' | 'OR';
	left: ConditionAST;
	right: ConditionAST;
}

export interface NotNode {
	type: 'not';
	operand: ConditionAST;
}

export interface QuantifierNode {
	type: 'quantifier';
	quantifier: 'ANY' | 'ALL';
	array: string; // path to array
	condition: ConditionAST;
}

/**
 * Action Abstract Syntax Tree (AST) node types
 */
export type ActionAST =
	| SetAction
	| AddAction
	| DeleteAction
	| RenameAction
	| AppendAction
	| PrependAction
	| InsertAction
	| InsertAfterAction
	| InsertBeforeAction
	| RemoveAction
	| RemoveAllAction
	| RemoveAtAction
	| ReplaceAction
	| ReplaceAllAction
	| DeduplicateAction
	| SortAction
	| SortByAction
	| MoveAction
	| MoveWhereAction
	| UpdateWhereAction
	| MergeAction
	| MergeOverwriteAction;

export interface SetAction {
	op: 'SET';
	path: string;
	value: any;
}

export interface AddAction {
	op: 'ADD';
	path: string;
	value: any;
}

export interface DeleteAction {
	op: 'DELETE';
	path: string;
}

export interface RenameAction {
	op: 'RENAME';
	oldPath: string;
	newPath: string;
}

export interface AppendAction {
	op: 'APPEND';
	path: string;
	value: any;
}

export interface PrependAction {
	op: 'PREPEND';
	path: string;
	value: any;
}

export interface InsertAction {
	op: 'INSERT_AT';
	path: string;
	index: number;
	value: any;
}

export interface InsertAfterAction {
	op: 'INSERT_AFTER';
	path: string;
	target: any;
	value: any;
}

export interface InsertBeforeAction {
	op: 'INSERT_BEFORE';
	path: string;
	target: any;
	value: any;
}

export interface RemoveAction {
	op: 'REMOVE';
	path: string;
	value: any;
}

export interface RemoveAllAction {
	op: 'REMOVE_ALL';
	path: string;
	value: any;
}

export interface RemoveAtAction {
	op: 'REMOVE_AT';
	path: string;
	index: number;
}

export interface ReplaceAction {
	op: 'REPLACE';
	path: string;
	oldValue: any;
	newValue: any;
}

export interface ReplaceAllAction {
	op: 'REPLACE_ALL';
	path: string;
	oldValue: any;
	newValue: any;
}

export interface DeduplicateAction {
	op: 'DEDUPLICATE';
	path: string;
}

export interface SortAction {
	op: 'SORT';
	path: string;
	order: 'ASC' | 'DESC';
}

export interface SortByAction {
	op: 'SORT_BY';
	path: string;
	field: string;
	order: 'ASC' | 'DESC';
}

export interface MoveAction {
	op: 'MOVE';
	path: string;
	fromIndex: number;
	toIndex: number;
}

export interface MoveWhereAction {
	op: 'MOVE_WHERE';
	path: string;
	condition: ConditionAST;
	target: 'START' | 'END' | MoveRelativeTarget;
}

export interface MoveRelativeTarget {
	position: 'AFTER' | 'BEFORE';
	reference: ConditionAST;
}

export interface UpdateWhereAction {
	op: 'UPDATE_WHERE';
	path: string;
	condition: ConditionAST;
	updates: Array<{ field: string; value: any }>;
}

export interface MergeAction {
	op: 'MERGE';
	path: string;
	value: object;
}

export interface MergeOverwriteAction {
	op: 'MERGE_OVERWRITE';
	path: string;
	value: object;
}
