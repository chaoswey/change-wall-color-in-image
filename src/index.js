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
            background: "",
            overlay: ""
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
        over: {
            image: undefined
        },
        steps: [],
        backendLayer: {
            backendLayer: undefined,
            backendGroup: undefined,
            background: undefined,
            grayscale: undefined,
            overlay: undefined
        }
    },
    created: function () {
        //載入圖片
        this.sources.background = document.getElementById('sw1').getAttribute('src');
        this.sources.overlay = document.getElementById('sw2').getAttribute('src');

        //等待兩張圖載入
        Promise.all([this.imagePromise(this.sources.background), this.imagePromise(this.sources.overlay)]).then(images => {
            this.background.image = images[0];
            this.frontend.image = images[0];
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
        },
        //覆蓋圖層 變成 色彩增值 及綁定事件
        handleOverlay: function () {
            this.overlayMultiply();
            this.changeVerlayColor();
        },
        //取得 灰階 覆蓋背景
        getGrayscaleOverlayBlock: function () {
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
                this.backendLayer.grayscale.filters([Konva.Filters.HSL]);
                this.changeGrayscaleHSL();

                //去除背景
                this.backendLayer.background.hide();
                this.backendLayer.backendGroup.globalCompositeOperation("source-over");
                this.handleOverlay();
                this.frontendRefresh();
            });
        },
        frontendRefresh: function () {
            this.imagePromise(this.$refs.backendLayer.getStage().toDataURL()).then(image => {
                this.over.image = image;

                this.$nextTick(() => {
                    this.$refs.over.getStage().cache();
                    this.$refs.over.getStage().drawHitFromCache();
                    this.$refs.frontendLayer.getStage().moveToTop();
                    this.$refs.frontendGroup.getStage().moveToTop();
                    this.$refs.over.getStage().moveToTop();

                    this.$refs.frontendLayer.getStage().batchDraw();
                });
            });
        },
        //初始化 覆蓋圖層
        overlayInit: function () {
            let overlay = this.backendLayer.overlay;
            overlay.cache();
            overlay.filters([Konva.Filters.RGBA]);
        },
        //初始化 背景
        backgroundInit: function () {
            let background = this.backendLayer.background;
            background.filters([Konva.Filters.Grayscale]);
            background.cache();
        },
        //檢查 覆蓋圖層 預設變數
        changeGrayscaleHSL: function () {
            this.backendLayer.grayscale.luminance(parseFloat(this.hsl.luminance));
        },
        //檢查 覆蓋圖層 預設變數
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
        // backend layer 重繪
        backendLayerBatchDraw: function () {
            this.$refs.backendLayer.getStage().batchDraw();
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
            this.frontendRefresh();

            this.steps.push(this.backendLayer.backendGroup.toDataURL());
        },
        // input 事件
        handlerChangeVerlayColor: function () {
            this.changeVerlayColor();
            this.backendLayerBatchDraw();
            this.frontendRefresh();

            // this.steps.push(this.backendLayer.backendGroup.toDataURL());
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
        },
        handlerOverMouseover: function () {
            this.$refs.over.getStage().shadowEnabled(true);
            this.$refs.over.getStage().shadowBlur(10);
            this.$refs.over.getStage().shadowOffset({x: 0, y: 0});
            this.$refs.over.getStage().shadowColor('#3884ff');
            this.$refs.over.getStage().shadowOpacity(1);

            this.$refs.over.getStage().cache();
            this.$refs.over.getStage().drawHitFromCache();

            this.$refs.frontendLayer.getStage().batchDraw();
        },
        handlerOverMouseout: function () {
            this.$refs.over.getStage().shadowEnabled(false);
            this.$refs.over.getStage().cache();
            this.$refs.over.getStage().drawHitFromCache();

            this.$refs.frontendLayer.getStage().batchDraw();
        }
    }
});