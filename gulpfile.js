const info = require( './info' );
const gulp = require( 'gulp' );
const gulpIf = require( 'gulp-if' );
const minimist = require( 'minimist' );
const webpackStream = require( 'webpack-stream' );
const webpack = require( 'webpack' );
const browserSync = require( 'browser-sync' );
const autoprefixer = require( 'gulp-autoprefixer' );
const plumber = require( 'gulp-plumber' );
const sass = require( 'gulp-sass' );
const cssmin = require( 'gulp-cssmin' );
const del = require( 'del' );
const fs = require( 'fs' );
const eslint = require( 'gulp-eslint' );
const typedoc = require( 'gulp-typedoc' );
const ts = require( 'gulp-typescript' );
const options = minimist( process.argv.slice( 2 ), {
	default: {
		ex: 'Controller',
		P: false,
	}
} );


/*-------------------
	Production
--------------------*/

const exDir = './examples/';
const docsExDir = './docs/examples/';

function isFixed( file ) {

	return file.eslint != null && file.eslint.fixed;

}

async function esLint( cb ) {

	let paths = [ './src/', './examples/' ];
	let promiseArray = [];

	for ( let i = 0; i < paths.length; i ++ ) {

		let promise = new Promise( resolve => {

			gulp.src( paths[ i ] + '**/*.ts' )
				.pipe( eslint( { useEslintrc: true, fix: true } ) )
				.pipe( eslint.format() )
				.pipe( gulpIf( isFixed, gulp.dest( paths[ i ] ) ) )
				.on( 'end', () => {

					resolve();

				} )
				.pipe( eslint.failAfterError() );

		} );

		promiseArray.push( promise );

	}

	await Promise.all( promiseArray ).then( () => {

		cb();

	} );

}

function buildPackages( cb ) {

	//develop build
	const conf = require( './config/webpack/umd.webpack.config' );
	const confMin = require( './config/webpack/umd-min.webpack.config' );

	webpackStream( conf, webpack )
		.pipe( gulp.dest( './build/' ) )
		.unpipe(
			webpackStream( confMin, webpack )
				.pipe( gulp.dest( './build/' ) )
				.on( 'end', cb ) );

}

function buildTypes( cb ) {

	var tsProjectDts = ts.createProject( './config/typescript/types.tsconfig.json' );

	//types
	gulp.src( './src/**/*.ts' )
		.pipe( tsProjectDts() ).dts
		.pipe( gulp.dest( './types' ) )
		.on( 'end', cb );

}

function buildTypeDoc( cb ) {

	//typedoc
	gulp.src( './src' )
		.pipe( typedoc( {
			module: "umd",
			target: "es6",
			out: "./docs/documentation",
			mode: "file",
			name: info.packageName,
			moduleResolution: "node"
		} ) )
		.on( 'end', cb );

}

function buildExamples( cb ) {

	fs.readdir( exDir, ( err, files ) => {

		if ( err ) throw err;

		const conf = require( './config/webpack/build-example.webpack.config.js' );
		conf.mode = 'production';

		for ( let i = 0; i < files.length; i ++ ) {

			let exName = files[ i ];

			if ( exName.charAt( 0 ) == '.' ) continue;

			//set webpack entry files
			conf.entry[ exName ] = exDir + exName + '/src/ts/main.ts';

			//sass
			gulp.src( exDir + exName + "/src/scss/style.scss" )
				.pipe( plumber() )
				.pipe( sass() )
				.pipe( autoprefixer() )
				.pipe( cssmin() )
				.pipe( gulp.dest( docsExDir + exName + "/css/" ) );

			//copy files
			gulp.src( exDir + exName + '/src/html/**/*' ).pipe( gulp.dest( docsExDir + exName + '/' ) );
			gulp.src( exDir + exName + '/src/assets/**/*' ).pipe( gulp.dest( docsExDir + exName + '/assets/' ) );

		}

		conf.output.filename = '[name]/js/main.js';

		//webpack
		webpackStream( conf, webpack )
			.on( 'error', function ( e ) {

				this.emit( 'end' );

			} )
			.pipe( gulp.dest( docsExDir ) )
			.on( 'end', cb );

	} );

}

function cleanBuildFiles( cb ) {

	del( [
		'./docs/examples/',
		'./docs/documentation/',
		'./types/'
	], {

		force: true,

	} ).then( paths => {

		cb();

	} );

}

/*-------------------
	Development
--------------------*/

let srcDir = '';
let distDir = '';

function copyDevFiles( cb ) {

	gulp.src( srcDir + '/html/**/*' ).pipe( gulp.dest( distDir ) );
	gulp.src( srcDir + '/assets/**/*' ).pipe( gulp.dest( distDir + '/assets/' ) );

	browserSync.reload();

	cb();

}

function cleanDevFiles( cb ) {

	del( [
		distDir,
	], {

		force: true,

	} ).then( ( paths ) => {

		cb();

	} );

}

function webpackDev() {

	const conf = require( './config/webpack/build-example.webpack.config.js' );
	conf.entry = {};
	conf.entry.main = srcDir + '/ts/main.ts';
	conf.mode = options.P ? 'production' : 'development';
	conf.output = {};
	conf.output.filename = 'main.js';

	return webpackStream( conf, webpack )
		.on( 'error', function ( e ) {

			this.emit( 'end' );

		} )
		.pipe( gulp.dest( distDir + "/js/" ) )
		.on( 'end', browserSync.reload );

}

function sassDev() {

	return gulp.src( srcDir + "/scss/style.scss" )
		.pipe( plumber() )
		.pipe( sass() )
		.pipe( autoprefixer() )
		.pipe( cssmin() )
		.pipe( gulp.dest( distDir + "/css/" ) )
		.pipe( browserSync.stream() );

}

function brSync() {

	browserSync.init( {
		server: {
			baseDir: distDir,
			index: "index.html",
		},
		notify: false,
		ghostMode: false
	} );

}

function watch() {

	gulp.watch( './src/**/*', gulp.series( webpackDev ) );
	gulp.watch( srcDir + '/ts/**/*', gulp.series( webpackDev ) );
	gulp.watch( srcDir + '/scss/*.scss', gulp.series( sassDev ) );
	gulp.watch( srcDir + '/html/**/*', gulp.series( copyDevFiles ) );
	gulp.watch( srcDir + '/assets/**/*', gulp.series( copyDevFiles ) );

}

function setDevLibraryPath( cb ) {

	srcDir = './examples/' + options.ex + '/src';
	distDir = './examples/' + options.ex + '/public';

	cb();

}

function setDevDocumentsPath( cb ) {

	srcDir = './docs_src';
	distDir = './docs';

	cb();

}

const develop = gulp.series(
	copyDevFiles,
	gulp.parallel( webpackDev, sassDev ),
	gulp.parallel( brSync, watch )
);

exports.lint = gulp.series( esLint );

exports.default = gulp.series(
	setDevDocumentsPath,
	develop
);

exports.dev = gulp.series(
	setDevLibraryPath,
	cleanDevFiles,
	develop
);

exports.build = gulp.series(
	cleanBuildFiles,
	esLint,
	buildPackages,
	buildTypes,
	buildTypeDoc,
	buildExamples,
	setDevDocumentsPath,
	develop
);

