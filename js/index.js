// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [covidData, setCovidData] = r.useState(null);
  const [selectedTypes, setSelectedTypes] = r.useState(Object.keys(covidDataTypes));
  const [selectedRegions, setSelectedRegions] = r.useState([covidCountries.all.key]);
  const onRegionChange = (regionKey) => {
    if (selectedRegions.includes(regionKey)) {
      const newRegions = [...selectedRegions.filter(region => region !== regionKey)];
      if (newRegions.length) {
        setSelectedRegions(newRegions);
      } else {
        setSelectedRegions([covidCountries.all.key]);
      }
    } else {
      const newRegions = [...selectedRegions.filter(region => region !== covidCountries.all.key), regionKey];
      console.log(selectedRegions, newRegions);
      setSelectedRegions(newRegions);
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
    loadCovidData().then((data) => setCovidData(data));
  }, []);
  if (!covidData) {
    return e(Spinner);
  }
  console.log(covidData);
  return (
    e('div', null,
      e('div', {className: 'mb-4'},
        e(CovidChart, {covidData, regions: selectedRegions, selectedTypes})
      ),
      e('div', {className: 'mb-4'},
        e(DataTypes, {covidData, selectedRegions, selectedTypes, onTypeChange})
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
  r.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const labels = covidData.labels.slice(covidSchema.dateStartColumn);
    const datasets = [];
    regions.forEach(regionKey => {
      selectedTypes.forEach(dataTypeKey => {
        let ticks = [];
        if (regionKey === covidCountries.all.key) {
          ticks = getGlobalTicks(covidData, dataTypeKey);
        } else {
          const regionIndex = getRegionIndexByKey(covidData, dataTypeKey, regionKey);
          ticks = covidData.ticks[dataTypeKey][regionIndex].slice(covidSchema.dateStartColumn);
        }
        const dataset = {
          label: `${covidDataTypes[dataTypeKey].title} (${regionKey})`,
          data: ticks,
          borderWidth: 1,
          borderColor: covidDataTypes[dataTypeKey].borderColor,
          backgroundColor: covidDataTypes[dataTypeKey].backgroundColor,
          fill: false,
        };
        datasets.push(dataset);
      });
    });
    if (!chartRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {labels, datasets},
        options: {},
      });
    } else {
      chartRef.current.config.data = {labels, datasets};
      chartRef.current.update();
    }
  }, [selectedTypes, regions]);

  return e('canvas', {height: 100, ref: canvasRef});
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
    [covidDataTypes.confirmed.key]: 'alert alert-warning mr-3',
    [covidDataTypes.recovered.key]: 'alert alert-success mr-3',
    [covidDataTypes.deaths.key]: 'alert alert-danger mr-3',
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
          e('span', {className: badgeClass}, totalCount)
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
      e('td', {'data-checkbox': true}),
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
      'data-search-align': 'right',
      'data-click-to-select': true,
      'data-checkbox-header': false,
    },
    tHead,
    tBody
  );
}

function Spinner() {
  return e(
    'div', {className: 'd-flex justify-content-center mt-5 mb-5'},
    e('div', {className: 'spinner-border'})
  );
}