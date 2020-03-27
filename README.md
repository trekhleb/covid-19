# Coronavirus (COVID-19) Dashboard

📈 [**Coronavirus (COVID-19) Dashboard**](https://trekhleb.github.io/covid-19/) shows the dynamics (the curvature of the graph) of Сoronavirus distribution per country.

## Reasoning

The reason for creating a new dashboard was to complement the well-known [JHU Dashboard](https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6) (which is made by Johns Hopkins CSSE) with the feature of seeing the charts with the number of COVID-19 `confirmed` / `recovered`/ `deaths` use-cases per country.

Basically I personally had a question like: _"What about the Netherlands/Ukraine?"_, _"Is the virus spread (growth factor) slowing down?"_, _"How I can compare the recovered/deaths dynamics per-country?"_, _"Which countries are doing the proper things to slow down the growth-factor"_.

### Main Functionality

The dashboard is still raw but it provides a basic functionality of displaying the global and per-country data charts.

Here is how the main functionality looks like:

![COVID-19 Dashboard Demo](./img/demo.gif)

## Data source and tech-stack

The dashboard is using [COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE](https://github.com/CSSEGISandData/COVID-19) as a data source.

Front-end wise I've tried to make it as simple as possible, therefore the dashboard is using a pure [React.js](https://reactjs.org/) (without `JSX` transpiler or `CreateReactApp` starter). To draw the chart I've used [Charts.js](https://www.chartjs.org/).
