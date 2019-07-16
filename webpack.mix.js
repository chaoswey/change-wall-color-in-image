const mix = require('laravel-mix');

mix.js(['src/index.js'], 'dist/index.min.js');


mix.options({processCssUrls: false}).sourceMaps();