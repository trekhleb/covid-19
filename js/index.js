// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [covidData, setCovidData] = r.useState(null);
  const [covidDataByCountries, setCovidDataByCountries] = r.useState(null);
  const [errorMessage, setErrorMessage] = r.useState(null);

  const [groupByCountry, setGroupByCountry] = r.useState(false);
  const [selectedTypes, setSelectedTypes] = r.useState(Object.keys(covidDataTypes));
  const [selectedRegions, setSelectedRegions] = r.useState([covidCountries.all.key]);
  const [countrySearchQuery, setCountrySearchQuery] = r.useState('');

  const [dataSort, setDataSort] = r.useState(covidSorts.confirmed.key);
  const [dataSortDirection, setDataSortDirection] = r.useState(covidSortDirections.desc.key);

  const selectedRegionsRef = r.useRef([...selectedRegions]);

  const onRegionChange = (changedRegionKey) => {
    const currentRegions = selectedRegionsRef.current;
    if (currentRegions.includes(changedRegionKey)) {
      const newRegions = [...currentRegions.filter(regionKey => regionKey !== changedRegionKey)];
      if (newRegions.length) {
        setSelectedRegions(newRegions);
        selectedRegionsRef.current = newRegions;
      } else {
        const newRegions = [covidCountries.all.key];
        setSelectedRegions(newRegions);
        selectedRegionsRef.current = newRegions;
      }
    } else {
      const newRegions = [...currentRegions.filter(regionKey => regionKey !== covidCountries.all.key), changedRegionKey];
      setSelectedRegions(newRegions);
      selectedRegionsRef.current = newRegions;
    }
  };

  const onDataSort = (dataSortKey, dataSortDirectionKey) => {
    setDataSort(dataSortKey);
    setDataSortDirection(dataSortDirectionKey);
  };

  const onTypeChange = (dataTypeKey) => {
    if (selectedTypes.includes(dataTypeKey)) {
      setSelectedTypes([...selectedTypes.filter(dataType => dataType !== dataTypeKey)]);
    } else {
      setSelectedTypes([...selectedTypes, dataTypeKey]);
    }
  };

  const onCountrySearch = (query) => {
    const q = query || '';
    setCountrySearchQuery(q);
  };

  const onGroupByCountries = () => {
    setGroupByCountry(!groupByCountry);
  };

  r.useEffect(() => {
    loadCovidData()
      .then((data) => {
        setCovidData(data);
        setCovidDataByCountries(groupCovidDataByCountries(data));
      })
      .catch(() => setErrorMessage('Cannot fetch the statistics data. It might be a network issue. Try to refresh the page.'));
  }, []);

  if (errorMessage) {
    return e(ErrorMessage, {errorMessage});
  }
  if (!covidData) {
    return e(Spinner);
  }

  const covidDataInUse = groupByCountry ? covidDataByCountries : covidData;

  return (
    e('div', null,
      e('div', {className: 'mb-3'},
        e(LastUpdatedDate, {covidData})
      ),
      e('div', {className: 'mb-1'},
        e(DataTypes, {covidData: covidDataInUse, selectedRegions, selectedTypes, onTypeChange})
      ),
      e('div', {className: 'mb-4'},
        e(CovidChart, {covidData: covidDataInUse, regions: selectedRegions, selectedTypes})
      ),
      e('div', {className: 'mb-0'},
        e(TableFilters, {groupByCountry, onGroupByCountries, countrySearchQuery, onCountrySearch})
      ),
      e('div', {className: 'mb-4'},
        e(RegionsTable, {
          covidData: covidDataInUse,
          selectedRegions,
          onRegionChange,
          countrySearchQuery,
          dataSort,
          dataSortDirection,
          onDataSort,
        })
      ),
    )
  );
}

function LastUpdatedDate({covidData}) {
  const lastUpdatedDate = getLastUpdatedDate(covidData);
  return e('small', {className: 'text-muted'},
    'Last updated: ',
    e('span', {className: 'badge badge-dark'}, lastUpdatedDate)
  );
}

function DataTypes({covidData, selectedRegions, selectedTypes, onTypeChange}) {
  const dataTypes = Object.values(covidDataTypes).map(dataType => {
    const checked = !!selectedTypes.includes(dataType.key);
    return e(DataType, {key: dataType.key, covidData, selectedRegions, dataType, checked, onTypeChange})
  });
  return e('form', {className: 'form-inline'}, dataTypes);
}

function DataType({covidData, selectedRegions, dataType, checked, onTypeChange}) {
  const alertClasses = {
    [covidDataTypes.confirmed.key]: 'alert alert-warning mr-3 mb-3',
    // [covidDataTypes.recovered.key]: 'alert alert-success mr-3 mb-3',
    [covidDataTypes.deaths.key]: 'alert alert-danger mr-3 mb-3',
  };
  const badgeClasses = {
    [covidDataTypes.confirmed.key]: 'badge badge-warning ml-2 ',
    // [covidDataTypes.recovered.key]: 'badge badge-success ml-2 ',
    [covidDataTypes.deaths.key]: 'badge badge-danger ml-2 ',
  };
  const alertClass = alertClasses[dataType.key];
  const badgeClass = badgeClasses[dataType.key];
  const totalCount = getTotalCount(covidData, dataType.key, selectedRegions);
  const onChange = () => {
    onTypeChange(dataType.key);
  };
  return (
    e('label', {className: alertClass},
      e('div', {className: 'form-group form-check mb-0'},
        e('input', {type: 'checkbox', className: 'form-check-input', checked, onChange}),
        e('div', {className: 'form-check-label'},
          dataType.title,
          e('span', {className: badgeClass}, totalCount.toLocaleString())
        )
      )
    )
  )
}

function CovidChart({covidData, regions, selectedTypes}) {
  const canvasRef = r.useRef(null);
  const chartRef = r.useRef(null);
  const [screenWidth, screenHeight] = useWindowSize();

  let aspectRatio = 1;
  if (screenWidth > 450 && screenWidth <= 700) {
    aspectRatio = 2;
  } else if (screenWidth > 700 && screenWidth <= 1000) {
    aspectRatio = 3;
  } else if (screenWidth > 1000) {
    aspectRatio = 4;
  }

  r.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const labels = covidData.labels
      .slice(covidSchema.dateStartColumn)
      .map(formatDateLabel);
    const datasets = [];
    regions.forEach((regionKey, regionIndex) => {
      selectedTypes.forEach(dataTypeKey => {
        let ticks = [];
        if (regionKey === covidCountries.all.key) {
          ticks = getGlobalTicks(covidData, dataTypeKey);
        } else {
          const regionIndex = getRegionIndexByKey(covidData, dataTypeKey, regionKey);
          ticks = covidData.ticks[dataTypeKey][regionIndex].slice(covidSchema.dateStartColumn);
        }
        const paletteDepth = covidDataTypes[dataTypeKey].borderColor.length;
        const dataset = {
          label: `${covidDataTypes[dataTypeKey].title} (${regionKey})`,
          data: ticks,
          borderWidth: 1,
          borderColor: covidDataTypes[dataTypeKey].borderColor[regionIndex % paletteDepth],
          fill: false,
        };
        datasets.push(dataset);
      });
    });
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {labels, datasets},
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio,
      },
    });
  }, [selectedTypes, regions, aspectRatio]);
  return e('canvas', {ref: canvasRef});
}

function TableFilters({groupByCountry, onGroupByCountries, countrySearchQuery, onCountrySearch}) {
  return (
    e('form', {className: 'form-inline'},
      e('div', {className: 'form-group mr-3 mb-2'},
        e(CountrySearch, {countrySearchQuery, onCountrySearch})
      ),
      e('div', {className: 'form-group form-check mb-2'},
        e(CountryGrouper, {groupByCountry, onGroupByCountries})
      )
    )
  );
}

function CountrySearch({countrySearchQuery, onCountrySearch}) {
  return (
    e('input', {
      type: 'search',
      className: 'form-control',
      placeholder: 'Search country',
      onChange: (e) => onCountrySearch(e.target.value),
      value: countrySearchQuery,
    })
  );
}

function CountryGrouper({groupByCountry, onGroupByCountries}) {
  return (
    e('label', null,
      e('input', {type: 'checkbox', className: 'form-check-input', onChange: onGroupByCountries, checked: groupByCountry}),
      e('div', {className: 'form-check-label'}, 'Group by countries')
    )
  )
}

function RegionsTable({
  covidData,
  selectedRegions,
  onRegionChange,
  countrySearchQuery,
  dataSort,
  dataSortDirection,
  onDataSort,
}) {
  const tHead = (
    e('thead', {className: 'thead-dark'},
      e('tr', null,
        e('th', null, ''),
        e('th', null, ''),
        e('th', null, 'Regions'),
        e('th', null, 'Confirmed'),
        // e('th', null, 'Recovered'),
        e('th', null, 'Deaths'),
      ),
    )
  );
  const rows = getCovidRegions(covidData)
    .filter((region) => {
      if (!countrySearchQuery) {
        return true;
      }
      return region.key.search(new RegExp(countrySearchQuery, 'i')) >= 0;
    })
    .sort((regionA, regionB) => {
      let sortCriteriaA;
      let sortCriteriaB;
      switch (dataSort) {
        case covidSorts.country.key:
          sortCriteriaA = regionA.key;
          sortCriteriaB = regionB.key;
          break;
        default:
          sortCriteriaA = regionA.numbers[covidSorts[dataSort].dataKey];
          sortCriteriaB = regionB.numbers[covidSorts[dataSort].dataKey];
      }
      if (sortCriteriaA === sortCriteriaB) {
        return 0;
      }
      if (sortCriteriaA > sortCriteriaB) {
        return dataSortDirection === covidSortDirections.desc.key ? -1 : 1;
      }
      return dataSortDirection === covidSortDirections.desc.key ? 1 : -1;
    })
    .map((region, regionIndex) => {
      const checked = !!selectedRegions.includes(region.key);
      return (
        e('tr', {key: region.key, onClick: () => onRegionChange(region.key)},
          e('td', null, e('input', {type: 'checkbox', checked, onChange: () => {}})),
          e('td', null, e('small', {className: 'text-muted'}, `#${regionIndex}`)),
          e('td', null, region.key),
          e('td', null, region.numbers[covidDataTypes.confirmed.key]),
          // e('td', null, region.numbers[covidDataTypes.recovered.key]),
          e('td', null, region.numbers[covidDataTypes.deaths.key]),
        )
      );
    });
  const tBody = e('tbody', null, rows);
  return (
    e('div', null,
      e('div', {className: 'table-responsive covid-data-table-wrapper'},
        e('table', {className: 'table table-hover'}, tHead, tBody)
      ),
      e('small', {className: 'text-muted'}, '* Table is scrollable')
    )
  );
}

function ErrorMessage({errorMessage}) {
  return e('div', {className: 'alert alert-danger'}, errorMessage);
}

function Spinner() {
  return e(
    'div', {className: 'd-flex justify-content-center mt-5 mb-5'},
    e('div', {className: 'spinner-border'})
  );
}
