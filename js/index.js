// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [covidData, setCovidData] = r.useState(null);
  const [errorMessage, setErrorMessage] = r.useState(null);
  const [selectedTypes, setSelectedTypes] = r.useState(Object.keys(covidDataTypes));
  const [selectedRegions, setSelectedRegions] = r.useState([covidCountries.all.key]);
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

  const onTypeChange = (dataTypeKey) => {
    if (selectedTypes.includes(dataTypeKey)) {
      setSelectedTypes([...selectedTypes.filter(dataType => dataType !== dataTypeKey)]);
    } else {
      setSelectedTypes([...selectedTypes, dataTypeKey]);
    }
  };

  r.useEffect(() => {
    loadCovidData()
      .then((data) => setCovidData(data))
      .catch(() => setErrorMessage('Cannot fetch the statistics data. It might be a network issue. Try to refresh the page.'));
  }, []);

  if (errorMessage) {
    return e(ErrorMessage, {errorMessage});
  }
  if (!covidData) {
    return e(Spinner);
  }
  return (
    e('div', null,
      e('div', {className: 'mb-1'},
        e(DataTypes, {covidData, selectedRegions, selectedTypes, onTypeChange})
      ),
      e('div', {className: 'mb-4'},
        e(CovidChart, {covidData, regions: selectedRegions, selectedTypes})
      ),
      e('div', {className: 'mb-4'},
        e(Regions, {covidData, onRegionChange})
      ),
    )
  );
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
  let chartWidth = 100;
  let chartHeight = chartWidth * aspectRatio;

  r.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const labels = covidData.labels
      .slice(covidSchema.dateStartColumn)
      .map(dateLabel => {
        const date = new Date(dateLabel);
        const options = {year: 'numeric', month: 'short', day: '2-digit'};
        return date.toLocaleDateString('en-US', options);
      });
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

function DataTypes({covidData, selectedRegions, selectedTypes, onTypeChange}) {
  const dataTypes = Object.values(covidDataTypes).map(dataType => {
    const checked = selectedTypes.includes(dataType.key);
    return e(DataType, {key: dataType.key, covidData, selectedRegions, dataType, checked, onTypeChange})
  });
  return e('form', {className: 'form-inline'}, dataTypes);
}

function DataType({covidData, selectedRegions, dataType, checked, onTypeChange}) {
  const alertClasses = {
    [covidDataTypes.confirmed.key]: 'alert alert-warning mr-3 mb-3',
    [covidDataTypes.recovered.key]: 'alert alert-success mr-3 mb-3',
    [covidDataTypes.deaths.key]: 'alert alert-danger mr-3 mb-3',
  };
  const badgeClasses = {
    [covidDataTypes.confirmed.key]: 'badge badge-warning ml-2 ',
    [covidDataTypes.recovered.key]: 'badge badge-success ml-2 ',
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

function Regions({covidData, onRegionChange}) {
  const regionsTableRef = r.useRef(null);
  r.useEffect(() => {
    if (!regionsTableRef.current) {
      return;
    }
    $(regionsTableRef.current).bootstrapTable({
      onCheck: (row) => {
        onRegionChange(row.region);
      },
      onUncheck: (row) => {
        onRegionChange(row.region);
      },
    });
  }, [onRegionChange, covidData]);
  const tHead = e(
    'thead', {className: 'thead-dark'},
    e(
      'tr', null,
      e('th', {'data-checkbox': true}, ''),
      e('th', {'data-field': 'region', 'data-sortable': true}, 'Regions'),
      e('th', {'data-field': 'confirmed', 'data-sortable': true}, 'Confirmed'),
      e('th', {'data-field': 'recovered', 'data-sortable': true}, 'Recovered'),
      e('th', {'data-field': 'deaths', 'data-sortable': true}, 'Deaths'),
    ),
  );
  const rows = getCovidRegions(covidData).map((region) => {
    return e(
      'tr', {key: region.key},
      e('td', null),
      e('td', null, region.key),
      e('td', null, region.numbers[covidDataTypes.confirmed.key]),
      e('td', null, region.numbers[covidDataTypes.recovered.key]),
      e('td', null, region.numbers[covidDataTypes.deaths.key]),
    );
  });
  const tBody = e('tbody', null, rows);
  return e(
    'table', {
      className: 'table table-hover',
      ref: regionsTableRef,
      id: 'regions-table',
      'data-toggle': 'table',
      'data-search': true,
      'data-height': 400,
      'data-sort-name': 'confirmed',
      'data-sort-order': 'desc',
      'data-sort-stable': true,
      'data-search-align': 'left',
      'data-click-to-select': true,
      'data-checkbox-header': false,
    },
    tHead,
    tBody
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
