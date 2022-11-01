const gulp = require('gulp');
const path = require('path');
const babel = require('gulp-babel');

const src = path.join(__dirname, 'src');
const dist = path.join(__dirname, 'lib');
const extTypes = ['ts', 'json', 'txml', 'sjs', 'tcss'];

gulp.task('ts', () =>
  gulp
    .src('src/**/*.ts')
    .pipe(babel())
    .on('error', (err) => {
      console.log(err);
    })
    .pipe(gulp.dest(dist)),
);

gulp.task('json', () => gulp.src(`${src}/**/*.json`).pipe(gulp.dest(dist)));

gulp.task('tcss', () => gulp.src(`${src}/**/*.tcss`).pipe(gulp.dest(dist)));

gulp.task('txml', () => gulp.src(`${src}/**/*.txml`).pipe(gulp.dest(dist)));

gulp.task('sjs', () => gulp.src(`${src}/**/*.sjs`).pipe(gulp.dest(dist)));

const build = gulp.series(...extTypes);
build();
