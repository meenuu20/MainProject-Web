// pages/EventDetail.jsx

import { useParams } from "react-router-dom";

export default function EventDetail() {
  const { id } = useParams();

  return (
    <div className="page">
      <h2>Event Details - {id}</h2>
      <p>Here you will see images, video, and more.</p>
    </div>
  );
}
