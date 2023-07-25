from flask import Flask, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

@app.route('/comments', methods=['GET'])
def get_comments():
    if os.path.exists('comments.json'):
        with open('comments.json', 'r') as f:
            comments = json.load(f)
        return jsonify(comments)
    else:
        return jsonify({'error': 'comments.json not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
