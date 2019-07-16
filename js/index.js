// 畫布大小 cw = 寬
var cw = 1200,
    // 畫布大小 ch = 高
    ch = 800,
    //背景圖
    background,
    //覆蓋圖
    layer1,
    //灰階背景圖
    grayscale,
    //最終生成 覆蓋圖
    cover;

//畫布初始化
var stage = new Konva.Stage({container: 'container', width: cw, height: ch});

//layer 圖層
var layer = new Konva.Layer(),
    //layer 背景群組
    backgroundGroup = new Konva.Group(),
    //layer 覆蓋群組
    layerGroup = new Konva.Group();

//載入 背景圖跟覆蓋圖
var sources = {background: "./2/sw.jpg", layer1: "./2/sw.png"};
//設定 layer
layer.globalCompositeOperation("source-over");

loadImages(sources.background).then((image) => {
    //載入背景
    background = new Konva.Image({image: image});
    background.cache();
    backgroundGroup.add(background);
    layer.add(backgroundGroup);
    stage.add(layer);

    return loadImages(sources.layer1);
}).then((image) => {
    //載入覆蓋區域
    layer1 = new Konva.Image({image: image});
    layer1.cache();

    //清除 透明地區
    layer1.drawHitFromCache();

    //載入濾鏡 RGBA
    layer1.filters([Konva.Filters.RGBA]);
    layerGroup.add(layer1);
    layer.add(layerGroup);
    //以上生成覆蓋圖

    //globalCompositeOperation = 合成效果
    //destination-atop = 舊圖形只保留在新、舊圖形重疊的舊圖形區域，然後蓋在新圖形之上
    layer.globalCompositeOperation("destination-atop");

    //背景 載入濾鏡 灰階及 HSL 模式
    background.filters([Konva.Filters.Grayscale, Konva.Filters.HSL]);

    //輸出成 base64 灰階的擷取背景
    var grayscaleImg = stage.toDataURL();

    //source-over = 將新圖形畫在舊圖形之上
    //將 layer 還原初始設定
    layer.globalCompositeOperation("source-over");

    //載入 擷取背景
    return loadImages(grayscaleImg);
}).then((image) => {
    grayscale = new Konva.Image({image: image});
    grayscale.cache();
    grayscale.drawHitFromCache();

    //清除原本背景 濾鏡
    background.filters([]);

    layerGroup.add(grayscale);
    layer.batchDraw();

    //layerGroup 移動最上層
    layerGroup.moveToTop();

    //灰階背景 移動下層
    grayscale.zIndex(0);

    //覆蓋圖 移動上層
    layer1.zIndex(1);

    //layer1 變成 紅色遮色片
    layer1.red(255);

    //multiply = 色彩增值
    //layer1 變成 色彩增值
    layer1.globalCompositeOperation("multiply");

    //layerGroup
    layerGroup.globalCompositeOperation("source-over");

    //把 轉換好的顏色 擷取下來 因為 multiply 無法綁定事件
    layer.globalCompositeOperation("destination-atop");

    //輸出成 base64 色彩增值後的區塊
    var coverImg = stage.toDataURL();

    //載入 最後生成的覆蓋圖
    return loadImages(coverImg);
}).then((image) => {
    layer.globalCompositeOperation("source-over");
    cover = new Konva.Image({image: image});

    // 綁定事件
    cover.on('mouseover', function () {
        console.log("mouseover cover");
        cover.filters([Konva.Filters.RGBA]);
        cover.red(156);
        cover.green(156);
        cover.blue(156);
        cover.alpha(1);
        layer.batchDraw();
    });

    // 綁定事件
    cover.on('mouseout', function () {
        console.log("mouseout cover");
        cover.filters([]);
        layer.batchDraw();
    });

    cover.cache();
    cover.drawHitFromCache();
    //隱藏 灰色背景 及 色彩增值區塊
    layerGroup.hide();

    layer.add(cover);
    layer.batchDraw();
    panel();
});

//控制面板
function panel() {
    var sliders = ['red', 'green', 'blue', 'alpha'];
    sliders.forEach(function (attr) {
        var slider = document.getElementById(attr);

        function update() {
            cover.hide();
            layerGroup.show();
            layerGroup.moveToTop();
            layer1[attr](parseFloat(slider.value));
            layer.globalCompositeOperation("destination-atop");
            layer.batchDraw();
            var coverImg = stage.toDataURL();
            loadImages(coverImg).then((image) => {
                layer.globalCompositeOperation("source-over");
                cover = new Konva.Image({image: image});

                // 綁定事件
                cover.on('mouseover', function () {
                    console.log("mouseover cover");
                    cover.filters([Konva.Filters.RGBA]);
                    cover.red(156);
                    cover.green(156);
                    cover.blue(156);
                    cover.alpha(1);
                    layer.batchDraw();
                });

                // 綁定事件
                cover.on('mouseout', function () {
                    console.log("mouseout cover");
                    cover.filters([]);
                    layer.batchDraw();
                });

                cover.cache();
                cover.drawHitFromCache();
                //隱藏 灰色背景 及 色彩增值區塊
                layerGroup.hide();

                layer.add(cover);
                layer.batchDraw();

                layerGroup.hide();

                layer.batchDraw();
            });
        }

        slider.onchange = update;
        update();
    });
}

//canvas base64 download
function downloadURI(uri, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

//載入image
function loadImages(url) {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.onload = () => resolve(image);
        image.src = url;
    });
}

var downBtn = document.querySelector('#download');
downBtn.addEventListener('click', function(){
    downloadURI(stage.toDataURL(), 'new-image');
});