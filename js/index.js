// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [covidData, setCovidData] = r.useState(null);
  const [dataTypes, setDataTypes] = r.useState(Object.keys(covidDataTypes));
  const [regions, setRegions] = r.useState([covidCountries.all.key]);
  const onRegionSelect = () => {};
  const onTypeSelect = (dataTypeKey) => {
    if (dataTypes.includes(dataTypeKey)) {
      const newDataTypes = [...dataTypes.filter(dataType => dataType !== dataTypeKey)];
      setDataTypes(newDataTypes);
    } else {
      const newDataTypes = [...dataTypes, dataTypeKey];
      setDataTypes(newDataTypes);
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
        e(CovidChart, {covidData, regions, dataTypes})
      ),
      e('div', {className: 'mb-4'},
        e(DataTypes, {covidData, selectedTypes: dataTypes, onTypeSelect})
      ),
      e('div', {className: 'mb-4'},
        e(Regions, {covidData, regions, onRegionSelect})
      ),
    )
  );
}

function DataTypes({selectedTypes, onTypeSelect}) {
  const dataTypes = Object.values(covidDataTypes).map(dataType => {
    const checkboxId = `data-type-${dataType.key}`;
    const checked = selectedTypes.includes(dataType.key) ? 'checked' : null;
    return (
      e('div', {className: 'form-group form-check mr-3', key: dataType.key},
        e('input', {type: 'checkbox', id: checkboxId, className: 'form-check-input', checked, onChange: () => onTypeSelect(dataType.key)}),
        e('label', {className: 'form-check-label', htmlFor: checkboxId},
          dataType.title
        )
      )
    )
  });
  return (
    e('form', {className: 'form-inline'}, dataTypes)
  );
}

function CovidChart({covidData, regions, dataTypes}) {
  const canvasRef = r.useRef(null);
  const chartRef = r.useRef(null);
  r.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const labels = covidData.labels.slice(covidSchema.dateStartColumn);
    const datasets = [];
    regions.forEach(regionKey => {
      dataTypes.forEach(dataTypeKey => {
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
  }, [dataTypes, regions]);

  return e('canvas', {height: 100, ref: canvasRef});
}

function Regions({covidData, regions, onRegionSelect}) {
  const regionsTableRef = r.useRef(null);
  r.useEffect(() => {
    if (!regionsTableRef.current) {
      return;
    }
    $('#regions-table').bootstrapTable();
  }, []);
  const tHead = e(
    'thead', {className: 'thead-dark'},
    e(
      'tr', null,
      e('th', {'data-checkbox': false}, ''),
      e('th', {'data-field': 'region', 'data-sortable': true}, 'Regions'),
      e('th', {'data-field': 'confirmed', 'data-sortable': true}, 'Confirmed'),
      e('th', {'data-field': 'recovered', 'data-sortable': true}, 'Recovered'),
      e('th', {'data-field': 'deaths', 'data-sortable': true}, 'Deaths'),
    ),
  );
  const rows = getCovidRegions(covidData).map((region) => {
    return e(
      'tr', {key: region.name},
      e('td', null, e('input', {type: 'checkbox'})),
      e('td', null, region.name),
      e('td', null, region.numbers[covidDataTypes.confirmed.key]),
      e('td', null, region.numbers[covidDataTypes.recovered.key]),
      e('td', null, region.numbers[covidDataTypes.deaths.key]),
    );
  });
  const tBody = e('tbody', null, rows);
  return e(
    'table', {
      className: 'table table-hover table-sm',
      ref: regionsTableRef,
      id: 'regions-table',
      'data-toggle': 'table',
      'data-search': true,
      'data-height': 400,
      'data-sort-name': 'confirmed',
      'data-sort-order': 'desc',
      'data-sort-stable': true,
      'data-search-align': 'right',
      'data-click-to-select': false,
    },
    tHead,
    tBody
  );
}

function Spinner() {
  return e(
    'div', {className: 'd-flex justify-content-center'},
    e('div', {className: 'spinner-border'})
  );
}
