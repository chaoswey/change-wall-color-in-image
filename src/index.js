import Vue from 'vue';
import VueKonva from 'vue-konva';

Vue.use(VueKonva);

new Vue({
    el: '#app',
    data: {
        picker: {
            red: 255,
            green: 0,
            blue: 0,
            alpha: 1
        },
        hsl: {
            luminance: 0.5
        },
        sources: {
            background: "./1/sw.jpg",
            overlay: "./1/sw.png"
        },
        stage: {
            width: 1200,
            height: 800
        },
        background: {
            image: undefined
        },
        overlay: {
            image: undefined
        },
        grayscale: {
            image: undefined
        },
        frontend: {
            image: undefined
        },
        cover: {
            image: undefined
        },
        backendLayer: {
            backendLayer: undefined,
            backendGroup: undefined,
            background: undefined,
            grayscale: undefined,
            overlay: undefined
        }
    },
    created: function () {
        Promise.all([this.imagePromise(this.sources.background), this.imagePromise(this.sources.overlay)]).then(images => {
            this.background.image = images[0];
            this.overlay.image = images[1];

            //等待 vue doc 執行完成
            this.$nextTick(() => {
                this.draw();
            });
        });
    },
    methods: {
        draw: function () {
            Object.keys(this.backendLayer).map((key, index) => {
                this.backendLayer[key] = this.$refs[key].getStage();
            });

            //初始化 覆蓋圖層
            this.overlayInit();

            //初始化 背景
            this.backgroundInit();

            //取得灰色 背景
            this.getGrayscaleOverlayBlock();

            //backend group 改成 覆蓋模式
            this.backendGroupSourceOver();

            //背景灰階 改回來
            this.backendLayer.background.filters([]);

            //覆蓋圖層 變成 色彩增值 及綁定事件
            this.handleOverlay();

            //重繪 backend layer
            this.backendLayerBatchDraw();
        },
        //覆蓋圖層 變成 色彩增值 及綁定事件
        handleOverlay: function () {
            this.overlayMultiply();
            this.changeVerlayColor();
        },
        //取得 灰階 覆蓋背景
        getGrayscaleOverlayBlock: function () {
            this.backendLayer.background.filters([Konva.Filters.Grayscale]);
            this.backendGroupDestinationAtop();
            this.backendLayerBatchDraw();
            this.backendGroupExport();
        },
        //初始化 灰階覆蓋圖層
        grayscaleInit: function (image = null) {
            this.grayscale.image = image;

            this.$nextTick(() => {
                this.backendLayer.grayscale = this.$refs.grayscale.getStage();
                this.backendLayer.grayscale.cache();
                this.backendLayer.grayscale.drawHitFromCache();
                this.backendLayer.grayscale.filters([Konva.Filters.HSL]);
                this.changeGrayscaleHSL();
            });
        },
        //初始化 覆蓋圖層
        overlayInit: function () {
            let overlay = this.backendLayer.overlay;
            overlay.cache();
            overlay.drawHitFromCache();
            overlay.filters([Konva.Filters.RGBA]);
        },
        //初始化 背景
        backgroundInit: function () {
            let background = this.backendLayer.background;
            background.cache();
        },
        //檢查 覆蓋圖層 變數
        changeGrayscaleHSL: function () {
            this.backendLayer.grayscale.luminance(parseFloat(this.hsl.luminance));
        },
        //檢查 覆蓋圖層 變數
        changeVerlayColor: function () {
            let overlay = this.backendLayer.overlay;
            Object.keys(this.picker).map((key, index) => {
                overlay[key](parseFloat(this.picker[key]));
            });
        },
        // 遮罩 色彩增值模式
        overlayMultiply: function () {
            this.backendLayer.overlay.globalCompositeOperation("multiply");
        },
        // backend group 去除沒有交集的地方模式
        backendGroupDestinationAtop: function () {
            this.backendLayer.backendGroup.globalCompositeOperation("destination-atop");
        },
        // backend group 一般圖層模式
        backendGroupSourceOver: function () {
            this.backendLayer.backendGroup.globalCompositeOperation("source-over");
        },
        // backend layer 重繪
        backendLayerBatchDraw: function () {
            this.backendLayer.backendLayer.batchDraw();
        },
        // backend group 輸出成圖片
        backendGroupExport: function () {
            let grayscaleOverlayBlock = this.backendLayer.backendGroup.toDataURL();
            this.imagePromise(grayscaleOverlayBlock).then(image => this.grayscaleInit(image));
        },
        // 載入圖片
        imagePromise: function (url) {
            return new Promise((resolve, reject) => {
                let image = new Image();
                image.onload = () => resolve(image);
                image.src = url;
            });
        },
        // input 事件
        handlerGrayscaleHSL: function () {
            this.changeGrayscaleHSL();
            this.backendLayerBatchDraw();
        },
        // input 事件
        handlerChangeVerlayColor: function () {
            this.changeVerlayColor();
            this.backendLayerBatchDraw();
        },
        // 下載 事件
        handlerDownload: function () {
            this.downloadURI(this.$refs.stage.getStage().toDataURL(), "new");
        },
        // 下載 helper
        downloadURI: function (uri, name) {
            let link = document.createElement('a');
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            link = undefined;
        }
    }
});