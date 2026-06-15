let mapa = null; 

document.addEventListener('DOMContentLoaded', () => {
    navegacionFija();
    resaltarEnlace();
    scrollNav();
    inicializarModalMapa();
});

// Manejo optimizado del Modal del Mapa
function inicializarModalMapa() {
    const contenedorModulo = document.querySelector('#modal-mapa-interactivo');
    const botonCerrar = document.querySelector('#cerrar-mapa-interactivo');
    
    if (!contenedorModulo || !botonCerrar) return;

    // Se activa cuando el usuario da clic en la sección del mapa
    contenedorModulo.addEventListener('click', () => {
        if (!contenedorModulo.classList.contains('modal-activo')) {
            contenedorModulo.classList.add('modal-activo');
            
            // 🔥 SOLUCIÓN AL DESCUADRE: Espera 300ms a que el modal cambie de tamaño 
            // antes de que Leaflet dibuje la imagen. Así se evita el espacio en blanco abajo.
            setTimeout(() => {
                if (!mapa) {
                    inicializarMapa();
                } else {
                    mapa.invalidateSize();
                }
            }, 300); 
        }
    });

    botonCerrar.addEventListener('click', (e) => {
        e.stopPropagation(); 
        contenedorModulo.classList.remove('modal-activo');
    });

    // Soporte de accesibilidad por teclado (Tecla Escape)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contenedorModulo.classList.contains('modal-activo')) {
            contenedorModulo.classList.remove('modal-activo');
        }
    });
}

// Recalcula el tamaño del mapa de forma segura evitando errores en la consola
function forzarRedimensionMapa(retraso) {
    setTimeout(() => {
        if (mapa && typeof mapa.invalidateSize === 'function') {
            mapa.invalidateSize();
        }
    }, retraso);
}

// Barra de navegación fija con IntersectionObserver (Rendimiento óptimo)
function navegacionFija() {
    const header = document.querySelector('.header');
    const sobreEvento = document.querySelector('.sobre-evento');

    if (!header || !sobreEvento) return;

    const observer = new IntersectionObserver(([entry]) => {
        header.classList.toggle('fixed', !entry.isIntersecting);
    }, { rootMargin: '-1px 0px 0px 0px', threshold: 0 });

    observer.observe(sobreEvento);
}

// Resaltar enlaces de navegación dinámicamente según el scroll
function resaltarEnlace() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navegacion-principal a');

    if (!sections.length || !navLinks.length) return;

    const opciones = { rootMargin: '-30% 0px -70% 0px' };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idActual = entry.target.id;
                navLinks.forEach(link => {
                    const seccionDestino = link.getAttribute('href')?.replace('#', '');
                    link.classList.toggle('active', seccionDestino === idActual);
                });
            }
        });
    }, opciones);

    sections.forEach(section => {
        if (section.id) observer.observe(section);
    });
}

// Inicialización de Leaflet con detección automática de dimensiones y ajustes de UX
function inicializarMapa() {
    const contenedorMapa = document.getElementById('mapa-interactivo');
    if (!contenedorMapa || typeof L === 'undefined') return;

    const rutaImagen = 'src/img/gallery/full/mapa.avif';

    // Se carga la imagen en segundo plano para obtener el tamaño real del archivo
    const imgElement = new Image();
    imgElement.src = rutaImagen;

    imgElement.onload = function() {
        const alto = imgElement.naturalHeight;
        const ancho = imgElement.naturalWidth;

        if (mapa && typeof mapa.remove === 'function') {
            mapa.remove();
        }

        // Se añaden scrollWheelZoom: false y touchZoom: 'center' para optimizar la navegación móvil
        mapa = L.map('mapa-interactivo', {
            crs: L.CRS.Simple,
            minZoom: -1, 
            maxZoom: 2,
            attributionControl: false,
            scrollWheelZoom: false,
            touchZoom: 'center'
        });

        // Coordenadas de origen corregidas para encuadrar el plano perfectamente
        const limites = [[0, 0], [alto, ancho]];

        // Inyecta el croquis de la expo y encuadra la vista
        L.imageOverlay(rutaImagen, limites).addTo(mapa);
        mapa.fitBounds(limites);

        // Fuerza un reajuste dimensional de seguridad inmediato tras inyectar la imagen
        mapa.invalidateSize();
    };

    imgElement.onerror = function() {
        console.error("No se pudo cargar la imagen del mapa en: " + rutaImagen);
    };
}

// Navegación suave entre secciones (Smooth Scroll)
function scrollNav() {
    const navLinks = document.querySelectorAll('.navegacion-principal a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            const targetId = link.getAttribute('href');
            if (!targetId || !targetId.startsWith('#')) return;
            
            const section = document.querySelector(targetId);
            if (section) {
                e.preventDefault();
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}