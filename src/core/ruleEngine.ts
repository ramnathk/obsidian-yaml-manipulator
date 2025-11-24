/**
 * Rule Engine - Orchestrate condition evaluation and action execution
 * Based on requirements Section 2.2 (workflow)
 *
 * Flow: Read file → Resolve templates → Evaluate condition → Execute action → Return result
 */

import { App, TFile } from 'obsidian';
import { FileResult, Rule, ActionAST, ConditionAST } from '../types';
import { readFrontmatter } from '../yaml/yamlProcessor';
import { parseCondition } from '../parser/conditionParser';
import { parseAction } from '../parser/actionParser';
import { evaluateCondition } from '../evaluator/conditionEvaluator';
import { resolveTemplates, TemplateContext } from './templateEngine';
import { executeSet, executeAdd, executeDelete, executeRename } from '../actions/basicActions';
import {
	executeAppend,
	executePrepend,
	executeInsertAt,
	executeInsertAfter,
	executeInsertBefore,
	executeRemove,
	executeRemoveAll,
	executeRemoveAt,
	executeReplace,
	executeReplaceAll,
	executeDeduplicate,
	executeSort,
	executeSortBy,
	executeMove,
	executeMoveWhere,
	executeUpdateWhere,
} from '../actions/arrayActions';
import { executeMerge, executeMergeOverwrite } from '../actions/objectActions';

/**
 * Execute a rule on a single file (dry-run - does not write to disk)
 *
 * @param app - Obsidian App instance
 * @param rule - Rule to execute
 * @param file - File to process
 * @returns FileResult with changes (but file not modified)
 */
export async function executeRule(app: App, rule: Rule, file: TFile): Promise<FileResult> {
	const startTime = Date.now();

	try {
		// Read frontmatter
		const { data, content } = await readFrontmatter(app, file);
		const originalData = JSON.parse(JSON.stringify(data)); // Deep copy for comparison

		// Evaluate condition (if present)
		if (rule.condition && rule.condition.trim().length > 0) {
			const conditionAST = parseCondition(rule.condition);
			const matches = evaluateCondition(conditionAST, data);

			if (!matches) {
				return {
					file,
					status: 'skipped',
					modified: false,
					changes: [],
					originalData,
					newData: data,
					duration: Date.now() - startTime,
				};
			}
		}

		// Resolve templates in action
		const templateContext: TemplateContext = {
			file,
			vault: app.vault,
			frontmatter: data,
		};
		const resolvedAction = resolveTemplates(rule.action, templateContext);

		// Parse and execute action
		const actionAST = parseAction(resolvedAction);
		const actionResult = executeAction(actionAST, data);

		if (!actionResult.success) {
			return {
				file,
				status: 'error',
				modified: false,
				changes: actionResult.changes,
				originalData,
				newData: data,
				error: actionResult.error,
				duration: Date.now() - startTime,
			};
		}

		if (!actionResult.modified) {
			return {
				file,
				status: actionResult.warning ? 'warning' : 'skipped',
				modified: false,
				changes: actionResult.changes,
				originalData,
				newData: data,
				warning: actionResult.warning,
				duration: Date.now() - startTime,
			};
		}

		return {
			file,
			status: actionResult.warning ? 'warning' : 'success',
			modified: true,
			changes: actionResult.changes,
			originalData,
			newData: data,
			warning: actionResult.warning,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		return {
			file,
			status: 'error',
			modified: false,
			changes: [],
			error: error instanceof Error ? error.message : 'Unknown error',
			duration: Date.now() - startTime,
		};
	}
}

/**
 * Execute an action AST on data
 */
function executeAction(ast: ActionAST, data: any): import('../types').ActionResult {
	switch (ast.op) {
		case 'SET':
			return executeSet(data, ast.path, ast.value);
		case 'ADD':
			return executeAdd(data, ast.path, ast.value);
		case 'DELETE':
			return executeDelete(data, ast.path);
		case 'RENAME':
			return executeRename(data, ast.oldPath, ast.newPath);
		case 'APPEND':
			return executeAppend(data, ast.path, ast.value);
		case 'PREPEND':
			return executePrepend(data, ast.path, ast.value);
		case 'INSERT_AT':
			return executeInsertAt(data, ast.path, ast.value, ast.index);
		case 'INSERT_AFTER':
			return executeInsertAfter(data, ast.path, ast.value, ast.target);
		case 'INSERT_BEFORE':
			return executeInsertBefore(data, ast.path, ast.value, ast.target);
		case 'REMOVE':
			return executeRemove(data, ast.path, ast.value);
		case 'REMOVE_ALL':
			return executeRemoveAll(data, ast.path, ast.value);
		case 'REMOVE_AT':
			return executeRemoveAt(data, ast.path, ast.index);
		case 'REPLACE':
			return executeReplace(data, ast.path, ast.oldValue, ast.newValue);
		case 'REPLACE_ALL':
			return executeReplaceAll(data, ast.path, ast.oldValue, ast.newValue);
		case 'DEDUPLICATE':
			return executeDeduplicate(data, ast.path);
		case 'SORT':
			return executeSort(data, ast.path, ast.order);
		case 'SORT_BY':
			return executeSortBy(data, ast.path, ast.field, ast.order);
		case 'MOVE':
			return executeMove(data, ast.path, ast.fromIndex, ast.toIndex);
		case 'MOVE_WHERE':
			return executeMoveWhere(data, ast.path, ast.condition, ast.target);
		case 'UPDATE_WHERE':
			return executeUpdateWhere(data, ast.path, ast.condition, ast.updates);
		case 'MERGE':
			return executeMerge(data, ast.path, ast.value);
		case 'MERGE_OVERWRITE':
			return executeMergeOverwrite(data, ast.path, ast.value);
		default:
			return {
				success: false,
				modified: false,
				changes: [],
				error: `Unknown operation: ${(ast as any).op}`,
			};
	}
}
