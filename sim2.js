const fs = require('fs');
const csv=require('csvtojson');

let cash = 1000.00
let sp_shares = 0;
let nav;
let oldestDate = new Date();
let yields = {};

csv()
.fromFile('./sp_div_rate.csv')
.then((rawyield)=>{
  for(const entry of rawyield){
    let date_str = entry.Date;
    let percent = parseFloat(entry.Value.replace(/%/g, ''));
    date = new Date(date_str);
    // the data includes yield at the end of the month
    date.setDate(date.getDate() + 1);
    yields[date] = percent;
  }
})
.then(() => {
  return csv()
  .fromFile('./sp_monthly.csv');
})
.then((rawlist)=>{
  listing = [];
  for(const entry of rawlist){
    let date_str = entry.Date;
    let date = new Date(date_str);
    if(date < oldestDate){
      oldestDate = date;
    }
    let yield = yields[date];
    let price_str = entry.Value;
    let price = parseFloat(price_str.replace(/,/g, ''));
    listing.push({date, price, yield});
  }
  return listing.sort((a,b) => {
    return new Date(a.date) - new Date(b.date)
  })
})
.then((sorted) => {
  let performance = [];
  for(const entry of sorted){
    let sp_value = (sp_shares * entry.price); 
    // TODO record annual dividend for taxable accounts
    if(entry.yield) {
      let dividend = 0;
      dividend = ((sp_value * entry.yield) / 1200);
      cash = cash + dividend;
    }
 
    if(entry.price < cash){
      let shares = Math.floor(cash / entry.price);
      sp_shares += shares;
      cash = cash - (shares * entry.price);
//      console.log('Purchase S&P %s, %i', entry.date.toISOString(), shares);
    }

    sp_value = (sp_shares * entry.price); 
    nav = cash + sp_value;
    performance.push([entry.date.toDateString(), nav])
    //console.log('%s ---> %i', entry.date.toString(), nav);
    //console.log('%s -> %f', entry.date.toString(), entry.price);
  }
  console.log("S&P shares: " + sp_shares);
  console.log("cash: " + cash.toFixed(2));
  console.log("Final nav: " + nav.toFixed(2));
  fs.writeFileSync('./perf.json', JSON.stringify(performance, null, 2));
});

