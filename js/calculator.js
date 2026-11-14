 (() => {
  const $ = id => document.getElementById(id);
  const num = id => Math.max(0, Number($(id).value) || 0);
  const ceil = Math.ceil;
  const money = value => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
  const money2 = value => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value);
  const state = { mode:"benchmark", years:5, purchase:"ondemand", result:null };

  function setVal(id,v){ $(id).value=v; }
  function applyMode(mode){
    state.mode=mode;
    if(mode==="benchmark"){
      const values={vcpu:4000,memoryRatio:4,storageTb:10000,egressTb:200,utilization:70};
      Object.entries(values).forEach(([k,v])=>setVal(k,v));
      $("scenarioLabel").textContent="37signals benchmark";
    } else $("scenarioLabel").textContent="Custom workload";
    document.querySelectorAll("#workloadMode button").forEach(b=>b.classList.toggle("selected",b.dataset.mode===mode));
    calculate();
  }
  function awsStorageMonthly(tb){
    const gb=tb*1000;
    const a=Math.min(gb,50000)*PRICING_DATA.aws.s3.first50TB;
    const b=Math.min(Math.max(gb-50000,0),450000)*PRICING_DATA.aws.s3.next450TB;
    const c=Math.max(gb-500000,0)*PRICING_DATA.aws.s3.remainder;
    return a+b+c;
  }
  function calcCloud(){
    const d=PRICING_DATA, vcpu=num("vcpu"), util=Math.max(num("utilization")/100,.01);
    const storage=num("storageTb"), egress=num("egressTb"), hours=d.hoursPerMonth;
    const purchase=state.purchase;
    const awsDisc=purchase==="ondemand"?0:d.aws.commitmentDiscount[purchase];
    const gcpRate=purchase==="1y"?d.gcp.hourly1y:purchase==="3y"?d.gcp.hourly3y:d.gcp.hourlyOnDemand;
    const awsCount=ceil(vcpu/(d.aws.vcpu*util));
    const gcpCount=ceil(vcpu/(d.gcp.vcpu*util));
    const awsCompute=awsCount*d.aws.hourlyOnDemand*hours*(1-awsDisc);
    const gcpCompute=gcpCount*gcpRate*hours;
    const awsStorage=awsStorageMonthly(storage);
    const gcpStorage=storage*1000*1.073741824*d.gcp.storagePerGiBMonth;
    // Egress model: first 100 GB/month free, then illustrative $0.09/GB.
    const egressGB=Math.max(0,egress*1000-100);
    const awsEgress=egressGB*.09, gcpEgress=egressGB*.12;
    const db=num("dbMonthly"), lb=num("lbMonthly"), backupPct=.05;
    const aws={compute:awsCompute,database:db,storage:awsStorage,egress:awsEgress,loadBalancer:lb,backup:(awsStorage+db)*backupPct};
    const gcp={compute:gcpCompute,database:db*1.03,storage:gcpStorage,egress:gcpEgress,loadBalancer:lb*1.02,backup:(gcpStorage+db)*backupPct};
    return {aws,gcp,awsCount,gcpCount,awsTotal:Object.values(aws).reduce((a,b)=>a+b,0),gcpTotal:Object.values(gcp).reduce((a,b)=>a+b,0),awsStorage,gcpStorage};
  }
  function calcOnprem(){
    const vcpu=num("vcpu"), util=Math.max(num("utilization")/100,.01), perServer=Math.max(1,num("serverVcpu"));
    const required=ceil(vcpu/(perServer*util));
    const servers=ceil(required*num("redundancyFactor")*(1+num("sparePct")/100));
    const serverCapex=servers*num("serverPrice");
    const storageCapex=num("storageTb")*num("storageCostTb");
    const networkCapex=num("networkCapex");
    const setup=serverCapex+storageCapex+networkCapex;
    const powerMonthly=num("itKw")*num("pue")*730*num("electricity");
    const coloMonthly=num("rackCount")*num("rackMonthly");
    const staffMonthly=num("engineers")*num("salary")/12;
    const supportMonthly=(serverCapex+storageCapex)*num("supportPct")/100/12;
    const networkMonthly=num("networkMonthly");
    const opex={power:powerMonthly,colocation:coloMonthly,staff:staffMonthly,support:supportMonthly,network:networkMonthly};
    return {servers,serverCapex,storageCapex,networkCapex,setup,opex,monthlyOpex:Object.values(opex).reduce((a,b)=>a+b,0),powerMonthly};
  }
  function trajectory(cloudMonthly,onprem,years){
    const months=years*12, labels=[],aws=[],gcp=[],prem=[];
    let a=0,g=0,p=onprem.setup;
    const life=num("hardwareLife");
    for(let m=0;m<=months;m++){
      labels.push(m===0?"Start":m%12===0?`Year ${m/12}`:`M${m}`);
      if(m>0){
        a+=cloudMonthly.awsTotal; g+=cloudMonthly.gcpTotal; p+=onprem.monthlyOpex;
        if(m>1 && (m-1)%(life*12)===0) p+=onprem.setup; // replace full fleet at end of life
      }
      aws.push(a);gcp.push(g);prem.push(p);
    }
    return {labels,aws,gcp,prem};
  }
  function calculate(){
    const cloud=calcCloud(), prem=calcOnprem(), years=state.years;
    const curve=trajectory(cloud,prem,years);
    const beAws=curve.prem.findIndex((v,i)=>i>0&&v<=curve.aws[i]);
    const beGcp=curve.prem.findIndex((v,i)=>i>0&&v<=curve.gcp[i]);
    const bestCloud=cloud.awsTotal<=cloud.gcpTotal?"AWS":"Google Cloud";
    const cloudBest=bestCloud==="AWS"?curve.aws:curve.gcp;
    const beBest=curve.prem.findIndex((v,i)=>i>0&&v<=cloudBest[i]);
    const tco={aws:curve.aws[curve.aws.length-1],gcp:curve.gcp[curve.gcp.length-1],prem:curve.prem[curve.prem.length-1]};
    state.result={cloud,prem,curve,years,tco,beAws,beGcp,beBest,bestCloud};
    render(state.result);
    return state.result;
  }
  function row(label,a,g,basis){return `<tr><td>${label}</td><td>${money(a)}</td><td>${money(g)}</td><td>${basis}</td></tr>`;}
  function breakdown(el,items){$(el).innerHTML=items.map(([k,v])=>`<div class="breakdown-row"><span>${k}</span><b>${money(v)}</b></div>`).join("");}
  function render(r){
    const {cloud,prem,curve,tco,years}=r;
    $("kpiAws").textContent=money(cloud.awsTotal);$("kpiGcp").textContent=money(cloud.gcpTotal);
    $("kpiCapex").textContent=money(prem.setup);$("kpiOpex").textContent=money(prem.monthlyOpex);
    $("kpiAwsSub").textContent=`${r.cloud.awsCount.toLocaleString()} × ${PRICING_DATA.aws.instance} compute instances`;
    $("kpiGcpSub").textContent=`${r.cloud.gcpCount.toLocaleString()} × ${PRICING_DATA.gcp.machine} compute instances`;
    $("cloudTable").innerHTML=
      row("Compute",cloud.aws.compute,cloud.gcp.compute,`${PRICING_DATA.aws.instance} / ${PRICING_DATA.gcp.machine}`)+
      row("Managed database",cloud.aws.database,cloud.gcp.database,"Editable service allowance")+
      row("Object storage",cloud.aws.storage,cloud.gcp.storage,"Tiered / regional Standard estimate")+
      row("Internet egress",cloud.aws.egress,cloud.gcp.egress,"Illustrative blended rate")+
      row("Load balancing",cloud.aws.loadBalancer,cloud.gcp.loadBalancer,"Editable service allowance")+
      row("Backup allowance",cloud.aws.backup,cloud.gcp.backup,"5% planning allowance");
    $("cloudTotals").innerHTML=`<tr><td>Estimated monthly total</td><td>${money(cloud.awsTotal)}</td><td>${money(cloud.gcpTotal)}</td><td>Before taxes / support</td></tr>`;
    $("capexBreakdown").textContent=money(prem.setup);
    breakdown("capexList",[["Compute servers",prem.serverCapex],["Storage hardware",prem.storageCapex],["Network & setup",prem.networkCapex]]);
    $("annualOpex").textContent=money(prem.monthlyOpex*12);
    breakdown("opexList",[["Power & facility energy",prem.opex.power*12],["Colocation racks",prem.opex.colocation*12],["Additional staff",prem.opex.staff*12],["Hardware support",prem.opex.support*12],["Network / transit",prem.opex.network*12]]);
    const be=r.beBest;
    $("breakEvenValue").textContent=be<0?"Not reached":`Month ${be}`;
    $("breakEvenCaption").textContent=be<0?`On-premises does not beat ${r.bestCloud} within ${years} years`:`On-premises becomes cheaper than ${r.bestCloud} in month ${be} (${(be/12).toFixed(1)} years)`;
    breakdown("breakEvenDetails",[["AWS break-even",r.beAws<0?"Not reached":`Month ${r.beAws}`],["GCP break-even",r.beGcp<0?"Not reached":`Month ${r.beGcp}`],[`${years}-year on-prem TCO`,tco.prem],[`${years}-year lowest cloud TCO`,Math.min(tco.aws,tco.gcp)]]);
    $("bestOption").textContent=`Lowest modeled ${years}-year TCO: ${Object.entries(tco).sort((a,b)=>a[1]-b[1])[0][0].toUpperCase()} · ${money(Math.min(...Object.values(tco)))}`;
    if(window.updateCharts) window.updateCharts(r);
  }
  function sources(){
    $("sourceList").innerHTML=PRICING_DATA.references.map(s=>`<div class="source-item"><b>${s.name}</b><span>${s.kind}<br><a href="${s.url}" target="_blank" rel="noopener">Open source ↗</a></span></div>`).join("");
  }
  function bind(){
    document.querySelectorAll("#workloadMode button").forEach(b=>b.addEventListener("click",()=>applyMode(b.dataset.mode)));
    document.querySelectorAll("#horizonControl button").forEach(b=>b.addEventListener("click",()=>{state.years=Number(b.dataset.years);setVal("years",state.years);document.querySelectorAll("#horizonControl button").forEach(x=>x.classList.toggle("selected",x===b));calculate();}));
    $("years").addEventListener("change",e=>{state.years=Number(e.target.value);document.querySelectorAll("#horizonControl button").forEach(x=>x.classList.toggle("selected",Number(x.dataset.years)===state.years));calculate();});
    $("purchaseModel").addEventListener("change",e=>{state.purchase=e.target.value;calculate();});
    $("utilization").addEventListener("input",e=>{$("utilizationOut").value=e.target.value+"%";calculate();});
    document.querySelectorAll("input,select").forEach(el=>{if(!["utilization","years","purchaseModel"].includes(el.id))el.addEventListener("change",calculate);});
    $("recalculate").addEventListener("click",calculate);
    $("resetInputs").addEventListener("click",()=>{applyMode("benchmark");state.years=5;state.purchase="ondemand";setVal("years",5);setVal("purchaseModel","ondemand");});
    $("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
    document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>{$("sidebar").classList.remove("open");document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x===a));}));
    $("exportCsv").addEventListener("click",exportCsv);
  }
  function exportCsv(){
    const r=state.result;if(!r)return;
    const lines=[["CloudCostIQ cost estimate",`Snapshot ${PRICING_DATA.snapshotDate}`],["Metric","AWS","Google Cloud","On-premises"],["Monthly cost",r.cloud.awsTotal,r.cloud.gcpTotal,r.prem.monthlyOpex],["Initial CapEx",0,0,r.prem.setup],[`${r.years}-year TCO`,r.tco.aws,r.tco.gcp,r.tco.prem],["AWS compute instances",r.cloud.awsCount],["GCP compute instances",r.cloud.gcpCount],["On-prem servers",r.prem.servers],["Currency","USD"]];
    const csv=lines.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="cloudcostiq-estimate.csv";a.click();URL.revokeObjectURL(url);
  }
  window.CloudCostIQ={calculate,state};
  document.addEventListener("DOMContentLoaded",()=>{sources();bind();calculate();});
})();