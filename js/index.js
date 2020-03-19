// Globals.
const r = React;
const rd = ReactDOM;
const e = r.createElement;

document.addEventListener('DOMContentLoaded', () => {
  rd.render(e(App), document.getElementById('root'));
});

function App() {
  const [isLoading, setIsLoading] = r.useState(false);
  const [data, setData] = r.useState(null);
  r.useEffect(() => {
    setIsLoading(true);
    loadData().then((data) => {
      setData(data);
      setIsLoading(false);
    });
  }, []);
  if (isLoading) {
    return e(Spinner);
  }
  return e('div', null, 'data');
}

function Spinner() {
  return e('div', {className: 'spinner-border'});
}
