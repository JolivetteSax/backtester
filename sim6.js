const fs = require('fs');
const csv=require('csvtojson');
const bondCalculator = require('bond-calculator');

let cash = 1000.00
let sp_shares = 0;
let total_expenses = 0;
let nav;
let oldestDate = new Date();
let yields = {};
let treas_yields = {};


csv()
.fromFile('./treas_rate.csv')
.then((rawyield)=>{
  for(const entry of rawyield){
    let date_str = entry.Date;
    let percent = parseFloat(entry.Value.replace(/%/g, ''));
    date = new Date(date_str);
    treas_yields[date] = percent;
  }
})
.then(() => {
  return csv()
  .fromFile('./sp_div_rate.csv');
})
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
  let monthly = [];
  let treasuries = [];
 
  for(const entry of sorted){
    if(!entry.yield) {
      continue;
    }

    let sp_value = (sp_shares * entry.price); 
      let dividend = 0;
      dividend = ((sp_value * entry.yield) / 1200);
      cash = cash + dividend;

      for(let note of treasuries){
        let coupon = ((note.amount * note.yield) / 1200);
        cash = cash + coupon;
      }

      if(treasuries.length > 120){
        let matured = treasuries.shift();
        cash = cash + matured.amount;
      }

      // Management expenses
      nav = cash + sp_value;
      //let expenses = (nav * .01) / 12;
      let expenses = 0;
      cash = cash - expenses;
      total_expenses = total_expenses + expenses;
      if(cash < 0){ // TODO, sell
        console.log("Dividends do not cover expenses: " + entry.date);
        console.log("Nav was: " + nav.toFixed(2));
        console.log("expenses: " + expenses.toFixed(2));
        console.log("Yield was: " + entry.yield.toFixed(2));
        cash = 0;
      }
    

    let bondInvestment = cash * 1;
    if(bondInvestment > 0){
      let yield = treas_yields[entry.date];
      if(yield){
        let maturity = new Date(entry.date);
        maturity.setFullYear(maturity.getFullYear() + 10);
        treasuries.push({date: entry.date, amount: bondInvestment, yield, maturity});
        cash = cash - bondInvestment;
      }
    }

    if(entry.price < cash){
      let shares = Math.floor(cash / entry.price);
      sp_shares += shares;
      cash = cash - (shares * entry.price);
      //console.log('Purchase S&P %s, %i', entry.date.toISOString(), shares);
    }


    let treas_value = 0;
    for(const note of treasuries) {
      let rate = treas_yields[entry.date] / 100;
      let maturity = note.maturity;
      let settlement = new Date(entry.date);
      let yield = note.yield / 100;
      let redemption = note.amount;
      let frequency = 2;
      let convention = '30U/360',
      b = bondCalculator({settlement, maturity, rate: yield, redemption, frequency, convention});
      treas_value = treas_value + b.price(rate);
    }

    sp_value = (sp_shares * entry.price); 
    nav = cash + sp_value + treas_value;
    performance.push([entry.date.toDateString(), nav])
    let months = performance.length;
    if(months > 241){
      let comp = months - 240;
      let startNav = performance[comp][1];
      let change = nav - startNav;
      if(change < 0){
        console.log("Negative change " + entry.date.toDateString());
      }
      let currentPercent = (change / startNav) * 100
      monthly.push([entry.date.toDateString(), currentPercent]);
    }
    //console.log('%s ---> %i', entry.date.toString(), nav);
    //console.log('%s -> %f', entry.date.toString(), entry.price);
  }

  let treas_value = 0;
  for(const note of treasuries) {
    treas_value = treas_value + note.amount;
  }

  let exp_ratio = (total_expenses / nav) * 100;
  console.log("Treasuries: " + treas_value);
  console.log("S&P shares: " + sp_shares);
  console.log("cash: " + cash.toFixed(2));
  console.log("Real Exp: " + total_expenses.toFixed(2));
  console.log("Real Exp Ratio%: " + exp_ratio.toFixed(2));
  console.log("Final nav: " + nav.toFixed(2));
  fs.writeFileSync('./monthly.json', JSON.stringify(monthly, null, 2));
  fs.writeFileSync('./perf.json', JSON.stringify(performance, null, 2));
});

