const GoogleChartsNode = require('google-charts-node');
const fs = require('fs');



// Render the chart to image
async function render(input){

  const drawChartStr = `

  var data = new google.visualization.DataTable();

  data.addColumn('string', 'Time');
  data.addColumn('number', 'NAV');
  data.addRows(${input});

  const options = {
      title: 'Performance',
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

const data = fs.readFileSync('./perf.json');
render(data)
.then(image => {
  fs.writeFileSync('./test.png',image);
});
