// pages/Alerts.jsx

const sampleEvents = [
  { id: 1, title: "Dumping near Park" },
  { id: 2, title: "Plastic bags on street" }
];

export default function Alerts() {
  return (
    <div className="page">
      <h2>Alerts</h2>

      {sampleEvents.map((e) => (
        <div key={e.id} className="card">
          <a href={`/alerts/${e.id}`}>{e.title}</a>
        </div>
      ))}
    </div>
  );
}
