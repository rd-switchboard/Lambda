var gulp = require('gulp');
var clean = require('gulp-clean'); 
var zip = require('gulp-zip');
var merge = require('merge-stream');

gulp.task('clean', function () {  
    var build = gulp.src('build', {read: false})
	.pipe(clean());
    var dist = gulp.src('dist', {read: false})
	.pipe(clean());

    return merge(build, dist);
});

gulp.task('build', function() {
    var index = gulp.src('index.js')
	.pipe(gulp.dest('build'));
    var lib = gulp.src('lib/*')
	.pipe(gulp.dest('build/lib'));
    var async = gulp.src('node_modules/async/**')
	.pipe(gulp.dest('build/node_modules/async'));
    var collections = gulp.src('node_modules/collections/**')
	.pipe(gulp.dest('build/node_modules/collections'));
    var underscore = gulp.src('node_modules/underscore/**')
	.pipe(gulp.dest('build/node_modules/underscore'));
    var util = gulp.src('node_modules/util/**')
	.pipe(gulp.dest('build/node_modules/util'));
    var xml2js = gulp.src('node_modules/xml2js/**')
	.pipe(gulp.dest('build/node_modules/xml2js'));

    return merge(index, lib, async, collections, underscore, util, xml2js);
});

gulp.task('zip', ['build'], function() {
    return gulp.src('build/*')
	.pipe(zip('processPmhDocument.zip'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['zip']);

