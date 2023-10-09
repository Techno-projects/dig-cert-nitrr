import { useState } from "react";
import { useLocation } from "react-router-dom";

const Events = () => {
  const location = useLocation();
  const [events, setEvents] = useState(location.state);
  console.log(events);
  (
    <>
    Hello
    </>
  );
}

export default Events;