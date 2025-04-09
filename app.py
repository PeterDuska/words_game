from flask import Flask, render_template, jsonify
from pathlib import Path

app = Flask(__name__)

def load_ladders(file_path):
    ladders = []
    with open(file_path, encoding="utf-8") as f:
        lines = [line.strip() for line in f]
        current = []
        for line in lines:
            if line == "":
                if current:
                    ladders.append(current)
                    current = []
            else:
                parts = line.split(",", 1)
                if len(parts) == 2:
                    word, definition = parts[0].strip(), parts[1].strip()
                    current.append({"word": word, "definition": definition})
        if current:
            ladders.append(current)
    return ladders

LADDERS = load_ladders("other_ladders.txt")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/ladders")
def api_ladders():
    return jsonify(LADDERS)

if __name__ == "__main__":
    app.run(debug=True)
