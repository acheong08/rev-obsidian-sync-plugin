import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	PluginManifest,
	Notice,
} from "obsidian";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";
// import type { BrowserWindow } from "electron";

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
	interceptor: XMLHttpRequestInterceptor;

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
		this.interceptor = new XMLHttpRequestInterceptor();
		this.interceptor.apply();
		this.interceptor.on("request", async ({ request, requestId }) => {
			await this.loadSettings();
			console.log(request.method, request.url);
			let url = request.url;
			// Replace api url with sync api url
			if (request.url.startsWith("https://api.obsidian.md")) {
				url = request.url.replace(
					"https://api.obsidian.md",
					this.settings.SyncAPI
				);
			}
			if (request.url.startsWith("https://publish.obsidian.md")) {
				url = request.url.replace(
					"https://publish.obsidian.md",
					this.settings.SyncAPI
				);
			}
			// The body is a stream. Finish reading it first
			let reader = request.body?.getReader();
			if (reader) {
				let result = await reader.read();
				let body = result.value;
				let response = await fetch(url, {
					method: request.method,
					headers: request.headers,
					body: body,
				});
				// Remove headers
				response.headers.forEach((_, key) => {
					if (key != "content-type" && key != "content-length") {
						request.headers.delete(key);
					}
				});
				request.respondWith(response);
			}
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
		try {
			// (<BrowserWindow>(
			(<any>window).electronWindow;
			// )).
			// @ts-ignore
			window.electronWindow.webContents.session.webRequest.onBeforeRequest(
				{ urls: ["https://api.obsidian.md/*"] },
				// @ts-ignore
				async ({ url }, callback) => {
					await this.loadSettings();
					// Replace api url with sync api url
					if (url.startsWith("https://api.obsidian.md")) {
						url = url.replace(
							"https://api.obsidian.md",
							this.settings.SyncAPI || DEFAULT_SETTINGS.SyncAPI
						);
					} else if (url.startsWith("https://publish.obsidian.md")) {
						url = url.replace(
							"https://publish.obsidian.md",
							this.settings.SyncAPI ||
								"https://publish.obsidian.md"
						);
					}

					callback({ redirectURL: url });
				}
			);
		} catch (e) {
			new Notice("Failed to intercept requests. The error was: " + e);
		}

		this.getInternalPluginInstance("sync").getHost = () => {
			let url = this.origGetHost();
			const syncAPI = this.settings.SyncAPI;

			if (syncAPI) {
				const scheme = syncAPI.startsWith("http:") ? "ws" : "wss";
				const syncAPIWithoutScheme = syncAPI.replace(
					/^https?:\/\//,
					""
				);
				url = `${scheme}://${syncAPIWithoutScheme}/ws.obsidian.md`;
			}

			console.log("Websocket URL:", url);

			return url;
		};
	}

	onunload() {
		this.interceptor.dispose();
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
