const dataURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series';
const dataURLs = {
  confirmed: `${dataURL}/time_series_19-covid-Confirmed.csv`,
  deaths: `${dataURL}/time_series_19-covid-Deaths.csv`,
  recovered: `${dataURL}/time_series_19-covid-Recovered.csv`,
};

function loadData() {
  return Promise
    .all(Object.values(dataURLs).map((dataURL) => fetch(dataURL)))
    .then((responses) => Promise.all(
      responses.map(response => response.text()))
    )
    .then((data) => data.reduce((acc, val, index) => {
      acc[Object.keys(dataURLs)[index]] = Papa.parse(val).data;
      return acc;
    }, {}));
}
