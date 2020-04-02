function useWindowSize() {
  const [width, setWidth] = React.useState(document.documentElement.clientWidth);
  const [height, setHeight] = React.useState(document.documentElement.clientHeight);
  React.useEffect(() => {
    const setSize = () => {
      setWidth(document.documentElement.clientWidth);
      setHeight(document.documentElement.clientHeight);
    };
    window.addEventListener('resize', setSize);
    window.addEventListener('orientationchange', setSize);
    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('orientationchange', setSize);
    }
  }, []);
  return [width, height];
}

// @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}