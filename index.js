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
  const [isLoading, setIsLoading] = r.useState(false);
  const [dataConfirmed, setDataConfirmed] = r.useState(null);
  const [dataDeaths, setDataDeaths] = r.useState(null);
  const [dataRecovered, setDataRecovered] = r.useState(null);
  r.useEffect(() => {
    setIsLoading(true);
    fetch(dataConfirmedURL)
      .then(response => response.text())
      .then(data => setDataConfirmed(data))
      .then(() => setIsLoading(false));
  }, []);
  if (isLoading) {
    return e(Spinner);
  }
  return e('div', null, 'data');
}

function Button({onClick = () => {}, children = null}) {
  const type = 'button';
  const className = 'btn btn-dark';
  return e('button', {type, className, onClick}, children);
}

function Spinner() {
  return e('div', {className: 'spinner-border'});
}
