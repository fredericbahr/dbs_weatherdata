export const drawTemperatureGraph = (xml, dateTimes) => {
  //Größenmaße
  const margin = { top: 25, right: 40, bottom: 75, left: 50 };
  const width =
    document.getElementById("temperatureGraph").getBoundingClientRect().width +
    margin.left +
    margin.right;
  const height = 500;

  //Hilfsfunctionen
  const dateFormatter = d3.timeFormat("%d.%m.%y %H");
  const bisectDate = d3.bisector(function (d) {
    return d.date;
  }).left;

  // SVG-Graph
  const svg = d3
    .select("#temperatureGraph")
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

  let values = [];

  //Processign the data
  const temperature = xml.selectAll("temperature");
  temperature.selectAll("average").each(function () {
    values.push(+this.textContent);
  });

  let dataset = [];
  for (var i = 0; i < dateTimes.length; i++) {
    if (dateTimes[i].getHours() === 0) {
      dataset.push({ date: dateTimes[i], value: values[i] });
    }
  }

  //Skalierung definieren
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  xScale.domain(d3.extent(dateTimes));
  yScale.domain([
    d3.min(dataset, (d) => d.value) - 2,
    d3.max(dataset, (d) => d.value),
  ]);

  //Achsen definieren
  const xaxis = d3
    .axisBottom()
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b '%y"))
    .scale(xScale);

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
    .text("Monat");

  //y-Achse anlegen
  svg
    .append("g")
    .attr("class", "axis yAxis")
    .call(yaxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", ".75em")
    .attr("y", 6)
    .style("text-anchor", "end")
    .text("Grad Celsius");

  //Line-Generator
  const line = d3
    .line()
    .defined(function (d) {
      return !isNaN(d.value);
    })
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value));

  //Line erzeugen
  let path = svg
    .append("path")
    .attr("class", "tempPath")
    .datum(dataset)
    .attr("d", line);

  // ############ Animation ###########
  let pathLength = path.node().getTotalLength();

  const transitionPath = d3.transition().ease(d3.easeLinear).duration(1500);

  path
    .attr("stroke-dashoffset", pathLength)
    .attr("stroke-dasharray", pathLength)
    .transition(transitionPath)
    .attr("stroke-dashoffset", 0);

  // ######### Tooltip ###########
  const focus = svg.append("g").attr("class", "focus").style("display", "none");

  //Dot on graphline
  focus.append("circle").attr("r", 3);

  //Tooltip
  focus
    .append("rect")
    .attr("class", "tooltip")
    .attr("width", 180)
    .attr("height", 55)
    .attr("x", 10)
    .attr("y", -22)
    .attr("rx", 4)
    .attr("ry", 4);

  // Tooltip date text
  focus
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 18)
    .attr("y", 0.5)
    .text("Datum: ");

  // Tooltip date value
  focus
    .append("text")
    .attr("class", "tooltip-date")
    .attr("x", 70)
    .attr("y", 0.5);

  // Tooltip temp text
  focus
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 18)
    .attr("y", 20.5)
    .text("Temperatur: ");

  //Tooltip temp date
  focus
    .append("text")
    .attr("class", "tooltip-value")
    .attr("x", 100)
    .attr("y", 20.5);

  //Tooltip overlay mit Funktionen zum Anzeigen
  svg
    .append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function () {
      focus.style("display", "block");
    })
    .on("mouseout", function () {
      focus.style("display", "none");
    })
    .on("mousemove", mousemove);

  function mousemove() {
    //Berechnung des nächstens Werts
    const x0 = xScale.invert(d3.mouse(this)[0]);
    const i = bisectDate(dataset, x0, 1);
    const d0 = dataset[i - 1];
    const d1 = dataset[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    // Anzeigen des Tooltips links oder rechts vom Cursor
    if (d3.mouse(this)[0] > 856) {
      focus.attr(
        "transform",
        `translate(${xScale(d.date)},${yScale(d.value)})`
      );
      focus.select(".tooltip").attr("transform", "translate(-200,0)");
      focus.select(".tooltip-date").attr("transform", "translate(-200,0)");
      focus.select(".tooltip-value").attr("transform", "translate(-200,0)");
      focus
        .selectAll(".tooltip-description")
        .attr("transform", "translate(-200,0)");
    } else {
      focus.attr(
        "transform",
        `translate(${xScale(d.date)},${yScale(d.value)})`
      );
      focus.select(".tooltip").attr("transform", "null");
      focus.select(".tooltip-date").attr("transform", "null");
      focus.select(".tooltip-value").attr("transform", "null");
      focus.selectAll(".tooltip-description").attr("transform", "null");
    }
    focus.select(".tooltip-date").text(dateFormatter(d.date) + " Uhr");
    focus.select(".tooltip-value").text(d.value + " °C");
  }

  // ########## Hour-Change #############
  const handleTimeChange = (event) => {
    const time = parseInt(event.srcElement.value.split(":")[0]);
    if (time < 10) {
      timeInput.value = `0${time}:00`;
    } else {
      timeInput.value = `${time}:00`;
    }
    timeSpan.innerHTML = `jeweils bei ${time} uhr (UTC)`;
    // Neuen Datensätze bestimmen
    dataset = [];
    for (var i = 1; i < dateTimes.length; i++) {
      if (dateTimes[i].getHours() === time) {
        dataset.push({ date: dateTimes[i], value: values[i] });
      }
    }

    //Graph updaten
    xScale.domain(d3.extent(dateTimes));
    yScale.domain([
      d3.min(dataset, (d) => d.value) - 2,
      d3.max(dataset, (d) => d.value),
    ]);

    svg.selectAll(".xAxis").transition().duration(1000).call(xaxis);

    svg.selectAll(".yAxis").transition().duration(1000).call(yaxis);

    pathLength = path.node().getTotalLength();

    path
      .attr("class", "tempPath")
      .datum(dataset)
      .attr("d", line)
      .attr("stroke-dashoffset", pathLength)
      .attr("stroke-dasharray", pathLength)
      .transition(transitionPath)
      .attr("stroke-dashoffset", 0);
  };

  const timeInput = document.getElementById("timeInput");
  const timeSpan = document.getElementById("timeSpan");
  timeInput.addEventListener("change", handleTimeChange);
};
