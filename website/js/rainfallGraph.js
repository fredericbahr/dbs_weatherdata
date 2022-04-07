export const drawRainfallGraph = (xml, dateTimes) => {
  //Größenmaße
  const margin = { top: 25, right: 40, bottom: 75, left: 50 };
  const width =
    document.getElementById("rainfallGraph").getBoundingClientRect().width +
    margin.left +
    margin.right;
  const height = 500;

  //Hilfsfunctionen
  const weekFormatter = d3.format("02d");
  const valueFormatter = d3.format(".2f");
  const compare = (a, b) => {
    const weekA = a.week;
    const weekB = b.week;
    let comparison = 0;
    if (weekA > weekB) {
      comparison = 1;
    } else if (weekA < weekB) {
      comparison = -1;
    }
    return comparison;
  };

  // https://weeknumber.net/how-to/javascript
  Date.prototype.getWeek = function () {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return (
      1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  };

  // SVG-Graph
  const svg = d3
    .select("#rainfallGraph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Data Processing
  let values = [];

  xml.selectAll("precipitation").each(function () {
    values.push(+this.textContent);
  });

  let dataset = [];
  for (var i = 0; i < dateTimes.length; i++) {
    dataset.push({ date: dateTimes[i], value: values[i] });
  }

  dataset = dataset.filter((element) => element.value);

  // Rainfall per days
  let summe = dataset[0].value;
  const datasetPerDay = [];
  dataset.forEach((element, index) => {
    if (index > 0) {
      const comparison1 = new Date(element.date);
      const comparison2 = new Date(dataset[index - 1].date);
      if (
        comparison1.setHours(0, 0, 0, 0) === comparison2.setHours(0, 0, 0, 0)
      ) {
        summe += element.value;
      } else {
        const data = { date: comparison2, value: summe };
        datasetPerDay.push(data);
        summe = element.value;
      }
    }
  });

  //Rainfall per week
  summe = datasetPerDay[0].value;
  const datasetPerWeek = [];
  datasetPerDay.forEach((element, index) => {
    if (index > 0) {
      if (element.date.getWeek() === datasetPerDay[index - 1].date.getWeek()) {
        summe += element.value;
      } else {
        const data = {
          week: datasetPerDay[index - 1].date.getWeek(),
          value: summe,
        };
        datasetPerWeek.push(data);
        summe = element.value;
      }
    }
  });

  // Add Missing weaks
  for (let i = 1; i <= 52; i++) {
    if (!datasetPerWeek.some((element) => element.week === i)) {
      datasetPerWeek.push({ week: i, value: 0 });
    }
  }

  datasetPerWeek.sort(compare);

  //Average Rainfall
  const weaklyAverage = d3.mean(datasetPerWeek, (d) => d.value);

  //Skalierung definieren
  const xScale = d3.scaleBand().range([0, width]).padding(0.3);
  const yScale = d3.scaleLinear().range([height, 0]);

  xScale.domain(datasetPerWeek.map((d) => d.week));
  yScale.domain([0, d3.max(datasetPerWeek, (d) => d.value)]);

  //Achsen definieren
  const xaxis = d3.axisBottom().tickFormat(weekFormatter).scale(xScale);

  const yaxis = d3.axisLeft().scale(yScale);

  //x-Achse anlegen
  svg
    .append("g")
    .attr("class", "axis xAxis")
    .attr("transform", `translate(0, ${height} )`)
    .call(xaxis)
    .append("text")
    .attr("y", "55")
    .attr("x", "50%")
    .style("font-size", "1vmax")
    .text("Woche");

  //y-Achse anlegen
  svg
    .append("g")
    .attr("class", "axis")
    .call(yaxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", ".75em")
    .attr("y", 6)
    .style("text-anchor", "end")
    .text("Millimeter");

  //Daten hinzufügen und "Hover"-Funktion implementieren
  svg
    .selectAll(".bar")
    .data(datasetPerWeek)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.week))
    .attr("y", (d) => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - yScale(0))
    .attr("y", (d) => yScale(0))
    .on("mouseover", function () {
      focusBar.style("display", "block");
    })
    .on("mouseout", function () {
      focusBar.style("display", "none");
    })
    .on("mousemove", mousemoveBar);

  // Average Line
  svg
    .append("line")
    .attr("id", "averageLine")
    .attr("x1", 0)
    .attr("y1", yScale(weaklyAverage))
    .attr("x2", width)
    .attr("y2", yScale(weaklyAverage))
    .on("mouseover", function () {
      focusAverageLine.style("display", "block");
    })
    .on("mouseout", function () {
      focusAverageLine.style("display", "none");
    })
    .on("mousemove", mousemoveAverageLine);

  //Hover-Funktion für die Linie
  svg
    .append("use")
    .attr("pointer-events", "all")
    .attr("stroke-width", "15")
    .attr("fill", "none")
    .attr("stroke-width", "22")
    .attr("href", "#averageLine")
    .attr("class", "averageLineUse")
    .on("mouseover", function () {
      focusAverageLine.style("display", "block");
    })
    .on("mouseout", function () {
      focusAverageLine.style("display", "none");
    })
    .on("mousemove", mousemoveAverageLine);

  // Legend
  svg
    .append("circle")
    .attr("cx", "75%")
    .attr("cy", "5%")
    .attr("r", 6)
    .attr("class", "legendCircle1");
  svg
    .append("circle")
    .attr("cx", "75%")
    .attr("cy", "9%")
    .attr("r", 6)
    .attr("class", "legendCircle2");
  svg
    .append("text")
    .attr("x", "76%")
    .attr("y", "5.8%")
    .text("Gesamtniederschlag pro Woche")
    .attr("class", "legendText1");
  svg
    .append("text")
    .attr("x", "76%")
    .attr("y", "9.8%")
    .text("Durchschnitt (" + valueFormatter(weaklyAverage) + " mm)")
    .attr("class", "legendText2");

  // ############## Animation ##################
  svg
    .selectAll("rect")
    .transition()
    .duration(100)
    .attr("y", (d) => yScale(d.value))
    .attr("height", (d) => height - yScale(d.value))
    .delay(function (d, i) {
      return i * 50;
    });

  // ######### Tooltip ###########
  // Tooltip Bars
  const focusBar = svg
    .append("g")
    .attr("class", "focusBar")
    .style("display", "none");

  focusBar
    .append("rect")
    .attr("class", "tooltip")
    .attr("width", 190)
    .attr("height", 55)
    .attr("x", 10)
    .attr("y", -22)
    .attr("rx", 4)
    .attr("ry", 4);

  // Tooltip date text
  focusBar
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 18)
    .attr("y", 0.5)
    .text("Woche: ");

  // Tooltip date value
  focusBar
    .append("text")
    .attr("class", "tooltip-date")
    .attr("x", 75)
    .attr("y", 0.5);

  // Tooltip precipitation text
  focusBar
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 18)
    .attr("y", 20.5)
    .text("Niederschlag: ");

  //Tooltip precipitation value
  focusBar
    .append("text")
    .attr("class", "tooltip-value")
    .attr("x", 120)
    .attr("y", 20.5);

  function mousemoveBar(d) {
    focusBar.attr(
      "transform",
      `translate(${d3.mouse(this)[0]},${d3.mouse(this)[1]})`
    );
    if (d3.mouse(this)[0] > 856) {
      focusBar.select(".tooltip").attr("transform", "translate(-220,0)");
      focusBar.select(".tooltip-date").attr("transform", "translate(-220,0)");
      focusBar.select(".tooltip-value").attr("transform", "translate(-220,0)");
      focusBar
        .selectAll(".tooltip-description")
        .attr("transform", "translate(-220,0)");
    } else {
      focusBar.select(".tooltip").attr("transform", "null");
      focusBar.select(".tooltip-date").attr("transform", "null");
      focusBar.select(".tooltip-value").attr("transform", "null");
      focusBar.selectAll(".tooltip-description").attr("transform", "null");
    }
    focusBar.select(".tooltip-date").text(weekFormatter(d.week));
    focusBar.select(".tooltip-value").text(valueFormatter(d.value) + " mm");
  }

  const focusAverageLine = svg
    .append("g")
    .attr("class", "focusAverageLine")
    .style("display", "none");

  focusAverageLine
    .append("rect")
    .attr("class", "tooltip")
    .attr("width", 175)
    .attr("height", 30)
    .attr("x", 10)
    .attr("y", -22)
    .attr("rx", 4)
    .attr("ry", 4);

  focusAverageLine
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 18)
    .attr("y", 0.5)
    .text("Durschnitt:");

  focusAverageLine
    .append("text")
    .attr("class", "tooltip-value")
    .attr("x", 105)
    .attr("y", 0.5)
    .text(valueFormatter(weaklyAverage) + "mm");

  function mousemoveAverageLine() {
    focusAverageLine.style("display", "block");
    focusAverageLine.attr(
      "transform",
      `translate(${d3.mouse(this)[0]},${d3.mouse(this)[1]})`
    );
    if (d3.mouse(this)[0] > 856) {
      focusAverageLine
        .select(".tooltip")
        .attr("transform", "translate(-200,0)");
      focusAverageLine
        .select(".tooltip-value")
        .attr("transform", "translate(-200,0)");
      focusAverageLine
        .selectAll(".tooltip-description")
        .attr("transform", "translate(-200,0)");
    } else {
      focusAverageLine.select(".tooltip").attr("transform", "null");
      focusAverageLine.select(".tooltip-value").attr("transform", "null");
      focusAverageLine
        .selectAll(".tooltip-description")
        .attr("transform", "null");
    }
  }
};
