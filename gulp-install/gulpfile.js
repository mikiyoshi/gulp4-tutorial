const { src, dest, watch, series, parallel } = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const $ = loadPlugins();
const pkg = require('./package.json');
const conf = pkg['gulp-config'];
const sizes = conf.sizes;
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync');
const server = browserSync.create();
const isProd = process.env.NODE_ENV === 'production';

function icon(done) {
  for (let size of sizes) {
    let width = size[0];
    let height = size[1];
    src('./favicon.png')
      .pipe(
        $.imageResize({
          width,
          height,
          crop: true,
          upscale: false,
        })
      )
      .pipe($.imagemin())
      .pipe($.rename(`favicon-${width}x${height}.png`))
      .pipe(dest('./dist/images/icon'));
  }
  done(); // it can't use return in for loop
}

function styles() {
  return src('./src/sass/main.scss')
    .pipe($.if(!isProd, $.sourcemaps.init())) // 変換前も書き出してくれる
    .pipe($.sass())
    .pipe($.postcss([autoprefixer({ browsers: ['last 2 version'] })]))
    .pipe($.if(!isProd, $.sourcemaps.write('.'))) // 変換前も書き出してくれる
    .pipe(dest('./dist/css'));
}

function scripts() {
  return src('./src/js/*.js')
    .pipe($.if(!isProd, $.sourcemaps.init())) // 変換前も書き出してくれる
    .pipe($.babel())
    .pipe($.if(!isProd, $.sourcemaps.write('.'))) // 変換前も書き出してくれる
    .pipe(dest('./dist/js'));
}

function lint() {
  return src('./src/js/*.js')
    .pipe($.eslint({ fix: true }))
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError())
    .pipe(dest('./src/js'));
}

function startAppServer() {
  server.init({
    server: {
      baseDir: './dist',
    },
  });
  watch('./src/**/*.scss', styles);
  watch('./src/**/*.scss').on('change', server.reload);
}

// const serve = series(parallel(styles, series(lint, scripts)), startAppServer); // lint でエラーになる // 上の階層で lint が正常に動いたら、ここも直ったww 意味不明
const serve = series(parallel(styles, series(lint, scripts)), startAppServer);

exports.icon = icon;
exports.styles = styles;
exports.scripts = scripts;
exports.lint = lint;
exports.serve = serve;
