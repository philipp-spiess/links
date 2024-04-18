const LINKS_URL =
	"https://raw.githubusercontent.com/philipp-spiess/links/main/links.txt";

export default {
	async fetch(request: Request): Promise<Response> {
		try {
			const map = await loadLinkMap();
			const url = new URL(request.url);

			const redirectUrl = map.get(url.pathname);

			if (redirectUrl) {
				return new Response("Redirecting to ${redirectUrl}", {
					status: 308,
					headers: {
						location: redirectUrl,
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
	const res = await fetch(LINKS_URL, {
		cf: {
			cacheTtl: 60,
			cacheEverything: true,
		},
	});
	if (!res.ok) {
		throw new Error(
			`Failed to fetch ${LINKS_URL}: ${res.status} ${res.statusText}`,
		);
	}
	const links = await res.text();

	const entries: [string, string][] = links.split("\n").flatMap((l) => {
		const [path, url] = l.split(/\s+/);
		if (!path || !url || path.startsWith("#")) {
			return [];
		}
		return [[path, url]];
	});
	return new Map(entries);
}
