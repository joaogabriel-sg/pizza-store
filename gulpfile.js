const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();

sass.compiler = require('node-sass');

function compileSass() {
  return gulp
    .src('./public/scss/style.scss')
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
}

function watch() {
  browserSync.init({
    server: {
      baseDir: './',
    },
  });
  gulp.watch('./public/scss/**/*.scss', compileSass);
  gulp.watch('./*.html').on('change', browserSync.reload);
  gulp.watch('./public/scripts/**/*.js').on('change', browserSync.reload);
}

gulp.task('sass', compileSass);
gulp.task('watch', watch);
