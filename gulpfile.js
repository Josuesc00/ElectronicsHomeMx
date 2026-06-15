import path from 'path'
import fs from 'fs'
import { glob } from 'glob'
import { src, dest, watch, series } from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'

const sass = gulpSass(dartSass)

import terser from 'gulp-terser'
import sharp from 'sharp'

export function js( done ) {
    src('src/js/app.js')
        .pipe(terser())
        .pipe( dest('build/js') ) 

    done()
}

export function css( done ) {
    src('src/scss/app.scss', {sourcemaps: true})
        .pipe( sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError) )
        .pipe( dest('build/css', {sourcemaps: '.'}) )

    done()
}

// 1. Recorta los JPG/PNG originales de full y crea las miniaturas en src/.../thumb
export async function crop(done) {
    const inputFolder = 'src/img/gallery/full'
    const outputFolder = 'src/img/gallery/thumb';
    const width = 250;
    const height = 180;
    
    if (!fs.existsSync(inputFolder)) {
        console.log(`La carpeta ${inputFolder} no existe todavía.`);
        return done();
    }

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true })
    }
    
    // Soporte para jpg, jpeg y png en el recorte
    const images = fs.readdirSync(inputFolder).filter(file => {
        return /\.(jpg|jpeg|png)$/i.test(path.extname(file));
    });
    
    try {
        await Promise.all(images.map(file => {
            const inputFile = path.join(inputFolder, file)
            const outputFile = path.join(outputFolder, file)
            return sharp(inputFile) 
                .resize(width, height, {
                    position: 'centre'
                })
                .toFile(outputFile);
        }));

        done()
    } catch (error) {
        console.log(error)
        done()
    }
}

// 2. Lee todas las imágenes de desarrollo y delega la conversión exclusiva a AVIF
export async function imagenes(done) {
    const srcDir = './src/img';
    const buildDir = './build/img';
    const images = await glob('./src/img/**/*.{jpg,jpeg,png}')

    images.forEach(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        procesarImagenes(file, outputSubDir);
    });
    done();
}

// 3. Generación exclusiva en formato .avif
function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true })
    }
    const baseName = path.basename(file, path.extname(file))
    
    // EXCLUSIVO: La ruta final en build tendrá extensión única .avif
    const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`)

    // Transforma directamente cualquier formato de origen a AVIF optimizado
    sharp(file)
        .avif({ quality: 80 })
        .toFile(outputFileAvif)
        .catch(() => {})
}

export function dev() {
    watch('src/scss/**/*.scss', css)
    watch('src/js/**/*.js', js)
    watch('src/img/**/*.{png,jpg,jpeg}', series(crop, imagenes))
}

// Flujo por defecto en consola
export default series( crop, js, css, imagenes, dev )