# Rev Obsidian Sync Plugin

Plugin to be used alongside https://github.com/acheong08/rev-obsidian-sync/

> [!NOTE]
> It now works on 1.4.5 curtesy of [@t3chguy](https://github.com/t3chguy). Thank you so much!
> It doesn't work on mobile devices (IOS and Android). This is intentional by the official Obsidian Team.

## Installation
- `cd /path/to/vault/.obsidian`
- `mkdir -p plugins/custom-sync-plugin && cd plugins/custom-sync-plugin`
- `wget https://github.com/acheong08/rev-obsidian-sync-plugin/raw/master/main.js https://github.com/acheong08/rev-obsidian-sync-plugin/raw/master/manifest.json`

Alternatively, you can use https://github.com/TfTHacker/obsidian42-brat which can be found in the official community plugins list.

## Usage:
- Go to community plugins
- Enable the plugin
- Configure the API URL in settings after setting up your sync server
- Go to core plugins
- Enable sync
- Connect to remote vault

## FAQ
> ### Why is this not part of the community plugins?

`
We plan to keep Obsidian Sync first-party for a simple reason: users expect Obsidian to take their data very seriously. When users choose Obsidian Sync, we want to make sure that they do not experience data loss or privacy issues that might stem from third-party code. Of course it helps us cover our development and maintenance costs as well, but we think this is important for the long term health of Obsidian since we are 100% user-supported, not funded by VCs/investors.
` - Obsidian Team

> ### What platforms does this work on?

Desktop: Linux, MacOS, Windows.

> ### I can't find the .obsidian directory

It's hidden. You can configure your file app to show hidden files or use a terminal.

> ### How to I get a remote vault onto multiple devices?

You can make multiple local vaults which sync to the same remote vault. Simply create a new vault, repeat the instructions, and connect to the same remote vault.

> ### Privacy?

The plugin is dead simple. No data collected. You can even run your sync server on the local network without access to the internet.

## Credits
[@tuxmachine](https://github.com/tuxmachine) for the idea 
