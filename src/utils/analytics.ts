import ReactGA from "react-ga4";

const MEASUREMENT_ID = "G-37Q39YBWQP";

export const initAnalytics = () => {
  ReactGA.initialize(MEASUREMENT_ID);
};

export const trackPageView = () => {
  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname,
  });
};