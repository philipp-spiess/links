export default {
	async fetch(request: Request): Promise<Response> {
		try {
			const map = await loadLinkMap();
			const url = new URL(request.url);

			const redirectTo = map.get(url.pathname);

			if (redirectTo) {
				return new Response("Redirecting to ${redirectTo}", {
					status: 308,
					headers: {
						location: redirectTo,
						"cache-control": "public, max-age=604800",
					},
				});
			}
			return new Response(
				`<h1>Not found 😭</h1><a href="https://spiess.dev">spiess.dev</a>`,
				{
					status: 200,
					headers: {
						"Content-Type": "text/html; charset=utf-8",
					},
				},
			);
		} catch (err) {
			console.error(err);
			return new Response("Internal server error", { status: 500 });
		}
	},
};

// Loads the links.txt file from GitHub and parses it into a map.
async function loadLinkMap(): Promise<Map<string, string>> {
	const links = await fetch(
		"https://raw.githubusercontent.com/philipp-spiess/links/main/links.txt",
	).then((r) => r.text());
	return new Map(
		links.split("\n").flatMap((l) => {
			const [path, url] = l.split(" ");
			if (!path || !url || path.startsWith("#")) {
				return [];
			}
			return [[path, url]];
		}),
	);
}
