/**
 * Tests for Complex Array-of-Objects Operations
 * Based on documentation Section 11 - Movies and Books examples
 */

import { describe, it, expect } from 'vitest';
import {
	executeAppend,
	executeUpdateWhere,
	executeSortBy,
	executeMoveWhere,
} from '../../../src/actions/arrayActions';
import { parseCondition } from '../../../src/parser/conditionParser';
import { evaluateCondition } from '../../../src/evaluator/conditionEvaluator';

describe('Complex Array-of-Objects Operations', () => {
	describe('Movies Database - watchlist', () => {
		describe('Adding movies', () => {
			it('should add new movie to watchlist', () => {
				const data = {
					title: 'My Movie Notes',
					watchlist: [
						{
							title: 'Inception',
							director: 'Christopher Nolan',
							year: 2010,
							rating: 8.8,
							genres: ['sci-fi', 'thriller'],
							watched: true
						}
					]
				};

				const newMovie = {
					title: 'Interstellar',
					director: 'Christopher Nolan',
					year: 2014,
					rating: 8.6,
					genres: ['sci-fi', 'drama'],
					watched: false
				};

				const result = executeAppend(data, 'watchlist', newMovie);

				expect(result.success).toBe(true);
				expect(result.modified).toBe(true);
				expect(data.watchlist).toHaveLength(2);
				expect(data.watchlist[1]).toEqual(newMovie);
			});

			it('should check if movie exists before adding', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', director: 'Christopher Nolan', year: 2010 }
					]
				};

				// Check existence using ANY
				const condition = parseCondition('title = "Inception"');
				const hasMovie = data.watchlist.some(item => evaluateCondition(condition, item));

				expect(hasMovie).toBe(true);
			});

			it('should not match when movie does not exist', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', director: 'Christopher Nolan', year: 2010 }
					]
				};

				const condition = parseCondition('title = "Interstellar"');
				const hasMovie = data.watchlist.some(item => evaluateCondition(condition, item));

				expect(hasMovie).toBe(false);
			});
		});

		describe('UPDATE_WHERE - Mark movies as watched', () => {
			it('should mark specific movie as watched', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', director: 'Christopher Nolan', year: 2010, watched: false },
						{ title: 'The Matrix', director: 'Wachowski Sisters', year: 1999, watched: false }
					]
				};

				const condition = parseCondition('title = "Inception"');
				const result = executeUpdateWhere(data, 'watchlist', condition, [
					{ field: 'watched', value: true },
					{ field: 'watchedDate', value: '2025-11-23' },
					{ field: 'rating', value: 9.0 }
				]);

				expect(result.success).toBe(true);
				expect(result.modified).toBe(true);
				expect(data.watchlist[0].watched).toBe(true);
				expect(data.watchlist[0].watchedDate).toBe('2025-11-23');
				expect(data.watchlist[0].rating).toBe(9.0);
				expect(data.watchlist[1].watched).toBe(false);
			});

			it('should mark all movies by director as watched', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', director: 'Christopher Nolan', watched: false },
						{ title: 'Interstellar', director: 'Christopher Nolan', watched: false },
						{ title: 'The Matrix', director: 'Wachowski Sisters', watched: false }
					]
				};

				const condition = parseCondition('director = "Christopher Nolan"');
				const result = executeUpdateWhere(data, 'watchlist', condition, [
					{ field: 'watched', value: true },
					{ field: 'bingeDate', value: '2025-11-23' }
				]);

				expect(result.success).toBe(true);
				expect(data.watchlist[0].watched).toBe(true);
				expect(data.watchlist[0].bingeDate).toBe('2025-11-23');
				expect(data.watchlist[1].watched).toBe(true);
				expect(data.watchlist[1].bingeDate).toBe('2025-11-23');
				expect(data.watchlist[2].watched).toBe(false);
			});
		});

		describe('Complex conditions with ANY/ALL', () => {
			it('should check if any movie is highly rated', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', rating: 8.8 },
						{ title: 'The Room', rating: 3.7 }
					]
				};

				const condition = parseCondition('rating >= 8.5');
				const hasHighRated = data.watchlist.some(item => evaluateCondition(condition, item));

				expect(hasHighRated).toBe(true);
			});

			it('should check if all movies are watched', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', watched: true },
						{ title: 'Interstellar', watched: false }
					]
				};

				const condition = parseCondition('watched = true');
				const allWatched = data.watchlist.every(item => evaluateCondition(condition, item));

				expect(allWatched).toBe(false);
			});

			it('should check complex multi-condition', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', director: 'Christopher Nolan', year: 2010, rating: 8.8, watched: true },
						{ title: 'Interstellar', director: 'Christopher Nolan', year: 2014, rating: 8.6, watched: false }
					]
				};

				const condition = parseCondition('director = "Christopher Nolan" AND rating >= 8.5 AND watched = true');
				const hasWatchedNolanMasterpiece = data.watchlist.some(item => evaluateCondition(condition, item));

				expect(hasWatchedNolanMasterpiece).toBe(true);
			});
		});

		describe('SORT_BY - Organize by different fields', () => {
			it('should sort by rating (highest first)', () => {
				const data = {
					watchlist: [
						{ title: 'The Room', rating: 3.7 },
						{ title: 'Inception', rating: 8.8 },
						{ title: 'Interstellar', rating: 8.6 },
						{ title: 'The Dark Knight', rating: 9.0 }
					]
				};

				const result = executeSortBy(data, 'watchlist', 'rating', 'DESC');

				expect(result.success).toBe(true);
				expect(data.watchlist[0].rating).toBe(9.0);
				expect(data.watchlist[1].rating).toBe(8.8);
				expect(data.watchlist[2].rating).toBe(8.6);
				expect(data.watchlist[3].rating).toBe(3.7);
			});

			it('should sort by year (oldest first)', () => {
				const data = {
					watchlist: [
						{ title: 'Interstellar', year: 2014 },
						{ title: 'The Matrix', year: 1999 },
						{ title: 'Inception', year: 2010 }
					]
				};

				const result = executeSortBy(data, 'watchlist', 'year', 'ASC');

				expect(result.success).toBe(true);
				expect(data.watchlist[0].year).toBe(1999);
				expect(data.watchlist[1].year).toBe(2010);
				expect(data.watchlist[2].year).toBe(2014);
			});

			it('should sort by title alphabetically', () => {
				const data = {
					watchlist: [
						{ title: 'Interstellar', director: 'Christopher Nolan' },
						{ title: 'Arrival', director: 'Denis Villeneuve' },
						{ title: 'Inception', director: 'Christopher Nolan' }
					]
				};

				const result = executeSortBy(data, 'watchlist', 'title', 'ASC');

				expect(result.success).toBe(true);
				expect(data.watchlist[0].title).toBe('Arrival');
				expect(data.watchlist[1].title).toBe('Inception');
				expect(data.watchlist[2].title).toBe('Interstellar');
			});
		});

		describe('MOVE_WHERE - Prioritize movies', () => {
			it('should move unwatched movies to top', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', watched: true },
						{ title: 'Interstellar', watched: false },
						{ title: 'The Matrix', watched: true },
						{ title: 'Arrival', watched: false }
					]
				};

				const condition = parseCondition('watched = false');
				const result = executeMoveWhere(data, 'watchlist', condition, 'START');

				expect(result.success).toBe(true);
				expect(data.watchlist[0].watched).toBe(false);
				expect(data.watchlist[1].watched).toBe(false);
				expect(data.watchlist[2].watched).toBe(true);
				expect(data.watchlist[3].watched).toBe(true);
			});

			it('should move high-rated movies to top', () => {
				const data = {
					watchlist: [
						{ title: 'The Room', rating: 3.7 },
						{ title: 'Inception', rating: 8.8 },
						{ title: 'Some Movie', rating: 6.5 },
						{ title: 'The Dark Knight', rating: 9.0 }
					]
				};

				const condition = parseCondition('rating >= 8.5');
				const result = executeMoveWhere(data, 'watchlist', condition, 'START');

				expect(result.success).toBe(true);
				expect(data.watchlist[0].rating).toBeGreaterThanOrEqual(8.5);
				expect(data.watchlist[1].rating).toBeGreaterThanOrEqual(8.5);
				expect(data.watchlist[2].rating).toBeLessThan(8.5);
			});

			it('should move movies AFTER a specific movie', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', priority: 'medium' },
						{ title: 'Some Movie', priority: 'low' },
						{ title: 'Interstellar', priority: 'high' }
					]
				};

				const condition = parseCondition('priority = "high"');
				const reference = parseCondition('title = "Inception"');
				const result = executeMoveWhere(data, 'watchlist', condition, {
					position: 'AFTER',
					reference
				});

				expect(result.success).toBe(true);
				expect(data.watchlist[0].title).toBe('Inception');
				expect(data.watchlist[1].title).toBe('Interstellar');
				expect(data.watchlist[2].title).toBe('Some Movie');
			});
		});

		describe('Advanced filtering with nested fields', () => {
			it('should update movies with specific genre', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', genres: ['sci-fi', 'thriller'], priority: 'normal' },
						{ title: 'The Godfather', genres: ['crime', 'drama'], priority: 'normal' },
						{ title: 'Interstellar', genres: ['sci-fi', 'drama'], priority: 'normal' }
					]
				};

				const condition = parseCondition('genres has "sci-fi"');
				const result = executeUpdateWhere(data, 'watchlist', condition, [
					{ field: 'priority', value: 'high' }
				]);

				expect(result.success).toBe(true);
				expect(data.watchlist[0].priority).toBe('high');
				expect(data.watchlist[1].priority).toBe('normal');
				expect(data.watchlist[2].priority).toBe('high');
			});

			it('should find and tag recent movies', () => {
				const data = {
					watchlist: [
						{ title: 'Inception', year: 2010 },
						{ title: 'Dune', year: 2021 },
						{ title: 'Everything Everywhere All at Once', year: 2022 }
					]
				};

				const condition = parseCondition('year >= 2020');
				const result = executeUpdateWhere(data, 'watchlist', condition, [
					{ field: 'tags', value: ['recent', 'modern'] }
				]);

				expect(result.success).toBe(true);
				expect(data.watchlist[0].tags).toBeUndefined();
				expect(data.watchlist[1].tags).toEqual(['recent', 'modern']);
				expect(data.watchlist[2].tags).toEqual(['recent', 'modern']);
			});
		});

		describe('Combined operations - Real scenarios', () => {
			it('should archive old watched movies', () => {
				const data = {
					watchlist: [
						{ title: 'Old Movie', watched: true, watchedYear: 2020 },
						{ title: 'Recent Movie', watched: true, watchedYear: 2025 },
						{ title: 'Unwatched', watched: false }
					]
				};

				const condition = parseCondition('watched = true AND watchedYear < 2025');
				const result = executeUpdateWhere(data, 'watchlist', condition, [
					{ field: 'archived', value: true },
					{ field: 'archiveDate', value: '2025-11-23' }
				]);

				expect(result.success).toBe(true);
				expect(data.watchlist[0].archived).toBe(true);
				expect(data.watchlist[0].archiveDate).toBe('2025-11-23');
				expect(data.watchlist[1].archived).toBeUndefined();
			});

			it('should tag low-rated watched movies for removal', () => {
				const data = {
					watchlist: [
						{ title: 'Bad Movie', rating: 2.5, watched: true },
						{ title: 'Good Movie', rating: 8.8, watched: true },
						{ title: 'Unwatched', rating: 7.0, watched: false }
					]
				};

				const condition = parseCondition('rating < 5.0 AND watched = true');
				const result = executeUpdateWhere(data, 'watchlist', condition, [
					{ field: 'toRemove', value: true }
				]);

				expect(result.success).toBe(true);
				expect(data.watchlist[0].toRemove).toBe(true);
				expect(data.watchlist[1].toRemove).toBeUndefined();
				expect(data.watchlist[2].toRemove).toBeUndefined();
			});
		});
	});

	describe('Books Database - readingList', () => {
		describe('Track reading progress', () => {
			it('should update reading progress', () => {
				const data = {
					readingList: [
						{ title: '1984', author: 'George Orwell', pages: 328, currentPage: 0, status: 'to-read' },
						{ title: 'Dune', author: 'Frank Herbert', pages: 688, currentPage: 150, status: 'reading' }
					]
				};

				const condition = parseCondition('title = "Dune"');
				const result = executeUpdateWhere(data, 'readingList', condition, [
					{ field: 'currentPage', value: 350 },
					{ field: 'lastRead', value: '2025-11-23' }
				]);

				expect(result.success).toBe(true);
				expect(data.readingList[1].currentPage).toBe(350);
				expect(data.readingList[1].lastRead).toBe('2025-11-23');
			});

			it('should mark book as finished and add rating', () => {
				const data = {
					readingList: [
						{ title: '1984', author: 'George Orwell', pages: 328, currentPage: 300, status: 'reading' }
					]
				};

				const condition = parseCondition('title = "1984"');
				const result = executeUpdateWhere(data, 'readingList', condition, [
					{ field: 'status', value: 'finished' },
					{ field: 'currentPage', value: 328 },
					{ field: 'finishedDate', value: '2025-11-23' },
					{ field: 'rating', value: 5 }
				]);

				expect(result.success).toBe(true);
				expect(data.readingList[0].status).toBe('finished');
				expect(data.readingList[0].currentPage).toBe(328);
				expect(data.readingList[0].rating).toBe(5);
			});

			it('should find books with high completion percentage', () => {
				const data = {
					readingList: [
						{ title: '1984', pages: 328, currentPage: 300 },
						{ title: 'Dune', pages: 688, currentPage: 100 }
					]
				};

				const condition = parseCondition('currentPage > 250');
				const hasAlmostFinished = data.readingList.some(item => evaluateCondition(condition, item));

				expect(hasAlmostFinished).toBe(true);
			});

			it('should sort by reading progress', () => {
				const data = {
					readingList: [
						{ title: '1984', pages: 328, currentPage: 50 },
						{ title: 'Dune', pages: 688, currentPage: 400 },
						{ title: 'Foundation', pages: 255, currentPage: 10 }
					]
				};

				const result = executeSortBy(data, 'readingList', 'currentPage', 'DESC');

				expect(result.success).toBe(true);
				expect(data.readingList[0].currentPage).toBe(400);
				expect(data.readingList[1].currentPage).toBe(50);
				expect(data.readingList[2].currentPage).toBe(10);
			});
		});

		describe('Add default fields to books missing them', () => {
			it('should add status field where missing', () => {
				const data = {
					readingList: [
						{ title: '1984', author: 'George Orwell' },
						{ title: 'Dune', author: 'Frank Herbert', status: 'reading' }
					]
				};

				// Check which items are missing status
				const condition = parseCondition('status !exists');
				const result = executeUpdateWhere(data, 'readingList', condition, [
					{ field: 'status', value: 'to-read' },
					{ field: 'addedDate', value: '2025-11-23' }
				]);

				expect(result.success).toBe(true);
				expect(data.readingList[0].status).toBe('to-read');
				expect(data.readingList[0].addedDate).toBe('2025-11-23');
				expect(data.readingList[1].status).toBe('reading');
				expect(data.readingList[1].addedDate).toBeUndefined();
			});
		});
	});

	describe('Multi-step workflows', () => {
		it('should process watchlist - sort and prioritize', () => {
			const data = {
				watchlist: [
					{ title: 'The Room', rating: 3.7, watched: false },
					{ title: 'Inception', rating: 8.8, watched: true },
					{ title: 'Interstellar', rating: 8.6, watched: false }
				]
			};

			// Step 1: Move unwatched to top
			const unwatchedCondition = parseCondition('watched = false');
			const moveResult = executeMoveWhere(data, 'watchlist', unwatchedCondition, 'START');

			expect(moveResult.success).toBe(true);
			expect(data.watchlist[0].watched).toBe(false);
			expect(data.watchlist[1].watched).toBe(false);

			// Step 2: Sort by rating DESC
			const sortResult = executeSortBy(data, 'watchlist', 'rating', 'DESC');

			expect(sortResult.success).toBe(true);
			expect(data.watchlist[0].rating).toBe(8.8);
			expect(data.watchlist[1].rating).toBe(8.6);
			expect(data.watchlist[2].rating).toBe(3.7);
		});
	});
});
