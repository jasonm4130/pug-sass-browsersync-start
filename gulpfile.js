var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var pug = require('gulp-pug');
var cache = require('gulp-cache');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var critical = require('critical').stream;
var order = require("gulp-order");
var reload = browserSync.reload;

// Better Error Handling
var gulp_src = gulp.src;
gulp.src = function() {
    return gulp_src.apply(gulp, arguments)
        .pipe(plumber(function(error) {
            // Output Error Message
            gutil.log(gutil.colors.red('Error (' + error.plugin + '):' + error.message));
            // Properly end the task
            this.emit('end');
        }));
};

// Compile Sass files
gulp.task('sass', function() {
    return gulp.src('assets/sass/*.sass')
        .pipe(sass({
            onError: browserSync.notify,
            outputStyle: 'compressed'
        }))
        .pipe(prefix(['last 5 versions', '> 1%', 'ie 8', 'ie 7'], {
            cascade: true
        }))
        .pipe(cleanCSS())
        .pipe(gulp.dest('_site/assets/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

//  Generate Critical CSS
gulp.task('critical', function () {
    return gulp.src('_site/*.html')
        .pipe(critical({inline: false, base: '_site/', css: ['_site/assets/css/main.css']}))
        .pipe(cleanCSS())
        .pipe(rename('critical.min.css'))
        .pipe(gulp.dest('_includes/'))
});

//  Gulp Pug
gulp.task('pug', function () {
    return gulp.src('_pugfiles/**/*.pug')
        .pipe(pug({
            basedir: './'
        }))
        .pipe(gulp.dest('_includes'))
});

//  Gulp Pug Compile
gulp.task('site-pug', function () {
    return gulp.src('*.pug')
        .pipe(pug({
            basedir: './'
        }))
        .pipe(gulp.dest('_site/'))
});

//  Gulp JS
gulp.task('scripts', function () {
    return gulp.src([
        'assets/js/vendor/jquery/**/*.js',
        'assets/js/vendor/bootstrap/**/*.js',
        'assets/js/vendor/**/*.js',
        'assets/js/**/*.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('scripts.min.js'))
    .pipe(sourcemaps.write())
    .pipe(uglify())
    .pipe(gulp.dest('_site/assets/js'))
});

//  BrowserSync task
gulp.task('browser-sync', ['sass', 'pug', 'scripts'], function () {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

//  Assets Copy
gulp.task('assets', function () {
    return gulp.src([
        'assets/img/**/*',
        'assets/fonts/**/*',
        'assets/other/**/*'
        ])
        .pipe(gulp.dest('_site/assets/'))
});

//  Watch Task
gulp.task('watch', function () {
    gulp.watch('assets/sass/**/*', ['sass']);
    gulp.watch('_pugfiles/**/*.pug', ['pug']);
    gulp.watch('*.pug', ['site-pug']);
    gulp.watch('assets/js/**/*.js', ['scripts']);
    gulp.watch(['assets/img/**/*', 'assets/fonts/**/*', 'assets/other/**/*'], ['assets']);
    gulp.watch(['_site/**/*.html']).on("change", reload);
    gulp.watch(['_site/assets/**/*', '!_site/assets/css/**/*']).on("change", reload);
});

// Build Task
gulp.task('build', function (done) {
    runSequence(['sass'], ['pug', 'critical'], ['site-pug', 'scripts', 'assets']);
});

// Default / Server Task
gulp.task('default', function (done) {
    runSequence(['sass'], ['pug', 'critical'], ['site-pug', 'scripts', 'assets'], ['browser-sync', 'watch']);
});