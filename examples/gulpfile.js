// gulp methods
const gulp = require('gulp');
const concat = require('gulp-concat');
const sourceMaps = require('gulp-sourcemaps');
const rimraf = require("rimraf");
//const browserify = require('gulp-browserify');
const browserify = require('browserify');
const tsify = require('tsify');
const source = require('vinyl-source-stream');


// typescript
const ts = require('gulp-typescript');

// paths
const jsDest = 'examples/js';

// clean the contents of the distribution directory
gulp.task('clean', function(done) {
    rimraf('examples/js/**/*',done);
});


var config = {
	publicPath: __dirname + '/js',
	app: {
		path: __dirname ,
		main: 'videoroom.ts',
		result: 'application.js'
	}
};


gulp.task('compile-js', function() {
	var bundler = browserify({basedir: config.app.path})
		.add(config.app.main)
		.plugin(tsify);
	
	return bundler.bundle()
		.pipe(source(config.app.result))
		.pipe(gulp.dest(config.publicPath));
});


// // build typescript
// gulp.task('ts', function(){
//     const tsProject = ts.createProject('../tsconfig.json');
//     return tsProject.src()
//          .on('error', function (error) { console.error(error.toString()); })
//           .pipe(tsProject())
//           .pipe(concat("janus.js"))
//         //   .pipe(browserify({
//         //     insertGlobals : true,
//         //     debug : true
//         //   }))
//         //   .pipe(sourceMaps.init({loadMaps: true}))
//         //   
//         //   .pipe(sourceMaps.write("./"))
//           .pipe(gulp.dest(jsDest));




//     // return browserify({
//     //     basedir: '.',
//     //     debug: true,
//     //     entries: ['src/main.ts'],
//     //     cache: {},
//     //     packageCache: {}
//     // })
//     // .plugin(tsify)
//     // .bundle()
//     // .pipe(source('bundle.js'))
//     // .pipe(gulp.dest('dist'));



//     // return browserify()
//     // .pipe(tsProject())
//     // .plugin(tsify, { noImplicitAny: true })
//     // .bundle()
//     // .on('error', function (error) { console.error(error.toString()); })
//     // .pipe(gulp.dest(jsDest));

//     // return tsProject.src()
//     //     .pipe(tsProject())
//     //     .pipe(sourceMaps.init())
//     //     .pipe(sourceMaps.write(jsDest + "/janus.js.map"))
//     //     .js
//     //         .pipe(concat('janus.js'))
//     //         .pipe(gulp.dest(jsDest));
//     // return tsProject.src()
//     //     .on('error', function (err) {
//     //         console.log(err.message);
//     //     })
//     //     .pipe(sourceMaps.init())
//     //     .pipe(tsProject())
//     //     .pipe(sourceMaps.write(jsDest + "/janus.js.map", {includeContent: false, sourceRoot: jsDest}))
//     //     .js.pipe(concat('janus.js'))
//     //     .pipe(gulp.dest(jsDest));
// });

// gulp.task('scripts', function(){
//     return browserify(paths.mainTs,{debug: true})
//         .on('error',console.error.bind(console))
//         .plugin(tsify)
//         .bundle()
//         .pipe(source('all.js'))
//         .pipe(buffer())
//         .pipe(sourcemaps.init({loadMaps: true}))
//         .pipe(gulp.dest(paths.outscripts))
//         .pipe(rename('all.min.js'))
//         .pipe(uglify())
//         .pipe(sourcemaps.write())
//         .pipe(gulp.dest(paths.outscripts));
// });

// gulp.task('default',gulp.series(['clean', 'ts']));
gulp.task('default',gulp.series(['clean', 'compile-js']));