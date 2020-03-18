// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

// Constants.
const dataBaseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series';
const dataConfirmedURL = `${dataBaseURL}/time_series_19-covid-Confirmed.csv`;
const dataDeathsURL = `${dataBaseURL}/time_series_19-covid-Deaths.csv`;
const dataRecoveredURL = `${dataBaseURL}/time_series_19-covid-Recovered.csv`;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [dataConfirmed, setDataConfirmed] = r.useState(null);
  const [dataDeaths, setDataDeaths] = r.useState(null);
  const [dataRecovered, setDataRecovered] = r.useState(null);
  r.useEffect(() => {
    fetch(dataConfirmedURL)
      .then(response => response.text())
      .then(data => setDataConfirmed(data));
  }, []);
  return e('div', null, dataConfirmed);
}

function Button({onClick = () => {}, children = null}) {
  const type = 'button';
  const className = 'btn btn-dark';
  return e('button', {type, className, onClick}, children);
}
