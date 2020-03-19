// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [covidData, setCovidData] = r.useState(null);
  r.useEffect(() => {
    loadCovidData().then((data) => setCovidData(data));
  }, []);
  if (!covidData) {return e(Spinner);}
  console.log(covidData);
  return e(
    'div',
    null,
    e('div', {className: 'mb-4'}, e(CovidChart, {covidData})),
    e('div', {className: 'mb-4'}, e(Regions, {covidData})),
  );
}

function CovidChart({
  covidData,
  countries = [covidCountries.all.key],
  types = Object.keys(covidDataTypes),
}) {
  const canvasRef = r.useRef(null);
  r.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    const datasets = types.map((type) => {
      return {
        label: covidDataTypes[type].title,
        data: covidData.timeSeries[type][covidCountries.all.index].slice(covidDataSchema.dateStartColumn),
        borderWidth: 1,
        borderColor: covidDataTypes[type].borderColor,
        backgroundColor: covidDataTypes[type].backgroundColor,
        fill: false,
      };
    });
    const labels = covidData.labels.slice(covidDataSchema.dateStartColumn);
    new Chart(ctx, {
      type: 'line',
      data: {labels, datasets},
      options: {},
    });
  }, [types, countries]);
  return e('canvas', {height: 100, ref: canvasRef});
}

function Regions({covidData}) {
  if (!covidData) {
    return null;
  }
  const tHead = e(
    'thead',
    {className: 'thead-dark'},
    e(
      'tr',
      null,
      e('th', null, ''),
      e('th', null, 'Regions'),
      e('th', null, 'Confirmed'),
      e('th', null, 'Recovered'),
      e('th', null, 'Deaths'),
    ),
  );
  const rows = getCovidRegions(covidData).map((region) => {
    return e(
      'tr',
      {key: region.name},
      e('td', null, e('input', {type: 'checkbox'})),
      e('td', null, region.name),
      e('td', null, region.numbers[covidDataTypes.confirmed.key]),
      e('td', null, region.numbers[covidDataTypes.recovered.key]),
      e('td', null, region.numbers[covidDataTypes.deaths.key]),
    );
  });
  const tBody = e('tbody', null, rows);
  return e(
    'table',
    {className: 'table table-hover table-sm'},
    tHead,
    tBody
  );
}

function Spinner() {
  return e(
    'div',
    {className: 'd-flex justify-content-center'},
    e('div', {className: 'spinner-border'})
  );
}
