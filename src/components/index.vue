<template>
  <div>
    <Row>
      <Col span="20">
        <div ref="cloudMap" class="cloudMap"></div>
      </Col>
      <Col span="2">
        <div style="margin-left: 5px;width: 100%">
          <Card :dis-hover="true" style="width:240px">
            <p slot="title">当前选中网格</p>
            <div style="width:240px"><p>网格编号：{{getIds()}}</p></div>
            <p>网格信息：</p>
          </Card>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="attr" placeholder="选择属性" style="width:240px">
            <Option v-for="item in attrs" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="province" @on-change="choseProvince" placeholder="选择省" style="width:240px">
            <Option v-for="item in provinceList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="city" @on-change="choseCity" placeholder="选择市" style="width:240px">
            <Option v-for="item in cityList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="area" @on-change="choseArea" placeholder="选择区" style="width:240px">
            <Option v-for="item in areaList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Input placeholder="请输入邮箱" style="width: 240px"><Icon type="ios-mail" slot="prefix" /></Input>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Button type="success" style="width: 240px">下载选中网格数据</Button>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 30px;">
          <Input v-model="fankui" type="textarea" :rows="4" placeholder="填写反馈信息" style="width: 240px" />
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Button type="success" style="width: 240px">提交反馈信息</Button>
        </div>
      </Col>
    </Row>


  </div>
</template>

<script>

  import axios from 'axios'

  var COLORS = ["#ddf59a", "#8b6cf5", "#a4ffc1", "#cfb6ff", "#6ba3ff", "#00daff"];


export default {
  name: 'index2',
  data () {
    return {
      map:{},
      selectGrids:[],
      selectPloygons:[],
      fankui:'',
      mapJson:'../static/map.json',
      provinceList:[],
      cityList:[],
      areaList:[],
      province:'',
      city:'',
      area:'',
      attr:'',
      attrs:[{"label":"属性1","value":"1"},{"label":"属性2","value":"2"},{"label":"属性3","value":"3"}],
      prezoom:8,
      currentzoom:8,
    }
  },
  mounted() {
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("Firefox") > -1) {
      window.addEventListener("DOMMouseScroll",this.handleScroll,false)
    }else{
      window.addEventListener('mousewheel',this.handleScroll,false)
    }
    this.init();
    this.initCityData();
  },
  methods:{
    init (){
      this.map = new AMap.Map(this.$refs.cloudMap, {
        center: [114.291362,30.566915],
        zoom: 8,
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
      var infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, 0)});
      function infoClose(e) {
        infoWindow.close(self.map, e.target.getPosition());
      }
      function infoOpen(e) {
        infoWindow.setContent(e.target.content);
        infoWindow.open(self.map,e.target.getPath()[0]);
      }
      function changeSelectGrid(e) {
        if (event.shiftKey !=1){
          //判断没有按下shift键则清除之前选中的网格
          for(var i=0;i<self.selectPloygons.length;i++){
            self.map.remove(self.selectPloygons[i])
          }
          self.selectPloygons=[]
        }
        var ploygon=new AMap.Polygon({
          path: e.target.getPath(),
          strokeColor:"#ff1b0e",
          strokeWeight:1,
          strokeOpacity:1,
          fillColor: "#fffc00",
          fillOpacity: 0.7,
        });
        ploygon.setMap(self.map);

        self.selectPloygons.push(ploygon);
        console.log(e)
        var grid={id:e.target._amap_id}
        self.selectGrids.push(grid)

      }

      for (var i = XY.x1; i < XY.x2; i = i + 0.3) {
        for (var j = XY.y2; j > XY.y1; j = j - 0.3) {
             var num=Math.floor(Math.random()*6);
          //此类表示绘制一个多边形覆盖物（注意:一定要下面的Point列表为多变形的顶点,描线顺序为从上到下,从左到右，顺序乱了,绘制出来的多边形也会乱，如图二所示，图二是将顶点的顺序给错了（网格左上端点,网格///左下端点，网格右上端点，网格右下端点））
             var polygon = new AMap.Polygon({
               path: [[i, j],[i, j-0.3],[i+0.3, j-0.3],[i+0.3, j]],
               strokeColor:"#ccc",
               strokeWeight:1,
               strokeOpacity:0.2,
               fillColor: COLORS[num],
               fillOpacity: 0.07*num,
             });
            polygon.content =
            '<div className="custom-infowindow input-card">' +
              '<label style="color:grey">网格数据</label>' +
            '<div>' +
            '<div>' +
               '<span class="input-item-text" >'+i+','+j+'</span>' +
            '</div>' +
            '</div>' +
            '<div>' +
              '<span class="input-item-text" >邮箱：</span>' +
              '<input id="m_email" type="mail"/>' +
            '</div>' +
            '<input id="downloadBtn" type="button" class="btn" style="margin-left: 25%;margin-top: 8px;" value="下载网格数据" onclick="downloadData()"/>' +
            '</div>';
             //polygon.on("click",infoOpen);
             polygon.on("click",changeSelectGrid);
             //polygon.on('mouseover', infoOpen);
             polygon.setMap(self.map);
        }
      }
    },
    clearGrid(){

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
    },
    getIds(){
      let ids='';
      console.log(this.selectGrids)
      for(var i=0;i<this.selectGrids.length;i++){
        if (i==0) {
          ids=ids+this.selectGrids[i].id
        }else if (i/4==0) {
          ids=ids+'<br>'
        }else{
          ids=ids+','+this.selectGrids[i].id
        }
      }
      return ids;
    },
    handleScroll(){
      console.log(this.map.getZoom())
      this.currentzoom=this.map.getZoom()
    },
    updated:function(){
      this.$nextTick(function(){
        if(this.currentzoom != this.prezoom){

        }
      })
    },
    //省市区三级加载
    initCityData:function(){
      axios.get(this.mapJson).then((data) => {
        console.log(data.data);
        this.provinceList = data.data
      })
    },
    // 选省
    choseProvince:function(e) {
      for (var i = 0; i < this.provinceList.length;i++) {
        if (e === this.provinceList[i].value) {
          this.cityList=this.provinceList[i].children
          this.areaList=[]
          this.area=''
          break;
        }
      }

    },
    // 选市
    choseCity:function(e) {
      for (var i = 0; i < this.cityList.length;i++) {
        if (e === this.cityList[i].value) {
          this.areaList = this.cityList[i].children
          break;
        }
      }
    },
    // 选区
    choseArea:function(e) {
      console.log(e)
    },

  }
}
</script>

<style scoped>
.cloudMap{
  width:100%;
  height: 1080px;
}
</style>
