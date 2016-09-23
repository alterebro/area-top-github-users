var gulp 		= require('gulp'),
	rename 		= require('gulp-rename'),
	htmlmin 	= require('gulp-htmlmin'),
	useref 		= require('gulp-useref'),
	gulpIf 		= require('gulp-if'),
	uglify 		= require('gulp-uglify'),
	cleanCSS 	= require('gulp-clean-css'),
	sequence 	= require('gulp-sequence');

gulp.task('build', function() {
	return 	gulp.src("./_app.html")
				.pipe(rename("index.html"))
				.pipe(useref())
				.pipe(gulpIf('*.js', uglify()))
				.pipe(gulpIf('*.css', cleanCSS()))
				.pipe(gulp.dest("./"));
});
gulp.task('compress', function() {
	return 	gulp.src('index.html', {base: './'})
			.pipe(htmlmin({ collapseWhitespace: true, removeComments: false, customAttrCollapse: /v-bind:class/ }))
			.pipe(gulp.dest('./'));
});

gulp.task('default', sequence('build', 'compress'));
