export const solarRadiationGraph = (xml, dateTimes) => {
  //Größenmaße
  const margin = { top: 25, right: 40, bottom: 75, left: 50 };
  const width =
    document.getElementById("temperatureGraph").getBoundingClientRect().width +
    margin.left +
    margin.right;
  const height = 500;

  //Hilfsfunktionen
  const dateFormatter = d3.timeFormat("%d.%m.%y %H");
  const bisectDate = d3.bisector(function (d) {
    return d.date;
  }).left;

  // SVG-Graph
  const svg = d3
    .select("#solarRadiationGraph")
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
  const solarRadiation = xml.selectAll("solarRadiation");
  solarRadiation.selectAll("average").each(function () {
    values.push(+this.textContent);
  });

  let dataset = [];
  for (var i = 0; i < dateTimes.length; i++) {
    dataset.push({ date: dateTimes[i], value: values[i] });
  }

  let date = "2018-01-01";
  let date1 = new Date(`${date}T00:00:00`);
  let date2 = new Date(`${date}T23:00:01`);
  let dataPerDay = dataset.filter(
    (element) => element.date >= date1 && element.date < date2
  );

  //Skalierung definieren
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  xScale.domain(d3.extent(dataPerDay, (d) => d.date));
  yScale.domain(d3.extent(dataPerDay, (d) => d.value));

  //Achsen definieren
  let xaxis = d3
    .axisBottom()
    .ticks(d3.timeHour.every(1))
    .tickFormat(d3.timeFormat("%H"))
    .scale(xScale);

  let yaxis = d3.axisLeft().scale(yScale);

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
    .text("Uhrzeit");

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
    .text("Watt pro Quadratmeter");

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
    .attr("class", "solarPath")
    .datum(dataPerDay)
    .attr("d", line);

  // ############ Animation ###########
  const pathLength = path.node().getTotalLength();

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
    .attr("width", 185)
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

  // Tooltip value text
  focus
    .append("text")
    .attr("class", "tooltip-description")
    .attr("x", 18)
    .attr("y", 20.5)
    .text("Sonnenstrahlung: ");

  //Tooltip value value
  focus
    .append("text")
    .attr("class", "tooltip-value")
    .attr("x", 130)
    .attr("y", 20.5);

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
    const x0 = xScale.invert(d3.mouse(this)[0]);
    const i = bisectDate(dataPerDay, x0, 1);
    const d0 = dataPerDay[i - 1];
    const d1 = dataPerDay[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    if (d3.mouse(this)[0] > 856) {
      focus.attr(
        "transform",
        `translate(${xScale(d.date)},${yScale(d.value)})`
      );
      focus.select(".tooltip").attr("transform", "translate(-160,0)");
      focus.select(".tooltip-date").attr("transform", "translate(-160,0)");
      focus.select(".tooltip-value").attr("transform", "translate(-160,0)");
      focus
        .selectAll(".tooltip-description")
        .attr("transform", "translate(-160,0)");
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
    focus.select(".tooltip-value").text(d.value + " W/\u33A1");
  }

  // ########## Day-Change #############
  const handleDateChange = (event) => {
    date1 = new Date(`${event.srcElement.value}T00:00:00`);
    date2 = new Date(`${event.srcElement.value}T23:00:01`);
    dataPerDay = dataset.filter(
      (element) => element.date >= date1 && element.date < date2
    );

    xScale.domain(d3.extent(dataPerDay, (d) => d.date));
    yScale.domain([
      d3.min(dataPerDay, (d) => d.value),
      d3.max(dataPerDay, (d) => d.value) + 1,
    ]);

    xaxis = d3
      .axisBottom()
      .ticks(d3.timeHour.every(1))
      .tickFormat(d3.timeFormat("%H"))
      .scale(xScale);

    yaxis = d3.axisLeft().scale(yScale);

    svg.selectAll(".xAxis").call(xaxis);

    svg.selectAll(".yAxis").transition().duration(500).call(yaxis);

    path.attr("class", "solarPath").datum(dataPerDay).attr("d", line);

    Snackbar.show({
      text: `<span class="material-icons">info</span> <span id="text">Geänderte Skalierung der Y-Achse!</span>`,
      actionText: `<span class="material-icons">close</span>`,
      backgroundColor: "#0381ff",
      duration: 4000,
      customClass: "snackbar",
    });
  };

  const dateInput = document.getElementById("dateInput");
  dateInput.addEventListener("change", handleDateChange);
};
