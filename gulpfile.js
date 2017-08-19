'use strict';
//const gulp = require('gulp');
var gulp = require('gulp-help')(require('gulp'));
const mocha = require('gulp-spawn-mocha');
const gulpSequence = require('gulp-sequence');



const config = {
  src: [
    'src/**/*.js'
  ],
  specs: 'test/**/*-spec.js'
};



// TODO: Docs
const jsdoc = require('gulp-jsdoc3');
gulp.task('docs', 'Builds documentation using JSDoc3', function(cb) {
  gulp.src(['README.md'].concat(config.src), {
      read: false
    })
    .pipe(jsdoc(cb));
});


// TODO: Coveralls
const coveralls = require('gulp-coveralls');
gulp.task('coveralls', 'Publishes coveralls report', function() {
  return gulp.src('./coverage/lcov.info')
    .pipe(coveralls());
});

// TODO: Code Coverage
const istanbul = require('gulp-istanbul');
gulp.task('pre-test', 'Runs code coverage', function() {
  return gulp.src(config.src)
    .pipe(istanbul({
      includeUntested: true,
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', 'Runs mocha unit tests', function() {
  return gulp.src(config.specs)
    .pipe(mocha({
      read: false,
      istanbul: true,
      reporter: 'mochawesome'
    }))
    //.pipe(istanbul.writeReports())
    .once('error', function() {
      process.exit(1);
    })
    .once('end', function() {
      process.exit();
    });
});

gulp.task('watch', 'Watches sources changes and tests', function() {
  gulp.watch([config.src, 'test/**/*.js'], ['test']);
});


gulp.task('default', 'build, test, docs and coverals', gulpSequence('test', 'docs', 'coveralls'));
