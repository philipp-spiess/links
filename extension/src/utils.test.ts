import { describe, it, expect } from "vitest";
import dedent from "dedent";
import { parseData, syncIndentation } from "./utils";

describe("parseDataInSections", () => {
	it("can parse", () => {
		const links = dedent`

			/ https://example.com

			# foo
			/foo https://example.com/foo
			/bar https://example.com/bar

			# baz
			/baz       https://example.com/baz
			/quxquxqux https://example.com/qux
		`;

		expect(parseData(links)).toEqual([
			{
				title: null,
				links: [["/", "https://example.com"]],
			},
			{
				title: "foo",
				links: [
					["/foo", "https://example.com/foo"],
					["/bar", "https://example.com/bar"],
				],
			},
			{
				title: "baz",
				links: [
					["/baz", "https://example.com/baz"],
					["/quxquxqux", "https://example.com/qux"],
				],
			},
		]);
	});
});

describe("syncIndentation", () => {
	it("finds the right indentations per group", () => {
		const text = dedent`
			# 1
			/aaaa https://example.com
			/aaaaaaaa https://example.com
			# 2
			/aaaaaaaaaaaa https://example.com
			/aa https://example.com

			#3
			/aaa https://example.com
			/aaaaa https://example.com
		`;
		expect(syncIndentation(text)).toBe(dedent`
			# 1
			/aaaa     https://example.com
			/aaaaaaaa https://example.com
			# 2
			/aaaaaaaaaaaa https://example.com
			/aa           https://example.com

			#3
			/aaa   https://example.com
			/aaaaa https://example.com
		`);
	});
});
