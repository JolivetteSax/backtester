//const util = require('util');
const fs = require('fs');
//const filePath=process.argv[3];

let cash = 1000.00
let sp_shares = 0;
let nav;
let oldestDate = new Date();

const csv=require('csvtojson');
csv()
.fromFile('./sp_monthly.csv')
.then((rawlist)=>{
  listing = [];
  for(const entry of rawlist){
    let date_str = entry.Date;
    let date = new Date(date_str);
    if(date < oldestDate){
      oldestDate = date;
    }
    let price_str = entry.Value;
    let price = parseFloat(price_str.replace(/,/g, ''));
    listing.push({date, price});
  }
  return listing.sort((a,b) => {
    return new Date(a.date) - new Date(b.date)
  })
})
.then((sorted) => {
  let performance = [];
  for(const entry of sorted){
    if(entry.price < cash){
      let shares = Math.floor(cash / entry.price);
      sp_shares += shares;
      cash = cash - (shares * entry.price);
      console.log('Purchase S&P %s, %i', entry.date.toISOString(), shares);
    }
    nav = cash + (sp_shares * entry.price);
    performance.push([entry.date.toDateString(), nav])
    //console.log('%s ---> %i', entry.date.toString(), nav);
    //console.log('%s -> %f', entry.date.toString(), entry.price);
  }
  console.log("S&P shares: " + sp_shares);
  console.log("cash: " + cash.toFixed(2));
  console.log("Final nav: " + nav);
  fs.writeFileSync('./perf.json', JSON.stringify(performance, null, 2));
});

