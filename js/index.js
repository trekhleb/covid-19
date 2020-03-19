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
  if (!covidData) {
    return e(Spinner);
  }
  return e('div', null, e(CovidChart, {covidData}));
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
        data: covidData[type][5].slice(4).map(count => parseInt(count, 10)),
        borderWidth: 1,
        borderColor: covidDataTypes[type].borderColor,
        backgroundColor: covidDataTypes[type].backgroundColor,
        fill: false,
      };
    });
    const labels = covidData[covidDataTypes.confirmed.key][0].slice(4);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {},
    });
  }, [types, countries]);
  return e('canvas', {height: 100, ref: canvasRef});
}

function Spinner() {
  return e('div', {className: 'spinner-border'});
}
