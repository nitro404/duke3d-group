const fabricator = require("gulp-fabricator");

fabricator.setup({
	name: "Duke3d Group",
	build: {
		enabled: false
	},
	test: {
		target: ["src/*.js"]
	},
	base: {
		directory: __dirname
	}
});
