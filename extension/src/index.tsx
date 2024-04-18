import {
	ActionPanel,
	Action,
	List,
	Icon,
	useNavigation,
	Form,
} from "@raycast/api";
import { useState } from "react";
import { useFetch } from "@raycast/utils";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import clipboardy from "clipboardy";

const LINKS_URL =
	"https://raw.githubusercontent.com/philipp-spiess/links/main/links.txt";
const LINKS_DIR = join(process.env.HOME ?? "", "dev/links");
const LINKS_FILE = join(process.env.HOME ?? "", "dev/links/links.txt");

type OnCreate = (link: { link: string; url: string }) => void;

export default function Command() {
	const { isLoading, data, revalidate } = useFetch<string>(LINKS_URL);
	const links = parseData(data || "");

	async function onCreate(args: Parameters<OnCreate>[0]) {
		links.push([args.link, args.url]);

		const content = await fs.readFile(LINKS_FILE, "utf8");
		const newContent = syncIndentation(`${content}\n${args.link} ${args.url}`);
		await fs.writeFile(LINKS_FILE, newContent);
		execSync(`git add ${LINKS_FILE}`, { cwd: LINKS_DIR });
		execSync(`git commit -m 'Added new link ${args.link}'`, { cwd: LINKS_DIR });
		clipboardy.writeSync(`https://psp.sh${args.link}`);

		// Figure out how to do this automatically, without requiring human intervention
		execSync(`open -W -a Terminal '${LINKS_DIR}'`, { cwd: LINKS_DIR });

		revalidate();
	}

	return (
		<List isLoading={isLoading} searchBarPlaceholder={"Search links"}>
			{links.map(([link, url]) => (
				<List.Item
					key={link}
					title={link}
					icon={Icon.Link}
					accessories={[{ text: url }]}
					actions={
						<ActionPanel>
							<Action.CopyToClipboard content={`https://psp.sh${link}`} />
						</ActionPanel>
					}
				/>
			))}
			<List.Item
				title="Create a new link"
				icon={Icon.Plus}
				actions={
					<ActionPanel>
						<CreateLinkAction onCreate={onCreate} />
					</ActionPanel>
				}
			/>
		</List>
	);
}

function CreateLinkForm(props: { onCreate: OnCreate }) {
	const { pop } = useNavigation();

	const [link, setLink] = useState(
		`/${Math.random().toString(36).slice(2, 6)}`,
	);
	const [url, setUrl] = useState("");

	const [linkError, setLinkError] = useState<string | undefined>();
	const [urlError, setUrlError] = useState<string | undefined>();

	function handleSubmit() {
		if (!isValidLink(link)) {
			setLinkError("Invalid link");
			return;
		}
		if (!isValidUrl(url)) {
			setUrlError("Invalid URL");
			return;
		}

		props.onCreate({ link, url });
		pop();
	}

	return (
		<Form
			actions={
				<ActionPanel>
					<Action.SubmitForm title="Create Link" onSubmit={handleSubmit} />
				</ActionPanel>
			}
		>
			<Form.TextField
				id="link"
				title="Link"
				value={link}
				onChange={(link) => {
					if (linkError && isValidLink(link)) {
						setLinkError(undefined);
					}
					setLink(link);
				}}
				error={linkError}
			/>
			<Form.TextField
				id="url"
				title="URL"
				value={url}
				onChange={(url) => {
					if (urlError && isValidUrl(url)) {
						setUrlError(undefined);
					}
					setUrl(url);
				}}
				error={urlError}
				autoFocus
			/>
		</Form>
	);
}

function CreateLinkAction(props: { onCreate: OnCreate }) {
	return (
		<Action.Push
			icon={Icon.Plus}
			title="Create Link"
			shortcut={{ modifiers: ["cmd"], key: "n" }}
			target={<CreateLinkForm onCreate={props.onCreate} />}
		/>
	);
}

function parseData(raw: string): [string, string][] {
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
function syncIndentation(text: string): string {
	const lines = text.split("\n").filter((l) => l);
	const longestFirstValue =
		lines.reduce((acc, line) => {
			const [firstValue] = line.split(/\s+/);
			return Math.max(acc, firstValue.length);
		}, 0) + 1;

	return lines
		.map((line) => {
			const [firstValue, secondValue] = line.split(/\s+/);
			return `${firstValue}${" ".repeat(
				longestFirstValue - firstValue.length,
			)}${secondValue}`;
		})
		.join("\n");
}

function isValidLink(link: string): boolean {
	return /\/[a-zA-Z0-9\-_]+/.test(link);
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}
