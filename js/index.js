// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function roundTwoDecimals(num) {
  return +(Math.round(num + "e+2")  + "e-2");
}

function App() {
  const [covidData, setCovidData] = r.useState(null);
  const [covidDataByCountries, setCovidDataByCountries] = r.useState(null);
  const [errorMessage, setErrorMessage] = r.useState(null);

  const [groupByCountry, setGroupByCountry] = r.useState(true);
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
  if (!covidData || !covidDataByCountries) {
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
          groupByCountry,
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
  const alertClass = covidDataTypes[dataType.key].alertClass;
  const badgeClass = covidDataTypes[dataType.key].badgeClass;
  const totalCount = getTotalCount(covidData, dataType.key, selectedRegions);
  const onChange = () => {
    onTypeChange(dataType.key);
  };
  return (
    e('label', {className: `alert ${alertClass} mr-3 mb-3`},
      e('div', {className: 'form-group form-check mb-0'},
        e('input', {type: 'checkbox', className: 'form-check-input', checked, onChange}),
        e('div', {className: 'form-check-label'},
          dataType.title,
          e('span', {className: `badge ${badgeClass} ml-2`}, totalCount.toLocaleString())
        )
      )
    )
  )
}

function Toggle({text, onValueChange}) {
  return (
      e('label', {},
          e('div', {className: 'form-group form-check mb-0'},
              e('input', {type: 'checkbox', className: 'form-check-input', onChange: (event) => onValueChange(event.target.checked)}),
              e('div', {className: 'form-check-label'},
                  text,
              )
          )
      )
  )
}

function CovidChart({covidData, regions, selectedTypes}) {
  const canvasRef = r.useRef(null);
  const chartRef = r.useRef(null);
  const [screenWidth, screenHeight] = useWindowSize();
  const [useLogarithmicScale, setUseLogarithmicScale] = r.useState(false);

  let aspectRatio = 1;
  if (screenWidth > 450 && screenWidth <= 700) {
    aspectRatio = 2;
  } else if (screenWidth > 700 && screenWidth <= 1000) {
    aspectRatio = 3;
  } else if (screenWidth > 1000) {
    aspectRatio = 4;
  }

  function toLogarithmicScale(ticks) {
    return ticks.map(t => {
      if(t <= 0){
        return t;
      }
      return roundTwoDecimals(Math.log(t))
    });
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
          data: useLogarithmicScale ? toLogarithmicScale(ticks) : ticks,
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
  }, [useLogarithmicScale, selectedTypes, regions, aspectRatio]);
  return e('div', {},
      e('canvas', {ref: canvasRef}),
      e(Toggle, {text: 'Logarithmic scale', onValueChange: setUseLogarithmicScale})
  );
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
  groupByCountry,
  covidData,
  selectedRegions,
  onRegionChange,
  countrySearchQuery,
  dataSort,
  dataSortDirection,
  onDataSort,
}) {
  const onColumnSort = (columnName) => {
    if (columnName === dataSort) {
      const newDataSortDirection =
        dataSortDirection === covidSortDirections.asc.key ? covidSortDirections.desc.key : covidSortDirections.asc.key;
      onDataSort(columnName, newDataSortDirection);
    } else {
      onDataSort(columnName, dataSortDirection);
    }
  };
  const tHead = (
    e('thead', {className: 'thead-dark'},
      e('tr', null,
        e('th', null, ''),
        e('th', null, ''),
        e('th', {sortable: 'sortable', onClick: () => onColumnSort(covidSorts.country.key)},
          groupByCountry ? 'Countries' : 'Regions',
          e(ColumnSorter, {sortDirection: dataSort === covidSorts.country.key ? dataSortDirection : null})
        ),
        e('th', {sortable: 'sortable', onClick: () => onColumnSort(covidSorts.confirmed.key)},
          covidDataTypes.confirmed.title,
          e(ColumnSorter, {sortDirection: dataSort === covidSorts.confirmed.key ? dataSortDirection : null})
        ),
        e('th', {sortable: 'sortable', onClick: () => onColumnSort(covidSorts.recovered.key)},
          covidDataTypes.recovered.title,
          e(ColumnSorter, {sortDirection: dataSort === covidSorts.recovered.key ? dataSortDirection : null})
        ),
        e('th', {sortable: 'sortable', onClick: () => onColumnSort(covidSorts.deaths.key)},
          covidDataTypes.deaths.title,
          e(ColumnSorter, {sortDirection: dataSort === covidSorts.deaths.key ? dataSortDirection : null})
        ),
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
          e('td', null, e('small', {className: 'text-muted'}, `#${regionIndex + 1}`)),
          e('td', null, region.key),
          e('td', null, region.numbers[covidDataTypes.confirmed.key]),
          e('td', null, region.numbers[covidDataTypes.recovered.key]),
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

function ColumnSorter({sortDirection}) {
  const className = sortDirection ? 'ml-2' : 'ml-2 text-muted';
  let sorter = null;
  if (!sortDirection) {
    sorter = e('i', {className: 'fas fa-sort'});
  } else if (sortDirection === covidSortDirections.asc.key) {
    sorter = e('i', {className: 'fas fa-sort-up'});
  } else {
    sorter = e('i', {className: 'fas fa-sort-down'});
  }
  return (
    e('span', {className}, sorter)
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
