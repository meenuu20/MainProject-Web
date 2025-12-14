# NOTE: This data is simulated.
# Real YOLO + Raspberry Pi detections will replace this.
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route("/api/events")
def get_events():
    return jsonify([
        {
            "id": "evt-1",
            "title": "[SIMULATED] Dumping near Park",
            "location": "Sector 12",
            "time": datetime.now().isoformat()
        }
    ])

if __name__ == "__main__":
    app.run(debug=True)
