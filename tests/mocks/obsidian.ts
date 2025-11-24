/**
 * Mock Obsidian API for testing
 */

export class Notice {
	constructor(public message: string, public timeout?: number) {}
}

export class Plugin {
	app: any;
	async loadData() { return null; }
	async saveData(data: any) {}
}

export class Modal {
	app: any;
	contentEl: any = { empty: () => {}, createEl: () => ({}) };
	constructor(app: any) { this.app = app; }
	open() {}
	close() {}
	onOpen() {}
	onClose() {}
}

export class PluginSettingTab {
	app: any;
	plugin: any;
	containerEl: any = {
		empty: () => {},
		createEl: () => ({})
	};
	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
	display() {}
}

export class Setting {
	constructor(containerEl: any) {}
	setName(name: string) { return this; }
	setDesc(desc: string) { return this; }
	addText(cb: any) { return this; }
	addToggle(cb: any) { return this; }
	addDropdown(cb: any) { return this; }
}

export interface TFile {
	path: string;
	basename: string;
	name: string;
	parent: any;
}

export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/');
}
