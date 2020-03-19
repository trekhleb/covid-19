const covidDataSchema = {
  stateColumn: 0,
  countryColumn: 1,
  latColumn: 2,
  lonColumn: 3,
  dateStartColumn: 4,
  headerRow: 0,
};

const covidDataBaseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series';

const covidDataTypes = {
  confirmed: {
    key: 'confirmed',
    title: 'Confirmed',
    dataSourceUrl: `${covidDataBaseURL}/time_series_19-covid-Confirmed.csv`,
    backgroundColor: 'rgba(255, 159, 64, 0.2)',
    borderColor: 'rgba(255, 159, 64, 1)',
  },
  recovered: {
    key: 'recovered',
    title: 'Recovered',
    dataSourceUrl: `${covidDataBaseURL}/time_series_19-covid-Recovered.csv`,
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
  },
  deaths: {
    key: 'deaths',
    title: 'Deaths',
    dataSourceUrl: `${covidDataBaseURL}/time_series_19-covid-Deaths.csv`,
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

function loadCovidData() {
  return Promise
    .all(Object.values(covidDataTypes).map((dataType) => fetch(dataType.dataSourceUrl)))
    .then((responses) => Promise.all(
      responses.map(response => response.text()))
    )
    .then((data) => data.reduce((acc, val, index) => {
      acc[Object.keys(covidDataTypes)[index]] = Papa.parse(val).data
        .map((row, rowIndex) => {
          if (rowIndex === covidDataSchema.headerRow) {return row;}
          return row.map((cell, cellIndex) => {
            if (cellIndex < covidDataSchema.dateStartColumn) {return cell;}
            return parseInt(cell, 10);
          });
        });
      return acc;
    }, {}));
}

function getCovidRegions(covidData) {
  if (!covidData) {
    return [];
  }
  return covidData[covidDataTypes.confirmed.key]
    .slice(1)
    .map((region, regionIndex) => {
      const country = region[covidDataSchema.countryColumn];
      const state = region[covidDataSchema.stateColumn];
      const name = state ? `${country} - ${state}` : country;

      const confirmedRow = covidData[covidDataTypes.confirmed.key][regionIndex + 1];
      const numbers = {
        [covidDataTypes.confirmed.key]: confirmedRow[confirmedRow.length - 1],
      };
      return {name, regionIndex};
    })
    .sort((a, b) => {
      if (a.name === b.name) {return 0;}
      if (a.name >= b.name) {return 1;}
      return -1;
    });
}
