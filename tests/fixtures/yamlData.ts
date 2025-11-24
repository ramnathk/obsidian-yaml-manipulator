/**
 * Test fixtures - Sample YAML frontmatter data
 * Extracted from test-vault/ files for use in unit tests
 */

export const yamlFixtures = {
  // From test-vault/01-simple-note.md
  simpleNote: {
    title: 'Simple Note',
    status: 'draft'
  },

  // From test-vault/02-with-tags.md
  withTags: {
    title: 'Note with Tags',
    tags: ['work', 'project', 'urgent'],
    status: 'active',
    priority: 5
  },

  // From test-vault/03-nested-metadata.md
  nestedMetadata: {
    title: 'Note with Nested Metadata',
    metadata: {
      author: 'John Doe',
      version: 1.0,
      created: '2025-11-01',
      updated: '2025-11-15'
    },
    project: {
      name: 'Website Redesign',
      status: 'active',
      team: ['Alice', 'Bob', 'Charlie']
    }
  },

  // From test-vault/04-array-of-objects.md
  mantraLog: {
    title: 'Mantra Count Log',
    countsLog: [
      {
        mantra: 'Great Gatsby',
        count: 108,
        unit: 'Repetitions',
        date: '2025-11-15'
      },
      {
        mantra: 'Beloved',
        count: 216,
        unit: 'Repetitions',
        date: '2025-11-16'
      },
      {
        mantra: 'Kindred',
        count: 54,
        unit: 'Repetitions',
        date: '2025-11-17'
      }
    ]
  },

  // From test-vault/05-empty-frontmatter.md
  emptyFrontmatter: {},

  // From test-vault/10-drafts-old.md
  oldDraft: {
    title: 'Old Draft Note',
    status: 'draft',
    created: '2025-09-15',
    tags: ['draft', 'old']
  },

  // From test-vault/12-published.md
  published: {
    title: 'Published Article',
    status: 'published',
    publishedDate: '2025-11-10',
    author: 'John Doe',
    tags: ['article', 'published'],
    reviewed: true
  },

  // From test-vault/14-duplicate-tags.md
  duplicateTags: {
    title: 'Messy Tags',
    tags: ['work', 'urgent', 'work', 'project', 'zebra', 'urgent', 'apple', 'work'],
    status: 'needsCleaning'
  },

  // From test-vault/16-null-values.md
  nullValues: {
    title: 'Note with Null Values',
    status: 'active',
    deletedAt: null,
    archivedAt: null,
    reviewer: null
  },

  // From test-vault/17-empty-arrays.md
  emptyArrays: {
    title: 'Empty Arrays',
    tags: [],
    categories: [],
    assignees: []
  },

  // From test-vault/18-complex-tasks.md
  complexTasks: {
    title: 'Task List',
    tasks: [
      {
        title: 'Review PR',
        status: 'pending',
        priority: 5,
        assignee: 'Alice',
        tags: ['urgent', 'code-review']
      },
      {
        title: 'Write docs',
        status: 'in-progress',
        priority: 3,
        assignee: 'Bob',
        tags: ['documentation']
      },
      {
        title: 'Fix bug',
        status: 'done',
        priority: 8,
        assignee: 'Charlie',
        tags: ['bug', 'critical'],
        completedDate: '2025-11-15'
      }
    ]
  },

  // From test-vault/19-numeric-fields.md
  numericFields: {
    title: 'Numeric Data',
    priority: 7,
    progress: 85,
    score: 92.5,
    count: 1000,
    rating: 4.8
  },

  // From test-vault/20-boolean-fields.md
  booleanFields: {
    title: 'Boolean Flags',
    published: true,
    draft: false,
    reviewed: true,
    archived: false,
    featured: true
  }
};

export type FixtureName = keyof typeof yamlFixtures;
