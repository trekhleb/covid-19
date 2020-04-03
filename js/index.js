// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const defaultGroupByCountry = covidFilters.groupByCountry.defaultValue;
  const defaultSelectedTypes = covidFilters.selectedTypes.defaultValue;
  const defaultSelectedRegions = covidFilters.selectedRegions.defaultValue;
  const defaultUseLogScale = covidFilters.useLogScale.defaultValue;
  const defaultCountrySearchQuery = covidFilters.countrySearchQuery.defaultValue;
  const defaultDataSort = covidFilters.dataSort.defaultValue;
  const defaultDataSortDirection = covidFilters.dataSortDirection.defaultValue;

  const [covidData, setCovidData] = r.useState(null);
  const [covidDataByCountries, setCovidDataByCountries] = r.useState(null);
  const [errorMessage, setErrorMessage] = r.useState(null);

  const [groupByCountry, setGroupByCountry] = r.useState(defaultGroupByCountry);
  const [selectedTypes, setSelectedTypes] = r.useState(defaultSelectedTypes);
  const [selectedRegions, setSelectedRegions] = r.useState(defaultSelectedRegions);
  const [useLogScale, setUseLogScale] = r.useState(defaultUseLogScale);
  const [countrySearchQuery, setCountrySearchQuery] = r.useState(defaultCountrySearchQuery);

  const [dataSort, setDataSort] = r.useState(defaultDataSort);
  const [dataSortDirection, setDataSortDirection] = r.useState(defaultDataSortDirection);

  const onFiltersReset = () => {
    setGroupByCountry(defaultGroupByCountry);
    setSelectedTypes(defaultSelectedTypes);
    setSelectedRegions(defaultSelectedRegions);
    setUseLogScale(defaultUseLogScale);
    setCountrySearchQuery(defaultCountrySearchQuery);
    setDataSort(defaultDataSort);
    setDataSortDirection(defaultDataSortDirection);
    deleteFiltersFromUrl();
  };

  const onRegionChange = (changedRegionKey) => {
    let newRegions;
    if (selectedRegions.includes(changedRegionKey)) {
      newRegions = [...selectedRegions.filter(regionKey => regionKey !== changedRegionKey)];
      if (!newRegions.length) {
        newRegions = [covidCountries.all.key];
      }
    } else {
      newRegions = [...selectedRegions.filter(regionKey => regionKey !== covidCountries.all.key), changedRegionKey];
    }
    setSelectedRegions(newRegions);
    filterToUrl(covidFilters.selectedRegions.key, newRegions);
  };

  const onUseLogScale = (useLog) => {
    setUseLogScale(useLog);
    filterToUrl(covidFilters.useLogScale.key, useLog);
  };

  const onDataSort = (dataSortKey, dataSortDirectionKey) => {
    setDataSort(dataSortKey);
    setDataSortDirection(dataSortDirectionKey);
    filterToUrl(covidFilters.dataSort.key, dataSortKey);
    filterToUrl(covidFilters.dataSortDirection.key, dataSortDirectionKey);
  };

  const onTypeChange = (dataTypeKey) => {
    let newSelectedTypes;
    if (selectedTypes.includes(dataTypeKey)) {
      newSelectedTypes = [...selectedTypes.filter(dataType => dataType !== dataTypeKey)];
    } else {
      newSelectedTypes = [...selectedTypes, dataTypeKey];
    }
    setSelectedTypes(newSelectedTypes);
    filterToUrl(covidFilters.selectedTypes.key, newSelectedTypes);
  };

  const onCountrySearch = (query) => {
    const q = query || '';
    setCountrySearchQuery(q);
  };

  const onGroupByCountries = () => {
    const newGroupByCountry = !groupByCountry;
    setSelectedRegions(defaultSelectedRegions);
    setGroupByCountry(newGroupByCountry);
    filterToUrl(covidFilters.groupByCountry.key, newGroupByCountry);
    filterToUrl(covidFilters.selectedRegions.key, defaultSelectedRegions);
  };

  r.useEffect(() => {
    loadCovidData()
      .then((data) => {
        setCovidData(data);
        setCovidDataByCountries(groupCovidDataByCountries(data));
      })
      .catch(() => setErrorMessage('Cannot fetch the statistics data. It might be a network issue. Try to refresh the page.'));
  }, []);

  r.useEffect(() => {
    const populatedFilters = filtersFromUrl();

    if (populatedFilters.hasOwnProperty(covidFilters.groupByCountry.key)) {
      setGroupByCountry(populatedFilters[covidFilters.groupByCountry.key]);
    }

    if (populatedFilters.hasOwnProperty(covidFilters.useLogScale.key)) {
      setUseLogScale(populatedFilters[covidFilters.useLogScale.key]);
    }

    if (populatedFilters.hasOwnProperty(covidFilters.selectedTypes.key)) {
      setSelectedTypes(populatedFilters[covidFilters.selectedTypes.key]);
    }

    if (populatedFilters.hasOwnProperty(covidFilters.selectedRegions.key)) {
      setSelectedRegions(populatedFilters[covidFilters.selectedRegions.key]);
    }

    if (populatedFilters.hasOwnProperty(covidFilters.dataSort.key)) {
      setDataSort(populatedFilters[covidFilters.dataSort.key]);
    }

    if (populatedFilters.hasOwnProperty(covidFilters.dataSortDirection.key)) {
      setDataSortDirection(populatedFilters[covidFilters.dataSortDirection.key]);
    }
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
      e('div', {className: 'mb-2'},
        e(LastUpdatedDate, {covidData})
      ),
      e('div', {className: 'mb-1'},
        e(DataTypes, {covidData: covidDataInUse, selectedRegions, selectedTypes, onTypeChange})
      ),
      e('div', {className: 'mb-4'},
        e(CovidChart, {covidData: covidDataInUse, regions: selectedRegions, selectedTypes, useLogScale})
      ),
      e('div', {className: 'mb-0'},
        e(TableFilters, {
          onFiltersReset,
          groupByCountry,
          onGroupByCountries,
          countrySearchQuery,
          onCountrySearch,
          useLogScale,
          onUseLogScale,
        })
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

function CovidChart({covidData, regions, selectedTypes, useLogScale}) {
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
    const linearYAxisID = 'linearYAxis';
    const logYAxisID = 'logYAxis';
    const yAxesID = useLogScale ? logYAxisID : linearYAxisID;
    const datasets = [];
    regions.forEach((regionKey, regionIndex) => {
      selectedTypes.forEach(dataTypeKey => {
        let ticks = [];
        if (regionKey === covidCountries.all.key) {
          ticks = getGlobalTicks(covidData, dataTypeKey);
        } else {
          const regionIndex = getRegionIndexByKey(covidData, dataTypeKey, regionKey);
          if (regionIndex >= 0) {
            ticks = covidData.ticks[dataTypeKey][regionIndex];
          }
        }
        const paletteDepth = covidDataTypes[dataTypeKey].borderColor.length;
        const dataset = {
          label: `${covidDataTypes[dataTypeKey].title} (${regionKey})`,
          data: ticks.slice(covidSchema.dateStartColumn),
          borderWidth: 1,
          borderColor: covidDataTypes[dataTypeKey].borderColor[regionIndex % paletteDepth],
          fill: false,
          yAxisID: yAxesID,
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
        scales: {
          yAxes: [
            {
              id: linearYAxisID,
              type: 'linear',
              display: 'auto',
              ticks: {
                callback: (value, index, values) => {
                  return value.toLocaleString();
                }
              }
            },
            {
              id: logYAxisID,
              type: 'logarithmic',
              display: 'auto',
              ticks: {
                // callback: (value, index, values) => {
                //   const numbers = {
                //     '1000000000': '100B',
                //     '100000000': '100M',
                //     '10000000': '10M',
                //     '1000000': '1M',
                //     '100000': '100K',
                //     '10000': '10K',
                //     '1000': '1K',
                //     '100': '100',
                //     '10': '10',
                //     '0': '0',
                //   };
                //   if (numbers.hasOwnProperty(`${value}`)) {
                //     return numbers[`${value}`];
                //   }
                //   return null;
                // }
              }
            },
          ],
        },
      },
    });
  }, [useLogScale, selectedTypes, regions, aspectRatio]);
  return e('canvas', {ref: canvasRef}, 'Your browser does not support the canvas element.');
}

function TableFilters({
  onFiltersReset,
  groupByCountry,
  onGroupByCountries,
  countrySearchQuery,
  onCountrySearch,
  useLogScale,
  onUseLogScale,
}) {
  const onReset = (e) => {
    e.preventDefault();
    onFiltersReset();
  };

  return (
    e('form', {className: 'form-inline'},
      e('div', {className: 'form-group mr-3 mb-2'},
        e(CountrySearch, {countrySearchQuery, onCountrySearch})
      ),
      e('div', {className: 'form-group form-check mr-3 mb-2'},
        e(Toggle, {checked: groupByCountry, onChange: onGroupByCountries, text: 'Group by countries'})
      ),
      e('div', {className: 'form-group form-check mr-3 mb-2'},
        e(Toggle, {text: 'Logarithmic scale', onChange: onUseLogScale, checked: useLogScale})
      ),
      e('button', {className: 'btn btn-dark mb-2', onClick: onReset},
        e('i', {className: 'fas fa-trash-alt mr-2'}),
        'Reset Filters'
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
        e('th', {sortable: 'sortable', onClick: () => onColumnSort(covidSorts.mortality.key)},
          'Mortality',
          e(ColumnSorter, {sortDirection: dataSort === covidSorts.mortality.key ? dataSortDirection : null})
        ),
      ),
    )
  );
  const rows = getCovidRegions(covidData)
    .filter((region) => {
      if (!countrySearchQuery) {
        return true;
      }
      const escapedCountrySearchQuery = escapeRegExp(countrySearchQuery.trim());
      return region.key.search(
        new RegExp(escapedCountrySearchQuery, 'i')
      ) >= 0;
    })
    .sort((regionA, regionB) => {
      let sortCriteriaA;
      let sortCriteriaB;
      switch (dataSort) {
        case covidSorts.country.key:
          sortCriteriaA = regionA.key;
          sortCriteriaB = regionB.key;
          break;
        case covidSorts.mortality.key:
          sortCriteriaA = calculateMortality(
            regionA.numbers[covidDataTypes.confirmed.key],
            regionA.numbers[covidDataTypes.deaths.key]
          );
          sortCriteriaB = calculateMortality(
            regionB.numbers[covidDataTypes.confirmed.key],
            regionB.numbers[covidDataTypes.deaths.key]
          );
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
      const confirmedNumber = region.numbers[covidDataTypes.confirmed.key] >= 0 ? region.numbers[covidDataTypes.confirmed.key] : '';
      const recoveredNumber = region.numbers[covidDataTypes.recovered.key] >= 0 ? region.numbers[covidDataTypes.recovered.key] : '';
      const deathsNumber = region.numbers[covidDataTypes.deaths.key] >= 0 ? region.numbers[covidDataTypes.deaths.key] : '';

      const mortality = calculateMortality(
        region.numbers[covidDataTypes.confirmed.key],
        region.numbers[covidDataTypes.deaths.key]
      );
      let mortalityNumber = `${mortality}%`;

      return (
        e('tr', {key: region.key, onClick: () => onRegionChange(region.key)},
          e('td', null, e('input', {type: 'checkbox', checked, onChange: () => {}})),
          e('td', null, e('small', {className: 'text-muted'}, `#${regionIndex + 1}`)),
          e('td', null, region.key),
          e('td', null, confirmedNumber),
          e('td', null, recoveredNumber),
          e('td', null, deathsNumber),
          e('td', null, e('small', {className: 'text-muted'}, mortalityNumber)),
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

function Toggle({text, checked, onChange}) {
  return (
    e('label', {},
      e('div', {className: 'form-group form-check mb-0'},
        e('input', {
          type: 'checkbox',
          checked: checked,
          className: 'form-check-input',
          onChange: (event) => onChange(event.target.checked)
        }),
        e('div', {className: 'form-check-label'}, text)
      )
    )
  )
}
