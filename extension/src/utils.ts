export function parseData(raw: string): [string, string][] {
	const links: [string, string][] = [];
	for (const link of raw.split("\n")) {
		const [path, url] = link.split(/\s+/);
		if (!path || !url || path.startsWith("#") || path === "/") {
			continue;
		}
		links.push([path, url]);
	}
	return links;
}

// The raw text is a list of lines, where each line has two whitespace-separated
// values.
//
// This script ensures that the indentation of the second value is the same
// across all lines by setting the indentation based on the longest first value.
export function syncIndentation(text: string): string {
	const lines = text.split("\n");
	const newLines: string[] = [];

	const groups = findGroups(lines);
	for (const group of groups) {
		const indentation =
			group.reduce((acc, line) => {
				const parsed = parseLine(line);
				if (parsed) {
					return Math.max(acc, parsed[0].length);
				}
				return acc;
			}, 0) + 1;

		for (const line of group) {
			const parsed = parseLine(line);

			if (parsed) {
				const [firstValue, secondValue] = parsed;
				newLines.push(
					`${firstValue}${" ".repeat(
						indentation - firstValue.length,
					)}${secondValue}`,
				);
				continue;
			}
			newLines.push(line);
		}
	}

	return newLines.join("\n");
}

function findGroups(lines: string[]): string[][] {
	let currentGroupHasEntries = false;
	let currentGroup: string[] = [];
	const groups: string[][] = [currentGroup];
	for (const line of lines) {
		const parsed = parseLine(line);
		if (parsed || !currentGroupHasEntries) {
			if (parsed) {
				currentGroupHasEntries = true;
			}
			currentGroup.push(line);
		} else {
			// Start a new group
			currentGroup = [line];
			currentGroupHasEntries = false;
			groups.push(currentGroup);
		}
	}
	return groups;
}

export function isValidLink(link: string): boolean {
	return /\/[a-zA-Z0-9\-_]+/.test(link);
}

export function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

function parseLine(line: string): [string, string] | null {
	const [path, url] = line.split(/\s+/);
	if (!path || !url || path.startsWith("#")) {
		return null;
	}
	return [path, url];
}
