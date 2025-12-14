from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route("/api/events")
def get_events():
    return jsonify([
        {
            "id": "evt-1",
            "title": "Dumping near Park",
            "location": "Sector 12",
            "time": datetime.now().isoformat()
        }
    ])

if __name__ == "__main__":
    app.run(debug=True)
