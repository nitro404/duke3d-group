var fabricator = require("gulp-fabricator");

fabricator.setup({
	name: "Duke3d Group",
	build: {
		enabled: false,
		transformation: "None"
	},
	test: {
		target: ["src/*.js"]
	},
	base: {
		directory: __dirname
	}
});
