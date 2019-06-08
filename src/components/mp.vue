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
    name: 'mp',
    data () {
      return {
        map:{},
        selectGrids:[],
        selectPloygons:[],
        fankui:'11111',
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
        // this.map = new AMap.Map(this.$refs.cloudMap, {
        //   center: [114.291362,30.566915],
        //   zoom: 8,
        //   resizeEnable: true,
        //   keyboardEnable: true,//地图是否可通过键盘控制
        //   dragEnable: true,//地图是否可通过鼠标拖拽平移
        //   showLabel: true ,//是否显示地图文字标记
        //   mapStyle: 'amap://styles/whitesmoke' //地图样式
        // });

        this.map = new BMap.Map(this.$refs.cloudMap);    // 创建Map实例
        this.map.centerAndZoom(new BMap.Point(114.291362,30.566915), 11);  // 初始化地图,设置中心点坐标和地图级别
        this.map.setCurrentCity("武汉");
        this.map.enableScrollWheelZoom(true);

        var self=this;
        setTimeout(function () {
          self.showGrid();
        },1000)
       // this.showAreaBounds();
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

        function changeSelectGrid(e) {


        }

        for (var i = XY.x1; i < XY.x2; i = i + 0.05) {
          for (var j = XY.y2; j > XY.y1; j = j - 0.05) {
            var num=Math.floor(Math.random()*6);
            //此类表示绘制一个多边形覆盖物（注意:一定要下面的Point列表为多变形的顶点,描线顺序为从上到下,从左到右，顺序乱了,绘制出来的多边形也会乱，如图二所示，图二是将顶点的顺序给错了（网格左上端点,网格///左下端点，网格右上端点，网格右下端点））
            var polygon = new BMap.Polygon([
              new BMap.Point(i, j),    //网格左上端点
              new BMap.Point(i, j-0.05),  //网格左下端点
              new BMap.Point(i+0.05, j-0.05),	 //网格右下端点
              new BMap.Point(i+0.05, j)			//网格右上端点
            ], {strokeColor:"#ccc", strokeWeight:1, strokeOpacity:0.2,fillColor: COLORS[num], fillOpacity: 0.07*num});
            polygon .addEventListener("click",changeSelectGrid);
            this.map.addOverlay(polygon);
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
        // this.currentzoom=this.map.getZoom()
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
