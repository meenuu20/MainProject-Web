# NOTE: This data is simulated.
# Real YOLO + Raspberry Pi detections will replace this.

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Temporary in-memory storage (acts like a mini database)
events = [
    {
        "id": "evt-1",
        "title": "[SIMULATED] Dumping near Park",
        "location": "Sector 12",
        "time": datetime.now().isoformat()
    }
]

# GET: Frontend reads events
@app.route("/api/events", methods=["GET"])
def get_events():
    return jsonify(events)

# POST: AI / YOLO sends new event
@app.route("/api/events", methods=["POST"])
def add_event():
    data = request.json

    new_event = {
        "id": f"evt-{len(events) + 1}",
        "title": data.get("title", "Unknown Event"),
        "location": data.get("location", "Unknown"),
        "time": data.get("time", datetime.now().isoformat())
    }

    events.append(new_event)

    return jsonify({
        "status": "success",
        "event": new_event
    }), 201


if __name__ == "__main__":
    app.run(debug=True)

