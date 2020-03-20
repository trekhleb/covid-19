// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [covidData, setCovidData] = r.useState(null);
  const [types, setTypes] = r.useState(Object.keys(covidDataTypes));
  const [regions, setRegions] = r.useState([covidCountries.all.key]);
  const onRegionSelect = (regionKey) => {

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
        e(CovidChart, {covidData, regions, types})
      ),
      e('div', {className: 'mb-4'},
        e(Regions, {covidData, regions, onRegionSelect})
      ),
    )
  );
}

function CovidChart({covidData, regions, types}) {
  const canvasRef = r.useRef(null);
  r.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    const labels = covidData.labels.slice(covidSchema.dateStartColumn);
    const datasets = [];
    regions.forEach(regionKey => {
      types.forEach(typeKey => {
        let ticks = [];
        if (regionKey === covidCountries.all.key) {
          ticks = getGlobalTicks(covidData, typeKey);
        } else {
          const regionIndex = getRegionIndexByKey(covidData, typeKey, regionKey);
          ticks = covidData.ticks[typeKey][regionIndex].slice(covidSchema.dateStartColumn);
        }
        const dataset = {
          label: `${covidDataTypes[typeKey].title} (${regionKey})`,
          data: ticks,
          borderWidth: 1,
          borderColor: covidDataTypes[typeKey].borderColor,
          backgroundColor: covidDataTypes[typeKey].backgroundColor,
          fill: false,
        };
        datasets.push(dataset);
      });
    });
    new Chart(ctx, {
      type: 'line',
      data: {labels, datasets},
      options: {},
    });
  }, [types, regions]);

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
