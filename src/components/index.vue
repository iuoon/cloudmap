<template>
  <div>
    <Row>
      <Col span="20">
        <div ref="cloudMap" class="cloudMap"></div>
        <div class="input-card">
          <div>
            年份：<Select v-model="year" placeholder="选择年份" style="width:6rem" @on-change="choseYear">
              <Option v-for="item in yearList" :value="item" :key="item">{{ item }}</Option>
            </Select>
            属性：<Select v-model="attr" placeholder="选择属性" style="width:6rem" @on-change="choseAttr">
              <Option v-for="item in attrs" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </div>
        </div>

        <div class="input-card2">
          <div id="histogram">

          </div>
        </div>
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
  import echarts from 'echarts'

  var COLORS = ["#00F61F","#72F657","#B4F67C","#EEF68F","#F6CC84","#F69D6B","#F65D42","#F6231E"];


export default {
  name: 'index',
  data () {
    return {
      map:{},
      eChart:{},
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
      attr:"Water",//当前网格属性
      attrs:[{"label":"Water","value":"Water"},{"label":"SVC","value":"SVC"},{"label":"Aviation","value":"Aviation"}], //选择网格属性
      overlays:[], //选择框
      prezoom:8, //前缩放级别
      currentzoom:8,//当前缩放级别
      year:2007,  //年份
      yearList:[2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019],
      point:"87.77962526630337,33.53587510891327",
      ploygons:[],
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
    this.initHistogram();
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
        mapStyle: 'amap://styles/whitesmoke', //地图样式
        layers: [
          // 卫星
          new AMap.TileLayer.Satellite(),
          // 路网
          new AMap.TileLayer.RoadNet({opacity:0.3})
        ],
      });
      var self=this;
      setTimeout(function () {
        self.initGrid();
      },1000)
      this.showAreaBounds();
    },
    getCurrentBounds() {
       var bs = this.map.getBounds();        //获取当前地图范围的经纬度
       var bssw = bs.getSouthWest();		//获取西南角的经纬度(左下端点)
       var bsne = bs.getNorthEast();		//获取东北角的经纬度(右上端点)
       return { 'x1': bssw.lng, 'y1': bssw.lat, 'x2': bsne.lng, 'y2': bsne.lat };
    },
    initGrid(){
      var self=this;
      axios.get("http://localhost:8082/shape/getData/"+self.year+"?point="+self.point).then((res) => {
        let  list= res.data.data
        for(var i = 0,len=list.length; i < len; i++) {
          var patharr=list[i].the_geom;
          var num=(this.getAtrrValue(list[i])*10)%8
          var polygon = new AMap.Polygon({
            path: patharr,
            strokeColor:"#0f0f0f",
            strokeWeight:1,
            strokeOpacity:0.2,
            fillColor: COLORS[num],
            fillOpacity: 0.7,
          });
          polygon.setMap(self.map);
          polygon.Water=list[i].Water;
          polygon.SVC=list[i].SVC;
          polygon.Aviation=list[i].Aviation;
          self.ploygons.push(polygon);
        }
      })
    },
    //初始化直方图
    initHistogram(){
      this.eChart= echarts.init(document.getElementById('histogram'));
      var option = {
        color: ['#3398DB'],
        tooltip : {
          trigger: 'axis',
          axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis : [
          {
            type : 'category',
            data : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisTick: {
              alignWithLabel: true
            }
          }
        ],
        yAxis : [
          {
            type : 'value'
          }
        ],
        series : [
          {
            name:'值',
            type:'bar',
            barWidth: '60%',
            data:[10, 52, 200, 334, 390, 330, 220]
          }
        ]
      };
      if (option && typeof option === "object") {
        this.eChart.setOption(option, true);
      }
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
        if (event.shiftKey !=1) {
          //判断没有按下shift键则清除之前选中的网格
          //for(var i=0;i<self.selectPloygons.length;i++){
          self.map.remove(self.selectPloygons)
          //}
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



      var polygon_t = new AMap.Polygon({
        path: [[115.79011490197605,44.89508474224183],[115.91679790903335,44.88538600295825],[115.90297162495256,44.79638930050085],[115.77643316632485,44.80610526526714]],
        strokeColor:"#ccc",
        strokeWeight:1,
        strokeOpacity:0.2,
        fillColor: "#cc0019",
        fillOpacity: 1,
      });
      polygon_t.setMap(self.map);

      var mouseTool = new AMap.MouseTool(self.map);
      mouseTool.rectangle({
        fillColor:'#00b0ff',
        strokeColor:'#80d8ff'
        //同Polygon的Option设置
      });
      mouseTool.on('draw',function(e){
        //绘制矩形框结束时触发该事件, //计算哪些框在矩形内
        //先清除之前选择的，然后重新计算
        var drawobj=e.obj
        console.log(222)
        // for(var i=0;i<self.selectPloygons.length;i++){
        //   self.map.remove(self.selectPloygons[i])
        // }
        self.map.remove(drawobj)
      })
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
    getAtrrValue(obj){
      if(this.attr=='Water'){
        return obj.Water
      }
      if(this.attr=='SVC'){
        return obj.SVC
      }
      if(this.attr=='Aviation'){
        return obj.Aviation
      }
    },
    handleScroll(){
      var self=this;
      let center=this.map.getCenter()
      console.log(this.map.getZoom())
      this.prezoom=this.currentzoom
      this.currentzoom=this.map.getZoom()
      this.point=center.lng+","+center.lat
      this.$nextTick(function(){
        //缩放级别改变的时候，清除之前的网格覆盖，对网格聚合重建
        if(this.currentzoom != this.prezoom){
          self.map.clearMap()
          self.ploygons=[];
          setTimeout(function () {
            self.initGrid();
          },200)
        }
      })
    },
    updated(){
      var self=this;
      console.log(this.currentzoom,this.prezoom)
      this.$nextTick(function(){
        //缩放级别改变的时候，清除之前的网格覆盖，对网格聚合重建
        if(this.currentzoom != this.prezoom){
           self.map.clearMap()
           self.ploygons=[];
           setTimeout(function () {
            self.initGrid();
          },200)
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
    // 选年
    choseYear:function(e){
       console.log(e)
       var self=this;
       this.map.clearMap();
       this.ploygons=[];
       this.year=e
       setTimeout(function () {
        self.initGrid();
       },200)
    },
    // 选属性
    choseAttr:function(e){
      console.log(e)
      this.attr=e
      for(var i=0;i<this.ploygons.length;i++){
        var num=this.getAtrrValue(this.ploygons[i])*10%8
        var color=COLORS[num]
        this.ploygons[i].fillColor=color
      }
    }
  }
}
</script>

<style scoped>
.cloudMap{
  width:100%;
  height: 1080px;
}
.input-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border-radius: .25rem;
    width: 22rem;
    border-width: 0;
    border-radius: 0.4rem;
    box-shadow: 0 2px 6px 0 rgba(114, 124, 245, .5);
    position: fixed;
    top: 1rem;
    left: 1rem;
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    padding: 0.75rem 1.25rem;
}
.input-card2 {
  display: flex;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border-radius: .25rem;
  width: 22rem;
  border-width: 0;
  border-radius: 0.4rem;
  box-shadow: 0 2px 6px 0 rgba(114, 124, 245, .5);
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  padding: 0.75rem 1.25rem;
}
</style>
