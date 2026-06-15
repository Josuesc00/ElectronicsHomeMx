import { src, dest, watch, series } from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'

import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import terser from 'gulp-terser'
import sourcemaps from 'gulp-sourcemaps' 

const sass = gulpSass(dartSass)


export function js (done){
    src('src/js/**/*.js')
        .pipe(terser())
        .pipe(dest('build/js'))
    done()
}

export function css( done ) {
    src('src/scss/app.scss', { allowEmpty: true })
        .pipe( sourcemaps.init() ) 
        .pipe( sass().on('error', sass.logError) )
        // 🔥 CORRECCIÓN MASTER: Agregamos cssnano barriendo absolutamente todos los comentarios y espacios
        .pipe( postcss([ 
            autoprefixer(), 
            cssnano({ discardComments: { removeAll: true } }) 
        ]) ) 
        .pipe( sourcemaps.write('.') ) 
        .pipe( dest('build/css') )

    done()
}

export function dev() {
    watch('src/scss/**/*.scss', css)
    watch('src/js/**/*.js', js)
}

export default series(js, css, dev)