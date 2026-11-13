(() => {
    let trajectory,composition,tco,sensitivity;
    const fmt=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(v);
    const base={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:"#8794a6",font:{size:9},maxTicksLimit:9}},y:{grid:{color:"#edf0f4"},ticks:{color:"#8794a6",font:{size:9},callback:fmt}}}};
    function updateCharts(r){
      const ctx=id=>document.getElementById(id).getContext("2d");
      const years=r.years;
      if(trajectory)trajectory.destroy();
      trajectory=new Chart(ctx("trajectoryChart"),{type:"line",data:{labels:r.curve.labels,datasets:[
        {label:"AWS",data:r.curve.aws,borderColor:"#e89a42",backgroundColor:"#e89a4212",borderWidth:2.5,pointRadius:0,tension:.2,fill:false},
        {label:"Google Cloud",data:r.curve.gcp,borderColor:"#4388d8",borderWidth:2.5,pointRadius:0,tension:.2,fill:false},
        {label:"On-premises",data:r.curve.prem,borderColor:"#159b78",borderWidth:2.5,pointRadius:0,tension:.2,fill:false}
      ]},options:{...base,interaction:{mode:"index",intersect:false}}});
      if(composition)composition.destroy();
      const labels=["Compute","Database","Storage","Egress","Load balancer","Backup"];
      composition=new Chart(ctx("compositionChart"),{type:"doughnut",data:{labels,datasets:[{data:Object.values(r.cloud.aws),backgroundColor:["#e89a42","#7188a8","#4388d8","#8d79c6","#45a995","#c3cedb"],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{position:"bottom",labels:{boxWidth:8,usePointStyle:true,pointStyle:"circle",font:{size:9},color:"#718096"}},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.raw)}`}}}}});
      if(tco)tco.destroy();
      tco=new Chart(ctx("tcoChart"),{type:"bar",data:{labels:["AWS","Google Cloud","On-premises"],datasets:[{data:[r.tco.aws,r.tco.gcp,r.tco.prem],backgroundColor:["#e89a42","#4388d8","#159b78"],borderRadius:5,barThickness:35}]},options:{...base,indexAxis:"y",scales:{x:{grid:{color:"#edf0f4"},ticks:{color:"#8794a6",font:{size:9},callback:fmt}},y:{grid:{display:false},ticks:{color:"#52627a",font:{size:10}}}}}});
      if(sensitivity)sensitivity.destroy();
      const basePrem=r.tco.prem, baseCloud=Math.min(r.tco.aws,r.tco.gcp);
      const sens=[["Server price",Math.abs(basePrem-(basePrem-r.prem.serverCapex*.2))],["Electricity",Math.abs(r.prem.opex.power*12*years*.2)],["Staffing",Math.abs(r.prem.opex.staff*12*years*.2)],["Storage price",Math.abs(r.prem.storageCapex*.2)],["Colocation",Math.abs(r.prem.opex.colocation*12*years*.2)],["Cloud compute",Math.abs(Math.min(r.tco.aws*.2,r.tco.gcp*.2))]].sort((a,b)=>b[1]-a[1]);
      sensitivity=new Chart(ctx("sensitivityChart"),{type:"bar",data:{labels:sens.map(x=>x[0]),datasets:[{label:"Approx. TCO impact (±20%)",data:sens.map(x=>x[1]),backgroundColor:"#7b98d4",borderRadius:4,barThickness:13}]},options:{...base,indexAxis:"y",scales:{x:{grid:{color:"#edf0f4"},ticks:{color:"#8794a6",font:{size:8},callback:fmt}},y:{grid:{display:false},ticks:{color:"#52627a",font:{size:9}}}}}});
    }
    window.updateCharts=updateCharts;
  })();