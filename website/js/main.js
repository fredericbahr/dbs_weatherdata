import { drawRainfallGraph } from "./rainfallGraph.js";
import { drawTemperatureGraph } from "./temperatureGraph.js";
import { solarRadiationGraph } from "./solarRadiationGraph.js";

window.addEventListener("load", () => {
  d3.xml("data.xml").then((xml) => {
    let utcDates = [];
    let utcTimes = [];
    let lstDates = [];
    let lstTimes = [];

    const dateConv = d3.timeParse("%Y-%m-%d");

    const document = d3.select(xml.documentElement);
    const utc = document.selectAll("utc");
    utc.selectAll("date").each(function () {
      utcDates.push(dateConv(this.textContent));
    });

    utc.selectAll("time").each(function () {
      utcTimes.push(this.textContent);
    });

    const utcDateTimes = [];
    utcDates.map((value, index) => {
      value.setHours(parseInt(utcTimes[index].split(":")[0]));
      utcDateTimes.push(value);
    });

    const lst = document.selectAll("lst");
    lst.selectAll("date").each(function () {
      lstDates.push(dateConv(this.textContent));
    });

    lst.selectAll("time").each(function () {
      lstTimes.push(this.textContent);
    });

    const lstDateTimes = [];
    lstDates.map((value, index) => {
      value.setHours(parseInt(lstTimes[index].split(":")[0]));
      lstDateTimes.push(value);
    });

    drawTemperatureGraph(document, utcDateTimes);
    drawRainfallGraph(document, utcDateTimes);
    solarRadiationGraph(document, lstDateTimes);
  });
});
