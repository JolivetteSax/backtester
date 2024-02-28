const GoogleChartsNode = require('google-charts-node');
const fs = require('fs');



// Render the chart to image
async function render(input){

  const drawChartStr = `

  var data = new google.visualization.DataTable();

  data.addColumn('number', '');
  data.addColumn('number', 'one');
  data.addColumn('number', 'two');
  data.addRows(${input});

  const options = {
      title: '',
      chartArea: {width: '80%'},
      vAxis: {
        minValue: 0
      }
   };

  const chart = new google.visualization.LineChart(container);
  chart.draw(data, options);
  `;

  return image = await GoogleChartsNode.render(drawChartStr, {
    width: 1200,
    height: 900,
    puppeteerOptions: {
      headless: 'new'
    }
  });
}

let data = JSON.parse(fs.readFileSync('./monthly.json'));
let data2 = JSON.parse(fs.readFileSync('./monthly2.json'));
data2 = data2.sort((a, b) => {return b[1]-a[1]});
for(let i = 0; i < data2.length; i++){
  data2[i][0] = i+1;
}

data = data.sort((a, b) => {return b[1]-a[1]});
for(let i = 0; i < data.length; i++){
  data[i][0] = i+1;
  data[i][2] = data2[i][1];
}

render(JSON.stringify(data))
.then(image => {
  fs.writeFileSync('./monthly.png',image);
});
