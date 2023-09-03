import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	PluginManifest,
} from "obsidian";
import { setupWorker, rest, SetupWorker } from 'msw'

// Remember to rename these classes and interfaces!

interface PluginSettings {
	SyncAPI: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	SyncAPI: "https://api.obsidian.md",
};

export default class InterceptorPlugin extends Plugin {
	settings: PluginSettings;
	origGetHost: Function;
	worker: SetupWorker;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		const syncInstance = this.getInternalPluginInstance("sync");
		this.origGetHost = syncInstance.getHost.bind(syncInstance);
	}

	getInternalPluginInstance(id: string) {
		// @ts-ignore: Property 'internalPlugins' does not exist on type 'App'.
		return this.app.internalPlugins.getPluginById(id).instance;
	}

	async onload() {
		await this.loadSettings();

		this.worker = setupWorker(
			rest.get("https://api.obsidian.md", (req, res, ctx) => {
				return res(ctx.status(200), ctx.text("Hello world"));
			})
		);
		await this.worker.start();

		this.getInternalPluginInstance("sync").getHost = () => {
			let url = this.origGetHost();
			const syncAPI = this.settings.SyncAPI;

			if (syncAPI) {
				const scheme = syncAPI.startsWith("http:") ? "ws" : "wss";
				const syncAPIWithoutScheme = syncAPI.replace(
					/^https?:\/\//,
					""
				);
				url = `${scheme}://${syncAPIWithoutScheme}/ws`;
			}

			console.log("Websocket URL:", url);

			return url;
		};

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {
		this.worker.stop();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: InterceptorPlugin;

	constructor(app: App, plugin: InterceptorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Obsidian Sync URL")
			.addText((text) => {
				text.setPlaceholder(DEFAULT_SETTINGS.SyncAPI)
					.setValue(this.plugin.settings.SyncAPI)
					.onChange(async (value) => {
						if (this.plugin.settings) {
							this.plugin.settings.SyncAPI = value;
							await this.plugin.saveSettings();
						}
					});
			});
	}
}
