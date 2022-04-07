<?xml version="1.0"?>
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xsl:output method="html" doctype-system="about:legacy-compat"/>
    <xsl:template match="/">
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <!-- Font -->
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link href="https://fonts.googleapis.com/css2?family=Lato&amp;display=swap" rel="stylesheet" />
                <!-- Icons -->
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
                <!-- Stylesheet -->
                <link rel="stylesheet" href="website/main.css" />
                <link rel="shortcut icon" type="image/x-icon" href="website/icons/sun.ico" />
                <link rel="stylesheet" href="website/snackbar.min.css" />

                <title>Wetterdaten</title>
            </head>
            <body>
                <h1>Auswertung Wetterdaten 2018</h1>
                <div class="wrapper">
                    
                    <!-- Aufruf des Templates zur Erzeugung der Stationsdaten -->
                    <xsl:apply-templates select="weatherData/station" />
                    <!-- Aufruf des Templates zur Erzeugung der "Highlights" -->
                    <xsl:apply-templates select="weatherData/datasets" />

                    <div class="graphWrapper">
                        <!-- Beginn des Temperatur-Graphens. Einbindung mittels D3, @see js/temperatureGraph.js -->
                        <div id="temperatureGraph">
                            <div class="headlineWrapper">
                                <h3>
                                Durchschnittliche Temperatur <span id="timeSpan">jeweils bei 0 Uhr (UTC)</span>
                                </h3>
                                <label>
                                    <span class="material-icons">
                                    schedule
                                    </span>
                                    <input type="time" id="timeInput" value="00:00" />
                                </label>
                            </div>
                        </div>
                        <!-- Beginn des Niederschlags-Graphens. Einbindung mittels D3, @see js/rainfallGraph.js -->
                        <div id="rainfallGraph">
                            <h3>
                                Gesamtniederschlag <span>pro Woche (UTC)</span>
                            </h3>
                        </div>
                        <!-- Beginn des Sonnenstrahlungs-Graphens. Einbindung mittels D3, @see js/solarRadioationGraph.js -->
                        <div id="solarRadiationGraph">
                            <div class="headlineWrapper">
                                <h3>
                                Durchscnittliche Sonnenstrahlung <span>pro Tag (LST)</span>
                                </h3>
                                <label>
                                    <span class="material-icons">
                                    today
                                    </span>
                                    <input type="date" id="dateInput" value="2018-01-01" min="2018-01-01" max="2018-12-31" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- D3.js -->
                <script src="https://d3js.org/d3.v5.min.js"></script>
                <!-- https://www.polonel.com/snackbar/ -->
                <script src="website/js/snackbar.min.js"></script>
                <script type="module" src="website/js/main.js"></script>
            </body>
        </html>
    </xsl:template>


    <!-- Template zum Anzeigen der Wetterstationsdaten, soll für jedes Stationselement innerhalb von weatherData ausgeführt werden -->
    <xsl:template match="/weatherData/station">
        <div class="stationdata">
            <h2>Stationsdaten</h2>
            <div class="stationwrapper">
                <p>
                    <span>WBAN-Nummer:</span>
                    <xsl:value-of select="wbanNumber"/>
                </p>
                <p>
                    <span>Bundesstaat:</span>
                    <xsl:value-of select="location/state"/>
                </p>
                <p>
                    <span>Stadt:</span>
                    <xsl:value-of select="location/city"/>
                </p>
                <p>
                    <span>Geokoordinaten: </span>
                    <xsl:text>Lat=</xsl:text>
                    <xsl:value-of select="location/latitude"/>
                    <xsl:text>, Long=</xsl:text>
                    <xsl:value-of select="location/longitude"/>
                </p>
                <p>
                    <a>
                        <!-- Einbettung eines Google-Maps-Links mit den Koordinaten -->
                        <xsl:attribute name="href">
                            <xsl:text>http://maps.google.de/maps?q=</xsl:text>
                            <xsl:value-of select="location/latitude"/>
                            <xsl:text>,</xsl:text>
                            <xsl:value-of select="location/longitude"/>
                            <xsl:text>&amp;t=k&amp;z=5</xsl:text>
                        </xsl:attribute>
                        <xsl:attribute name="target">
                            <xsl:text>_blank</xsl:text>
                        </xsl:attribute>
                        <xsl:text>Google-Maps</xsl:text>
                    </a>
                </p>
            </div>
        </div>
    </xsl:template>

    <!-- Template zum Anzeigen der Wetterstationsdaten "Highlights" -->
    <xsl:template match="/weatherData/datasets">
        <div class="singleDataWrapper">
            <div class="backgroundWrapper">
                <span class="title">Max. Temperatur</span>
                <!-- Jede maximale Temperatur soll ausgewählt werden -->
                <xsl:for-each select="dataset/temperature/max">
                    <!-- Sortierung, dass größte Zahl an Position 1 steht, und Zeichen zum Schluss  -->
                    <xsl:sort select="number(.)" data-type="number" order="descending"/>
                    <xsl:if test="position() = 1">
                        <p class="value">
                            <xsl:value-of select="."/>
                            <span class="unit">
                                            &#8451;
                            </span>
                        </p>
                        <p class="date">
                            <span>Datum</span>
                            <xsl:value-of select="../../utc/date"/>
                        </p>
                        <p class="time">
                            <span>Uhrzeit</span>
                            <xsl:value-of select="../../utc/time"/>
                        </p>
                    </xsl:if>
                </xsl:for-each>
            </div>
            <div class="backgroundWrapper">
                <span class="title">Min. Temperatur</span>
                <xsl:for-each select="dataset/temperature/min">
                    <!-- Sortierung, dass Zeichen ganz unten stehen, dann Sortierung nach Zahlen -->
                    <xsl:sort select="not(number(.))" />
                    <xsl:sort select="number(.)" data-type="number" order="ascending"/>
                    <xsl:if test="position() = 1">
                        <p class="value">
                            <!-- Value -->
                            <xsl:value-of select="."/>
                            <span class="unit">
                                            &#8451;
                            </span>
                        </p>
                        <p class="date">
                            <span>Datum</span>
                            <xsl:value-of select="../../utc/date"/>
                        </p>
                        <p class="time">
                            <span>Uhrzeit</span>
                            <xsl:value-of select="../../utc/time"/>
                        </p>
                    </xsl:if>
                </xsl:for-each>
            </div>

            <div class="backgroundWrapper">
                <span class="title">Max. Niederschlag</span>
                <xsl:for-each select="dataset/precipitation">
                    <xsl:sort select="number(.)" data-type="number" order="descending"/>
                    <xsl:if test="position() = 1">
                        <p class="value">
                            <xsl:value-of select="."/>
                            <span class="unit">
                                            mm
                            </span>
                        </p>
                        <p class="date">
                            <span>Datum</span>
                            <xsl:value-of select="../utc/date"/>
                        </p>
                        <p class="time">
                            <span>Uhrzeit</span>
                            <xsl:value-of select="../utc/time"/>
                        </p>
                    </xsl:if>
                </xsl:for-each>
            </div>

            <div class="backgroundWrapper">
                <span class="title">Max. relative Luftfeuchtigkeit</span>
                <xsl:for-each select="dataset/relativeHumidity/average">
                    <xsl:sort select="not(number(.))"/>
                    <xsl:sort select="number(.)" data-type="number" order="descending"/>
                    <xsl:if test="position() = 1">
                        <p class="value">
                            <xsl:value-of select="."/>
                            <span class="unit">
                                            %
                            </span>
                        </p>
                        <p class="date">
                            <span>Datum</span>
                            <xsl:value-of select="../../utc/date"/>
                        </p>
                        <p class="time">
                            <span>Uhrzeit</span>
                            <xsl:value-of select="../../utc/time"/>
                        </p>
                    </xsl:if>
                </xsl:for-each>
            </div>

            <div class="backgroundWrapper">
                <span class="title">Max. Oberflächentemperatur</span>
                <xsl:for-each select="dataset/surfaceTemperature/max">
                    <xsl:sort select="number(.)" data-type="number" order="descending"/>
                    <xsl:if test="position() = 1">
                        <p class="value">
                            <xsl:value-of select="."/>
                            <span class="unit">
                                            &#8451;
                            </span>
                        </p>
                        <p class="date">
                            <span>Datum</span>
                            <xsl:value-of select="../../utc/date"/>
                        </p>
                        <p class="time">
                            <span>Uhrzeit</span>
                            <xsl:value-of select="../../utc/time"/>
                        </p>
                    </xsl:if>
                </xsl:for-each>
            </div>

            <div class="backgroundWrapper">
                <span class="title">Min. Oberflächentemperatur</span>
                <xsl:for-each select="dataset/surfaceTemperature/min">
                    <xsl:sort select="not(number(.))"/>
                    <xsl:sort select="number(.)" data-type="number" order="ascending"/>
                    <xsl:if test="position() = 1">
                        <p class="value">
                            <!-- Value -->
                            <xsl:value-of select="."/>
                            <span class="unit">
                                            &#8451;
                            </span>
                        </p>
                        <p class="date">
                            <span>Datum</span>
                            <xsl:value-of select="../../utc/date"/>
                        </p>
                        <p class="time">
                            <span>Uhrzeit</span>
                            <xsl:value-of select="../../utc/time"/>
                        </p>
                    </xsl:if>
                </xsl:for-each>
            </div>
        </div>
    </xsl:template>
</xsl:stylesheet>