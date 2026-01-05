# YAML Toolkit

Bulk manipulate YAML front matter with condition-based rules and preview.

## Features

- **Bulk Operations**: Apply YAML changes to multiple notes at once
- **Condition-Based Rules**: Use powerful filters to target specific notes
- **Preview Changes**: See what will change before applying modifications
- **Safe Operations**: Preview mode prevents accidental data loss
- **Flexible Queries**: Support for complex conditions and array operations
- **Array Manipulation**: Add, remove, or modify array elements in YAML front matter

## Installation

### Using BRAT (Recommended)

This plugin is currently in beta. Install via BRAT for automatic updates:

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings (Settings → BRAT)
3. Click "Add Beta plugin"
4. Enter: `ramnathk/obsidian-yaml-toolkit`
5. Click "Add Plugin"
6. Enable the plugin in Settings → Community Plugins

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/ramnathk/obsidian-yaml-toolkit/releases/latest)
2. Create a folder in your vault: `.obsidian/plugins/yaml-toolkit/`
3. Copy the downloaded files to this folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

## Usage

### Basic Workflow

1. Open the command palette (`Cmd/Ctrl + P`)
2. Search for "YAML Toolkit"
3. Select your desired operation
4. Configure conditions and actions
5. Preview changes
6. Apply when satisfied

### Example Use Cases

#### Add a tag to all notes in a folder

- **Condition**: Note is in specific folder
- **Action**: Add tag to `tags` array
- **Preview**: See which notes will be affected

#### Update status based on content

- **Condition**: Note contains specific text
- **Action**: Set `status` field to `complete`
- **Preview**: Verify the changes

#### Bulk organize YAML fields

- **Condition**: All notes (or filtered selection)
- **Action**: Add missing fields with default values
- **Preview**: Ensure consistency across vault

## Requirements

- Obsidian v0.15.0 or higher
- Desktop only (not available on mobile)

## Documentation

📚 **[Full Documentation Site](https://ramnathk.github.io/obsidian-yaml-toolkit/)** - Complete guides, examples, and reference

### Quick Links

- **[Getting Started](https://ramnathk.github.io/obsidian-yaml-toolkit/guide/getting-started)** - Learn the basics
- **[Installation Guide](https://ramnathk.github.io/obsidian-yaml-toolkit/guide/installation)** - Step-by-step setup
- **[Syntax Reference](https://ramnathk.github.io/obsidian-yaml-toolkit/reference/syntax)** - Complete syntax guide
- **[Examples](https://ramnathk.github.io/obsidian-yaml-toolkit/reference/examples)** - Real-world use cases
- **[Advanced Usage](https://ramnathk.github.io/obsidian-yaml-toolkit/guide/advanced-queries)** - Power user features

## Support

If you encounter issues or have feature requests:

1. Check the [GitHub Issues](https://github.com/ramnathk/obsidian-yaml-toolkit/issues)
2. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Your Obsidian version

## License

MIT License - see LICENSE file for details

## Version

Current version: **1.3.3**

See [CHANGELOG.md](CHANGELOG.md) for release history and updates.

---

*This plugin is part of the Obsidian community and is not officially affiliated with Obsidian.md*
