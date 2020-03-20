const covidSchema = {
  headerRow: 0,
  stateColumn: 0,
  countryColumn: 1,
  latColumn: 2,
  lonColumn: 3,
  dateStartColumn: 4,
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
    key: 'Global',
    title: 'Global',
    index: -1,
  }
};

function loadCovidData() {
  const defaultDataContainer = {
    labels: [],
    ticks: {},
  };
  return Promise
    .all(Object.values(covidDataTypes).map(
      dataType => fetch(dataType.dataSourceUrl)
    ))
    .then(responses => Promise.all(
      responses.map(response => response.text())
    ))
    .then(dataTypesTicks => {
      return dataTypesTicks.reduce(
        (dataContainer, dataTypeTicksCSV, dataTypeIndex) => {
          const dataType = Object.keys(covidDataTypes)[dataTypeIndex];
          const dataTypeTicks = Papa.parse(dataTypeTicksCSV).data;
          dataContainer.labels = dataTypeTicks.shift();
          dataContainer.ticks[dataType] = dataTypeTicks
            .map(regionTicks => {
              return regionTicks.map((regionTick, tickIndex) => {
                if (tickIndex < covidSchema.dateStartColumn) {
                  return regionTick;
                }
                return parseInt(regionTick, 10);
              });
            })
            .sort((regionTicksA, regionTicksB) => {
              const regionNameA = getRegionKey(regionTicksA);
              const regionNameB = getRegionKey(regionTicksB);
              if (regionNameA > regionNameB) {
                return 1;
              }
              else if (regionNameA < regionNameB) {
                return -1;
              }
              return 0;
            });
          return dataContainer;
        },
        defaultDataContainer
      );
    });
}

function getRegionKey(regionTicks) {
  const country = regionTicks[covidSchema.countryColumn];
  const state = regionTicks[covidSchema.stateColumn];
  return state ? `${country} - ${state}` : `${country}`;
}

function getRegionIndexByKey(covidData, dataType, regionKey) {
  covidData.ticks[dataType].findIndex(
    regionTicks => getRegionKey(regionTicks) === regionKey
  );
}

function getGlobalTicks(covidData, dataType) {
  const totalTicks = covidData.ticks[dataType][0].length;
  const globalTicks = new Array(totalTicks).fill(0);
  globalTicks[covidSchema.stateColumn] = '';
  globalTicks[covidSchema.countryColumn] = covidCountries.all.title;
  globalTicks[covidSchema.latColumn] = '';
  globalTicks[covidSchema.lonColumn] = '';
  covidData.ticks[dataType].forEach(regionTicks => {
    regionTicks.forEach((regionTick, tickIndex) => {
      if (tickIndex < covidSchema.dateStartColumn) {
        return;
      }
      globalTicks[tickIndex] += regionTick;
    });
  });
  return globalTicks;
}

function getCovidRegions(covidData) {
  return covidData.ticks[covidDataTypes.confirmed.key]
    .map((regionTicks, regionIndex) => {
      const name = getRegionKey(regionTicks);
      const confirmedRow = covidData.ticks[covidDataTypes.confirmed.key][regionIndex];
      const recoveredRow = covidData.ticks[covidDataTypes.recovered.key][regionIndex];
      const deathsRow = covidData.ticks[covidDataTypes.deaths.key][regionIndex];
      const numbers = {
        [covidDataTypes.confirmed.key]: confirmedRow[confirmedRow.length - 1],
        [covidDataTypes.recovered.key]: recoveredRow[recoveredRow.length - 1],
        [covidDataTypes.deaths.key]: deathsRow[deathsRow.length - 1],
      };
      return {name, numbers};
    });
}
