<template>
  <div>
    <div ref="cloudMap" class="cloudMap">

    </div>
  </div>
</template>

<script>
  var COLORS = ["#ddf59a", "#8b6cf5", "#a4ffc1", "#cfb6ff", "#6ba3ff", "#00daff"];

export default {
  name: 'index2',
  data () {
    return {
      map:{},
  }
  },
  mounted() {
    this.init()
  },
  methods:{
    init (){
      this.map = new AMap.Map(this.$refs.cloudMap, {
        center: [114.291362,30.566915],
        zoom: 10,
        resizeEnable: true,
        keyboardEnable: true,//地图是否可通过键盘控制
        dragEnable: true,//地图是否可通过鼠标拖拽平移
        showLabel: true ,//是否显示地图文字标记
        mapStyle: 'amap://styles/whitesmoke' //地图样式
      });
      var self=this;
      setTimeout(function () {
        self.showGrid();
      },1000)
      this.showAreaBounds();
    },
    getCurrentBounds() {
       var bs = this.map.getBounds();        //获取当前地图范围的经纬度
       var bssw = bs.getSouthWest();		//获取西南角的经纬度(左下端点)
       var bsne = bs.getNorthEast();		//获取东北角的经纬度(右上端点)
       return { 'x1': bssw.lng, 'y1': bssw.lat, 'x2': bsne.lng, 'y2': bsne.lat };
    },
    showGrid(){
      var self=this;
      var XY = this.getCurrentBounds();
      console.log(XY);
      var infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(30, 30)});
      function infoClose(e) {
        infoWindow.close(self.map, e.target.getPosition());
      }
      function infoOpen(e) {
        infoWindow.setContent(e.target.content);
        infoWindow.open(self.map,e.target.getPath()[0]);
      }

      for (var i = XY.x1; i < XY.x2; i = i + 0.5) {
        for (var j = XY.y2; j > XY.y1; j = j - 0.5) {
             var num=Math.floor(Math.random()*6);
          //此类表示绘制一个多边形覆盖物（注意:一定要下面的Point列表为多变形的顶点,描线顺序为从上到下,从左到右，顺序乱了,绘制出来的多边形也会乱，如图二所示，图二是将顶点的顺序给错了（网格左上端点,网格///左下端点，网格右上端点，网格右下端点））
             var polygon = new AMap.Polygon({
               path: [[i, j],[i, j-0.5],[i+0.5, j-0.5],[i+0.5, j]],
               strokeColor:"#ccc",
               strokeWeight:1,
               strokeOpacity:0.2,
               fillColor: COLORS[num],
               fillOpacity: 0.07*num,
             });
            polygon.content =
            '<div className="custom-infowindow input-card">' +
            '<label style="color:grey">网格数据</label>' +
            '<div class="input-item">' +
            '<div class="input-item-prepend">' +
            '<span class="input-item-text" >'+i+','+j+'</span>' +
            '</div>' +
              '<div class="input-item-prepend">' +
              '<span class="input-item-text" >邮箱：</span>' +
              '</div>' +
            '<input id="email" type="mail"/>' +
            '</div>' +
            '<input id="downloadBtn" type="button" class="btn" value="下载网格数据" onclick="function f() { console.log(1); }"/>' +
            '</div>';
             polygon.on("click",infoOpen);

             polygon.on('mouseover', infoOpen);
             polygon.setMap(self.map);
        }
      }
    },
    showAreaBounds(){
      var self=this;
      /*绘制小地图的各个省份的分界线*/
      AMapUI.loadUI(['geo/DistrictExplorer'], function(DistrictExplorer) {
        //创建一个实例
        var districtExplorer = new DistrictExplorer({
          map: self.map
        });
        var adcode = 420000;
        districtExplorer.loadAreaNode(adcode, function(error, areaNode) {
          //清除已有的绘制内容
          districtExplorer.clearFeaturePolygons();
          //绘制子区域
          districtExplorer.renderSubFeatures(areaNode, function(feature, i) {
            return {
              bubble: true,
              strokeColor: "#B5B5B5", //线颜色
              strokeOpacity: 1, //线透明度
              strokeWeight: 1, //线宽
              fillColor: "#EEEEEE", //填充色
              fillOpacity: 0.35, //填充透明度
            };
          });
        });
      });
    }

  }
}
</script>

<style scoped>
.cloudMap{
  width:100%;
  height: 1080px;
}
</style>
