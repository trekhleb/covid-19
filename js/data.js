const covidDataTypes = {
  confirmed: {
    key: 'confirmed',
    title: 'Confirmed',
    backgroundColor: 'rgba(255, 159, 64, 0.2)',
    borderColor: 'rgba(255, 159, 64, 1)',
  },
  recovered: {
    key: 'recovered',
    title: 'Recovered',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
  },
  deaths: {
    key: 'deaths',
    title: 'Deaths',
    backgroundColor: 'rgba(255, 99, 132, 0.2)',
    borderColor: 'rgba(255, 99, 132, 1)',
  },
};

const covidCountries = {
  all: {
    key: 'all',
    title: 'All',
  }
};

const covidDataBaseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series';
const covidDataURLs = {
  [covidDataTypes.confirmed.key]: `${covidDataBaseURL}/time_series_19-covid-Confirmed.csv`,
  [covidDataTypes.recovered.key]: `${covidDataBaseURL}/time_series_19-covid-Recovered.csv`,
  [covidDataTypes.deaths.key]: `${covidDataBaseURL}/time_series_19-covid-Deaths.csv`,
};

function loadCovidData() {
  return Promise
    .all(Object.values(covidDataURLs).map((dataURL) => fetch(dataURL)))
    .then((responses) => Promise.all(
      responses.map(response => response.text()))
    )
    .then((data) => data.reduce((acc, val, index) => {
      acc[Object.keys(covidDataURLs)[index]] = Papa.parse(val).data;
      return acc;
    }, {}));
}
